# Backend API Implementation Spec

> **Generated from the frontend's actual code** — not from the plan doc.
> Every endpoint here is already called by the frontend with exact path,
> query params, request body, and expected response shape.
>
> **Source of truth:** `src/lib/api.ts` + `src/lib/types.ts` in the frontend repo.
> The frontend's MSW mock handlers (`src/mocks/handlers.ts` + `src/mocks/data.ts`)
> contain working reference implementations for every endpoint.

## Current state

| Endpoint | Status |
|---|---|
| `GET /api/dashboard/metrics` | **EXISTS** — works today |
| All others (16 endpoints) | **NEEDS BUILDING** |

The frontend runs entirely against MSW mocks. When you implement these
endpoints, the user flips `NEXT_PUBLIC_ENABLE_MOCKS=false` in `.env.local`
and the frontend hits the real backend with **zero code changes**.

## Base URL

All routes are under `Controller('api/dashboard')` (or `Controller('api/auth')`
for auth). The frontend calls `http://localhost:3200` by default
(configurable via `NEXT_PUBLIC_API_URL`).

## Entity changes needed

### `audit_logs` table — add `installationId` column

```sql
ALTER TABLE audit_logs ADD COLUMN installationId integer NULL;
```

The `AuditLog` entity needs:

```typescript
@Column({ nullable: true })
installationId: number | null;
```

This is the **tenancy wall** for Mode B (plan §2.1). In Mode A it stays
`null`. Every query in the new endpoints below must filter by
`installationId` when it's provided as a query param.

---

## Endpoints to implement

### 1. `GET /api/dashboard/meta` — mode + auth discovery

**Already called by:** sidebar (on every page load), login page.

```typescript
@Get('meta')
async getMeta(): Promise<DashboardMeta>
```

**Response:**
```typescript
interface DashboardMeta {
  deploymentMode: 'selfhosted' | 'hosted';
  auth: 'none' | 'token' | 'github-oauth';
  currentUser?: {
    login: string;
    avatarUrl: string;
    installations: number[];
  };
}
```

**Mode A (self-hosted, no auth):**
```json
{ "deploymentMode": "selfhosted", "auth": "none" }
```

**Mode B (hosted, authenticated):**
```json
{
  "deploymentMode": "hosted",
  "auth": "github-oauth",
  "currentUser": {
    "login": "octocat",
    "avatarUrl": "https://avatars.githubusercontent.com/u/1?v=4",
    "installations": [123, 456]
  }
}
```

**Implementation note:** Read from env vars / config. `currentUser` is
`undefined` when not authenticated. The frontend uses this to:
- Gate self-hosted-only nav items (Queues, Settings, Observability)
- Show login link / user avatar in sidebar
- Auto-redirect `/login` to `/` when `auth === 'none'`

---

### 2. `GET /api/dashboard/runs` — paginated audit log listing

**Called by:** Runs list page (`/runs`), Overview recent runs table.

```typescript
@Get('runs')
async listRuns(
  @Query('installationId') installationId?: number,
  @Query('repo') repo?: string,
  @Query('limit') limit?: number,    // default 50
  @Query('offset') offset?: number,  // default 0
  @Query('status') status?: 'SUCCESS' | 'FAILED',
  @Query('search') search?: string,
): Promise<Paginated<AuditLogDto>>
```

**Response:**
```typescript
interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

interface AuditLogDto {
  id: string;
  taskId: string;
  issueNumber: number;
  issueTitle: string;
  status: 'SUCCESS' | 'FAILED';
  validationAttempts: number;
  finalValidationFeedback: string | null;
  generatedPatch: string | null;
  createdAt: string;  // ISO string
  installationId?: number | null;
}
```

**Query behavior:**
- `search` matches against `issueTitle` (ILIKE), `issueNumber` (exact),
  and `taskId` (ILIKE) — OR'd together
- `status` filters by exact match
- `repo` filters by repo full name (requires joining or storing repo
  on the audit log — see endpoint #3 below)
- Sort by `createdAt DESC`
- `installationId` filters when provided (Mode B tenancy wall)

**Implementation note:** You already have `AuditLogService` with
`auditLogRepository`. Add a `listRuns()` method using TypeORM's
`findAndCount` with a `WhereClauseBuilder` pattern.

---

### 3. `GET /api/dashboard/runs/:taskId` — single run detail

**Called by:** Run Detail page (`/runs/:taskId`) — the flagship screen.

```typescript
@Get('runs/:taskId')
async getRun(
  @Param('taskId') taskId: string,
  @Query('installationId') installationId?: number,
): Promise<RunDetailDto>
```

**Response** (extends `AuditLogDto` with pipeline state):
```typescript
interface RunDetailDto extends AuditLogDto {
  repo?: string;
  branch?: string;
  prUrl?: string | null;
  unappliedChanges?: string | null;
  triageContext?: string | null;
  researchContext?: string | null;
  implementationPlan?: string | null;
  pipelineStages?: PipelineStage[];
  feedbackStatus?: FeedbackStatus;
}

interface PipelineStage {
  node: 'onboarding' | 'analyzer' | 'research' | 'tools' | 'planner'
      | 'patcher' | 'validator' | 'human_feedback' | 'git';
  label: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  output?: string;
  attempt?: number;
}
```

**404** if taskId not found → `HttpResponse(null, { status: 404 })`.

**Implementation note:** The `AuditLog` entity currently does NOT store
`repo`, `branch`, `prUrl`, `triageContext`, `researchContext`,
`implementationPlan`, or `unappliedChanges`. You have two options:

1. **Add columns** to `audit_logs` for these fields (recommended — they're
   all known at pipeline completion time from `AgentState`).
2. **Reconstruct** from `AgentState` if you persist graph state somewhere
   (Redis checkpoint, separate table).

The `pipelineStages` array is a **derived view** of the run's progress
through the LangGraph nodes. For completed runs, you can reconstruct it
from the audit log fields. For in-progress runs, see endpoint #14 (SSE).

**Fields to add to `AuditLog` entity:**
```typescript
@Column({ nullable: true }) repo: string;
@Column({ nullable: true }) branch: string;
@Column({ nullable: true }) prUrl: string;
@Column({ nullable: true }) unappliedChanges: string;
@Column({ type: 'text', nullable: true }) triageContext: string;
@Column({ type: 'text', nullable: true }) researchContext: string;
@Column({ type: 'text', nullable: true }) implementationPlan: string;
```

Update `AuditLogService.logPipelineOutcome()` to populate these from
`AgentState` — all the values already exist in the state object.

---

### 4. `POST /api/dashboard/runs/:taskId/feedback` — human-in-the-loop

**Called by:** Feedback panel on Run Detail.

```typescript
@Post('runs/:taskId/feedback')
async sendFeedback(
  @Param('taskId') taskId: string,
  @Body() body: FeedbackRequest,
  @Query('installationId') installationId?: number,
): Promise<FeedbackResponse>
```

**Request body:**
```typescript
interface FeedbackRequest {
  feedback: string;  // non-empty
}
```

**Response:**
```typescript
interface FeedbackResponse {
  ok: boolean;
  pending: boolean;
}
```

**400** if `feedback` is empty/whitespace.

**Implementation note:** This writes to the Redis feedback key that the
`human_feedback` node polls. You already have `HumanFeedbackService` (or
equivalent) — wire it here. The `pending` field indicates whether the
feedback has been consumed by the pipeline yet.

---

### 5. `GET /api/dashboard/runs/:taskId/feedback-status`

**Called by:** Feedback panel (polled via SWR every few seconds).

```typescript
@Get('runs/:taskId/feedback-status')
async getFeedbackStatus(
  @Param('taskId') taskId: string,
  @Query('installationId') installationId?: number,
): Promise<FeedbackStatus>
```

**Response:**
```typescript
interface FeedbackStatus {
  pending: boolean;
  submittedAt: string | null;  // ISO string or null
}
```

---

### 6. `POST /api/dashboard/repos/:repo/issues/:number/retry`

**Called by:** Failure forensics "Retry" button on Run Detail.

```typescript
@Post('repos/:repo/issues/:number/retry')
async retryRun(
  @Param('repo') repo: string,        // URL-encoded "owner/name"
  @Param('number') issueNumber: number,
  @Query('installationId') installationId?: number,
): Promise<{ ok: boolean; taskId: string }>
```

**Response:**
```json
{ "ok": true, "taskId": "task-lx4p2n" }
```

**Implementation note:** Re-enqueues the issue into the
`issue-processing` BullMQ queue. Return the new `taskId`.

---

### 7. `GET /api/dashboard/queues/:name/jobs` — BullMQ job listing

**Called by:** Queues page (`/queues`) — Mode A only.

```typescript
@Get('queues/:name/jobs')
async listJobs(
  @Param('name') queueName: string,
  @Query('state') state?: string,      // 'waiting'|'active'|'completed'|'failed'|'delayed'|'paused'
  @Query('limit') limit?: number,      // default 50
  @Query('offset') offset?: number,    // default 0
): Promise<PaginatedJobs>
```

**Response:**
```typescript
interface PaginatedJobs {
  items: QueueJob[];
  total: number;
  limit: number;
  offset: number;
}

interface QueueJob {
  id: string;
  name: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
  attempts: number;
  data: Record<string, unknown>;
  failedReason?: string | null;
  stackTrace?: string | null;
  timestamp: string;       // ISO string
  processedOn?: string | null;
  finishedOn?: string | null;
}
```

**Implementation note:** Use BullMQ's `queue.getJobs([state], start, end)`.
The `data` field is the job's `.data` payload. Convert all timestamps to
ISO strings.

---

### 8. `POST /api/dashboard/queues/:name/jobs/:id/retry`

**Called by:** Queue inspector "Retry" button.

```typescript
@Post('queues/:name/jobs/:id/retry')
async retryJob(
  @Param('name') queueName: string,
  @Param('id') jobId: string,
): Promise<{ ok: boolean }>
```

**Implementation note:** `await job.retry()` or `await queue.add(job.name, job.data)`.

---

### 9. `POST /api/dashboard/queues/:name/drain`

**Called by:** Queue inspector "Drain failed" button.

```typescript
@Post('queues/:name/drain')
async drainQueue(
  @Param('name') queueName: string,
  @Body() body: { state?: string },  // default 'failed'
): Promise<{ ok: boolean; count: number }>
```

**Implementation note:** `await queue.obliterate({ force: true })` or
iterate + remove jobs in the given state. Return the count removed.

---

### 10. `GET /api/dashboard/repos` — list onboarded repos

**Called by:** Repositories page (`/repos`).

```typescript
@Get('repos')
async listRepos(
  @Query('installationId') installationId?: number,
): Promise<RepositoryDto[]>
```

**Response:**
```typescript
interface RepositoryDto {
  id: string;
  owner: string;
  name: string;
  fullName: string;          // "owner/name"
  defaultBranch: string;
  onboardingStatus: 'pending' | 'indexed' | 'failed' | 'in_progress';
  indexedFiles: number;
  lastSync: string | null;   // ISO string
  autoFix: boolean;
  installationId: number | null;
}
```

**Implementation note:** If you have a `repositories` table, query it.
Otherwise, derive from GitHub App installations + Qdrant collection
metadata.

---

### 11. `POST /api/dashboard/repos/:id/resync`

**Called by:** Repo card "Re-sync" button.

```typescript
@Post('repos/:id/resync')
async resyncRepo(@Param('id') repoId: string): Promise<{ ok: boolean }>
```

**Implementation note:** Re-trigger the indexing pipeline (clone, chunk,
embed, upsert to Qdrant). Can be a BullMQ job or direct service call.

---

### 12. `GET /api/dashboard/settings` — safe config display (Mode A)

**Called by:** Settings page (`/settings`).

```typescript
@Get('settings')
async getSettings(): Promise<SettingsDto>
```

**Response:**
```typescript
interface SettingsDto {
  llm: {
    provider: 'openai' | 'ollama' | 'gemini' | 'deepseek';
    model: string;
    fallbackModel: string | null;
  };
  sandbox: {
    networkMode: 'none' | 'restricted' | 'unrestricted';
    timeout: number;
  };
  notifications: {
    discord: boolean;
    discordWebhookMasked: string | null;  // "https://discord.com/api/webhooks/••••/••••"
  };
  queue: {
    concurrency: number;
    maxAttempts: number;
  };
  database: {
    type: string;          // "postgres"
    hostMasked: string;    // "••••••.rds.amazonaws.com"
  };
}
```

**CRITICAL:** All secrets must be masked. Never return raw API keys,
webhook URLs, or database hosts. The frontend displays these read-only.

---

### 13. `GET /api/dashboard/grafana` — Grafana embed config (Mode A)

**Called by:** Grafana panels on Overview + Queues pages.

```typescript
@Get('grafana')
async getGrafanaConfig(): Promise<GrafanaConfig>
```

**Response:**
```typescript
interface GrafanaConfig {
  enabled: boolean;
  baseUrl: string;         // "http://localhost:3001"
  dashboards: GrafanaDashboard[];
}

interface GrafanaDashboard {
  uid: string;
  title: string;
  embedUrl: string;        // full URL with panelId, time range, kiosk=tv
  description?: string;
}
```

**Implementation note:** Return config from env vars. If Grafana isn't
configured, return `{ enabled: false, baseUrl: '', dashboards: [] }`.
The frontend handles the disabled state gracefully.

---

### 14. `GET /api/dashboard/repos/:id/stats` — Qdrant collection stats

**Called by:** Expandable "Index stats" on repo cards.

```typescript
@Get('repos/:id/stats')
async getRepoStats(@Param('id') repoId: string): Promise<RepoIndexStats>
```

**Response:**
```typescript
interface RepoIndexStats {
  repoId: string;
  collectionName: string;
  vectorSize: number;       // e.g. 1536
  distance: 'Cosine' | 'Dot' | 'Euclid';
  pointsCount: number;
  indexedCount: number;
  status: 'green' | 'yellow' | 'red';
  diskUsageBytes: number;
  lastIndexedAt: string | null;
}
```

**Implementation note:** Query Qdrant's `GET /collections/:name` endpoint.
Map its `status` field to green/yellow/red.

---

### 15. `GET /api/dashboard/events?taskId=` — SSE live pipeline (Phase 3)

**Called by:** Run Detail page when user clicks "Connect" in SSE mode.

```typescript
@Sse('events')
async getEvents(@Query('taskId') taskId: string): Promise<Observable<MessageEvent>>
```

**Event format** (Server-Sent Events `data:` line):
```typescript
interface PipelineEvent {
  taskId: string;
  node: 'onboarding' | 'analyzer' | 'research' | 'tools' | 'planner'
      | 'patcher' | 'validator' | 'human_feedback' | 'git';
  status: 'started' | 'completed' | 'failed';
  payload?: string;
  attempt?: number;
  timestamp: string;  // ISO string
}
```

**Implementation note:** Use NestJS `@Sse()` decorator with RxJS
`Observable`. Emit an event each time a LangGraph node transitions state.
The frontend's `usePipelineEvents` hook uses native `EventSource` — it
expects standard SSE format (`data: {json}\n\n`).

**Important:** MSW cannot intercept `EventSource` in the browser. This
endpoint only works against the real backend. The frontend has a
"Simulate" mode that provides the same UX without SSE.

---

### 16. `GET /api/auth/session` — current user (Mode B)

**Called by:** Login page.

```typescript
// Controller('api/auth')
@Get('session')
async getSession(): Promise<AuthSession>
```

**Response (unauthenticated):**
```json
{ "authenticated": false }
```

**Response (authenticated):**
```typescript
interface AuthSession {
  authenticated: boolean;
  user?: {
    login: string;
    avatarUrl: string;
    name: string | null;
    installations: number[];
  };
}
```

---

### 17. `POST /api/auth/logout` (Mode B)

```typescript
// Controller('api/auth')
@Post('logout')
async logout(): Promise<{ ok: boolean }>
```

---

### 18. `GET /api/auth/github` — OAuth initiation (Mode B)

**Not called via fetch** — the frontend does `window.location.href =
${baseUrl}/api/auth/github`. This is a redirect, not an API call.

```typescript
// Controller('api/auth')
@Get('github')
async githubAuth(@Req() req, @Res() res): Promise<void>
```

**Implementation note:** Standard GitHub OAuth flow — redirect to
`https://github.com/login/oauth/authorize?client_id=...&scope=repo`.
Callback at `/api/auth/github/callback` exchanges the code, sets a
session cookie, and redirects to `http://localhost:3000` (frontend).

---

## Implementation priority

If you want to implement incrementally (so the user can test page by
page), follow this order:

| Priority | Endpoint(s) | Unblocks |
|---|---|---|
| **P0** | #1 `meta` | Sidebar mode detection, login redirect |
| **P0** | #2 `runs` (list) | Runs page, Overview recent runs |
| **P0** | #3 `runs/:taskId` (detail) | Run Detail page — needs entity changes |
| **P1** | #4, #5 feedback | Feedback panel on Run Detail |
| **P1** | #6 retry | Failure forensics retry button |
| **P1** | #7, #8, #9 queues | Queues page (Mode A) |
| **P1** | #10, #11 repos | Repositories page |
| **P2** | #12 settings | Settings page (Mode A) |
| **P2** | #13 grafana | Grafana embeds (needs Grafana running) |
| **P2** | #14 repo stats | Qdrant stats on repo cards |
| **P3** | #15 SSE events | Live pipeline on Run Detail |
| **P3** | #16, #17, #18 auth | Mode B login flow |

## CORS

The frontend runs on `http://localhost:3000`, the backend on
`http://localhost:3200`. Enable CORS in `main.ts`:

```typescript
app.enableCors({
  origin: ['http://localhost:3000'],
  credentials: true,
});
```

## How to verify

After implementing, the user tests by:
1. Set `NEXT_PUBLIC_ENABLE_MOCKS=false` in `lazydev-frontend/.env.local`
2. Start the backend: `pnpm start:dev` (port 3200)
3. Start the frontend: `pnpm dev` (port 3000)
4. Every page should work against the real backend with zero frontend changes

The frontend's mock fixtures (`src/mocks/data.ts`) are reference
implementations — if your real responses match those shapes, everything
works.
