/**
 * Mock fixtures for the standalone (no-backend) dev mode.
 *
 * The /metrics fixture mirrors the real backend response shape exactly — see
 * src/dashboard/dashboard.controller.ts in the backend repo — so flipping
 * NEXT_PUBLIC_ENABLE_MOCKS=false needs zero component changes.
 */

import type {
  AuditLogDto,
  AuthSession,
  DashboardMeta,
  DashboardMetrics,
  FeedbackStatus,
  GrafanaConfig,
  Paginated,
  PaginatedJobs,
  PipelineStage,
  QueueJob,
  RepoIndexStats,
  RepositoryDto,
  RunDetailDto,
  SettingsDto,
} from '@/lib/types';

const NOW = Date.now();
const day = (n: number) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
};

const TITLES = [
  'Fix memory leak in connection pool',
  'Webhook signature verification fails for push events',
  'Sandbox container does not clean up on validation timeout',
  'Patch generator targets wrong overload of overloaded method',
  'Research agent returns stale embeddings after reindex',
  'Validator reports false-positive on flaky integration test',
  'Onboarding agent crashes on monorepo with workspaces',
  'Git agent opens PR against wrong base branch',
  'Planner produces empty implementationPlan for trivial typo fix',
  'Audit log missing taskId when issue payload has no task id',
  'Redis feedback key not consumed on early-exit validator',
  'Prometheus scrape target unreachable after port change',
  'Multi-tenant query leaks runs across installation ids',
  'BullMQ retry backoff ignores exponential config',
  'LLM token usage not recorded in audit log',
  'Sandbox network mode blocks legitimate npm registry access',
  'Qdrant collection not created for new repository onboarding',
  'GitHub App webhook replay attacks possible without nonce',
  'Orchestration graph deadlocks on concurrent validator loops',
  'Patch generator hallucinates symbol names not in codebase',
];

const REPOS = ['FutureMindsDev/lazy-issue-resolver', 'FutureMindsDev/my-portfolio', 'FutureMindsDev/khinmemelatt-portfolio'];
const BRANCHES = ['feat/fix-connection-pool', 'fix/webhook-verification', 'feat/sandbox-cleanup', 'main'];

function makeRun(i: number): AuditLogDto {
  const status: AuditLogDto['status'] = i % 3 === 0 ? 'FAILED' : 'SUCCESS';
  const attempts = (i % 5) + 1;
  const hasPatch = status === 'SUCCESS' || i % 2 === 0;
  return {
    id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    taskId: `task-${String(i + 1).padStart(4, '0')}`,
    issueNumber: 100 + i,
    issueTitle: TITLES[i % TITLES.length],
    status,
    validationAttempts: attempts,
    finalValidationFeedback:
      status === 'FAILED'
        ? `Validation failed after ${attempts} attempts: test suite exited with code 1\n  at ValidatorAgent.invoke (src/orchestration/agents/validator.agent.ts:45)\n  at StateGraph.node (src/orchestration/orchestration.service.ts:72)\n  FAIL src/test/integration/issue-resolver.spec.ts\n  ● Test suite: integration › issue resolver › should fix connection pool leak\n  Expected: pool.max === 10\n  Received: pool.max === undefined`
        : null,
    generatedPatch: hasPatch
      ? `diff --git a/src/connection/pool.ts b/src/connection/pool.ts\nindex 1a2b3c4..5d6e7f8 100644\n--- a/src/connection/pool.ts\n+++ b/src/connection/pool.ts\n@@ -10,7 +10,7 @@\n export class ConnectionPool {\n   private maxConnections = 10;\n-  private pool: Connection[] = [];\n+  private pool: Connection[] = new Array(this.maxConnections);\n \n   acquire(): Connection {\n-    return this.pool.pop() ?? this.create();\n+    const conn = this.pool.find(c => c && !c.inUse) ?? this.create();\n+    if (conn) conn.inUse = true;\n+    return conn;\n   }\n \n   release(conn: Connection): void {\n-    this.pool.push(conn);\n+    conn.inUse = false;\n   }\n }\n`
      : null,
    createdAt: day(i),
    installationId: null,
  };
}

const RUNS: AuditLogDto[] = Array.from({ length: 64 }, (_, i) => makeRun(i));

// ── Pipeline stages for run detail ────────────────────────────────────────

function makePipelineStages(run: AuditLogDto, i: number): PipelineStage[] {
  const isFailed = run.status === 'FAILED';
  const stages: PipelineStage[] = [
    {
      node: 'onboarding',
      label: 'Onboarding',
      status: 'completed',
      output: `Repository cloned: ${REPOS[i % REPOS.length]}\nWorktree created at /app/worktrees/${run.taskId}\nBase branch: main`,
    },
    {
      node: 'analyzer',
      label: 'Analyzer',
      status: 'completed',
      output: `Issue type: bug\nLikely files: src/connection/pool.ts, src/connection/pool.spec.ts\nSearch terms: ["connection pool", "memory leak", "max connections"]`,
    },
    {
      node: 'research',
      label: 'Research',
      status: 'completed',
      output: `Found 8 relevant code sections across 4 files.\nKey finding: ConnectionPool.acquire() creates new connections without tracking in-use state, leading to unbounded growth.\nRelevant symbols: ConnectionPool.acquire, ConnectionPool.release, ConnectionPool.create`,
    },
    {
      node: 'planner',
      label: 'Planner',
      status: 'completed',
      output: `## Implementation Plan\n1. Add \`inUse: boolean\` flag to Connection class\n2. Modify \`acquire()\` to find existing idle connections before creating new ones\n3. Modify \`release()\` to set \`inUse = false\` instead of pushing to array\n4. Initialize pool array with fixed size\n5. Update tests to verify pool size stays bounded`,
    },
    {
      node: 'patcher',
      label: 'Patcher',
      status: 'completed',
      output: `Modified: src/connection/pool.ts\nApplied 3 hunks successfully.`,
    },
    {
      node: 'validator',
      label: 'Validator',
      status: isFailed ? 'failed' : 'completed',
      attempt: run.validationAttempts,
      output: isFailed
        ? run.finalValidationFeedback ?? 'Validation failed'
        : `All tests passed.\n  ✓ src/test/connection/pool.spec.ts (8 tests)\n  ✓ src/test/integration/issue-resolver.spec.ts (3 tests)\nBuild succeeded.`,
    },
    {
      node: 'git',
      label: 'Git / PR',
      status: isFailed ? 'pending' : 'completed',
      output: isFailed
        ? undefined
        : `Branch: ${BRANCHES[i % BRANCHES.length]}\nPR #${200 + i}: ${run.issueTitle}\nCommits: 1\nFiles changed: 1`,
    },
  ];

  // For failed runs with multiple attempts, show the loop
  if (isFailed && run.validationAttempts > 1) {
    stages[5] = {
      ...stages[5],
      status: 'failed',
      attempt: run.validationAttempts,
      output: `Attempt ${run.validationAttempts}/5 failed.\n${run.finalValidationFeedback ?? ''}`,
    };
  }

  return stages;
}

// ── Public mock functions ─────────────────────────────────────────────────

export const mockMetrics = (): DashboardMetrics => {
  const total = RUNS.length;
  const success = RUNS.filter((r) => r.status === 'SUCCESS').length;
  const failed = total - success;
  return {
    queues: {
      'issue-processing': {
        waiting: 3,
        active: 1,
        completed: success,
        failed,
        delayed: 0,
        paused: 0,
      },
    },
    auditLogs: { total, success, failed },
    status: 'operational',
    timestamp: new Date().toISOString(),
  };
};

export const mockMeta = (): DashboardMeta => ({
  deploymentMode: 'selfhosted',
  auth: 'none',
});

export const mockRuns = (
  limit: number,
  offset: number,
  status?: 'SUCCESS' | 'FAILED',
  search?: string,
): Paginated<AuditLogDto> => {
  let items = [...RUNS].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (status) items = items.filter((r) => r.status === status);
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (r) =>
        r.issueTitle.toLowerCase().includes(q) ||
        String(r.issueNumber).includes(q) ||
        r.taskId.toLowerCase().includes(q),
    );
  }
  const total = items.length;
  items = items.slice(offset, offset + limit);
  return { items, total, limit, offset };
};

export const mockRun = (taskId: string): RunDetailDto | undefined => {
  const idx = RUNS.findIndex((r) => r.taskId === taskId);
  if (idx === -1) return undefined;
  const run = RUNS[idx];
  const isFailed = run.status === 'FAILED';
  return {
    ...run,
    repo: REPOS[idx % REPOS.length],
    branch: isFailed ? undefined : BRANCHES[idx % BRANCHES.length],
    prUrl: isFailed ? null : `https://github.com/${REPOS[idx % REPOS.length]}/pull/${200 + idx}`,
    unappliedChanges: idx % 7 === 0 ? 'Warning: 1 hunk could not be applied (file not found: src/legacy/conn.ts)' : null,
    triageContext: `Issue type: bug\nPriority: high\nLikely files: src/connection/pool.ts`,
    researchContext: `Found 8 relevant code sections across 4 files.\nKey finding: ConnectionPool.acquire() creates new connections without tracking in-use state.`,
    implementationPlan: `## Implementation Plan\n1. Add \`inUse: boolean\` flag to Connection class\n2. Modify \`acquire()\` to find idle connections\n3. Modify \`release()\` to set \`inUse = false\``,
    pipelineStages: makePipelineStages(run, idx),
    feedbackStatus: { pending: false, submittedAt: null },
  };
};

export const mockFeedbackStatus = (taskId: string): FeedbackStatus => {
  // Simulate: some tasks have pending feedback
  const idx = RUNS.findIndex((r) => r.taskId === taskId);
  return {
    pending: idx >= 0 && idx % 11 === 0,
    submittedAt: idx >= 0 && idx % 11 === 0 ? new Date(NOW - 60000).toISOString() : null,
  };
};

// ── Queue jobs ────────────────────────────────────────────────────────────

const JOB_NAMES = ['process-issue', 'validate-patch', 'create-pr', 'onboard-repo'];
const JOB_ERRORS = [
  'Webhook payload missing installation_id',
  'Sandbox timeout after 120s',
  'LLM rate limit exceeded (429)',
  'Git push rejected: non-fast-forward',
  'Qdrant connection refused',
  'TypeORM query failed: relation "audit_logs" does not exist',
];

function makeJob(i: number, state: QueueJob['state']): QueueJob {
  const isFailed = state === 'failed';
  return {
    id: `job-${String(i + 1).padStart(6, '0')}`,
    name: JOB_NAMES[i % JOB_NAMES.length],
    state,
    attempts: isFailed ? (i % 3) + 1 : 1,
    data: {
      taskId: `task-${String(i + 1).padStart(4, '0')}`,
      issueNumber: 100 + i,
      repo: REPOS[i % REPOS.length],
    },
    failedReason: isFailed ? JOB_ERRORS[i % JOB_ERRORS.length] : null,
    stackTrace: isFailed
      ? `Error: ${JOB_ERRORS[i % JOB_ERRORS.length]}\n    at IssueProcessor.process (src/ingestion/issue-processor.ts:52)\n    at BullMQQueue.run (node_modules/bullmq/dist/job.js:234)`
      : null,
    timestamp: day(i % 10),
    processedOn: state === 'active' || state === 'completed' ? day(i % 10) : null,
    finishedOn: state === 'completed' ? day(i % 10) : null,
  };
}

export const mockJobs = (state?: string, limit = 50, offset = 0): PaginatedJobs => {
  const allJobs: QueueJob[] = [];
  const stateMap: Record<string, number> = {
    waiting: 3, active: 1, completed: 43, failed: 6, delayed: 0, paused: 0,
  };
  for (const [st, count] of Object.entries(stateMap)) {
    for (let i = 0; i < count; i++) {
      allJobs.push(makeJob(i, st as QueueJob['state']));
    }
  }
  let items = state ? allJobs.filter((j) => j.state === state) : allJobs;
  const total = items.length;
  items = items.slice(offset, offset + limit);
  return { items, total, limit, offset };
};

// ── Repositories ──────────────────────────────────────────────────────────

export const mockRepos = (): RepositoryDto[] => [
  {
    id: 'repo-001',
    owner: 'FutureMindsDev',
    name: 'lazy-issue-resolver',
    fullName: 'FutureMindsDev/lazy-issue-resolver',
    defaultBranch: 'main',
    onboardingStatus: 'indexed',
    indexedFiles: 342,
    lastSync: day(1),
    autoFix: true,
    installationId: null,
  },
  {
    id: 'repo-002',
    owner: 'FutureMindsDev',
    name: 'my-portfolio',
    fullName: 'FutureMindsDev/my-portfolio',
    defaultBranch: 'main',
    onboardingStatus: 'indexed',
    indexedFiles: 87,
    lastSync: day(3),
    autoFix: true,
    installationId: null,
  },
  {
    id: 'repo-003',
    owner: 'FutureMindsDev',
    name: 'khinmemelatt-portfolio',
    fullName: 'FutureMindsDev/khinmemelatt-portfolio',
    defaultBranch: 'develop',
    onboardingStatus: 'in_progress',
    indexedFiles: 45,
    lastSync: day(0),
    autoFix: false,
    installationId: null,
  },
  {
    id: 'repo-004',
    owner: 'FutureMindsDev',
    name: 'experimental-app',
    fullName: 'FutureMindsDev/experimental-app',
    defaultBranch: 'main',
    onboardingStatus: 'failed',
    indexedFiles: 0,
    lastSync: day(5),
    autoFix: false,
    installationId: null,
  },
];

// ── Settings ──────────────────────────────────────────────────────────────

export const mockSettings = (): SettingsDto => ({
  llm: {
    provider: 'openai',
    model: 'gpt-4o',
    fallbackModel: 'ollama/llama3.1:8b',
  },
  sandbox: {
    networkMode: 'restricted',
    timeout: 120,
  },
  notifications: {
    discord: true,
    discordWebhookMasked: 'https://discord.com/api/webhooks/••••••••••••/••••••••',
  },
  queue: {
    concurrency: 3,
    maxAttempts: 5,
  },
  database: {
    type: 'postgres',
    hostMasked: '••••••••••••.rds.amazonaws.com',
  },
});

// ── Grafana embed config (Phase 3, plan §9) ───────────────────────────────

export const mockGrafana = (): GrafanaConfig => ({
  enabled: true,
  baseUrl: 'http://localhost:3001',
  dashboards: [
    {
      uid: 'lazydev-overview',
      title: 'Run Overview',
      embedUrl:
        'http://localhost:3001/d-solo/lazydev-overview/run-overview?panelId=1&from=now-24h&to=now&theme=dark&kiosk=tv',
      description: 'Success/failure rate over the last 24 hours',
    },
    {
      uid: 'lazydev-queues',
      title: 'Queue Depth',
      embedUrl:
        'http://localhost:3001/d-solo/lazydev-queues/queue-depth?panelId=2&from=now-6h&to=now&theme=dark&kiosk=tv',
      description: 'BullMQ queue depth by state (waiting/active/failed)',
    },
    {
      uid: 'lazydev-latency',
      title: 'Pipeline Latency',
      embedUrl:
        'http://localhost:3001/d-solo/lazydev-latency/pipeline-latency?panelId=1&from=now-7d&to=now&theme=dark&kiosk=tv',
      description: 'P50/P95 end-to-end run latency by stage',
    },
  ],
});

// ── Qdrant collection stats (Phase 3, plan §4.5) ──────────────────────────

export const mockRepoStats = (repoId: string): RepoIndexStats => {
  const stats: Record<string, RepoIndexStats> = {
    'repo-001': {
      repoId: 'repo-001',
      collectionName: 'lazy-issue-resolver',
      vectorSize: 1536,
      distance: 'Cosine',
      pointsCount: 3420,
      indexedCount: 3420,
      status: 'green',
      diskUsageBytes: 28_500_000,
      lastIndexedAt: day(1),
    },
    'repo-002': {
      repoId: 'repo-002',
      collectionName: 'my-portfolio',
      vectorSize: 1536,
      distance: 'Cosine',
      pointsCount: 870,
      indexedCount: 870,
      status: 'green',
      diskUsageBytes: 7_200_000,
      lastIndexedAt: day(3),
    },
    'repo-003': {
      repoId: 'repo-003',
      collectionName: 'khinmemelatt-portfolio',
      vectorSize: 1536,
      distance: 'Cosine',
      pointsCount: 450,
      indexedCount: 120,
      status: 'yellow',
      diskUsageBytes: 3_800_000,
      lastIndexedAt: day(0),
    },
    'repo-004': {
      repoId: 'repo-004',
      collectionName: 'experimental-app',
      vectorSize: 1536,
      distance: 'Cosine',
      pointsCount: 0,
      indexedCount: 0,
      status: 'red',
      diskUsageBytes: 0,
      lastIndexedAt: null,
    },
  };
  return (
    stats[repoId] ?? {
      repoId,
      collectionName: 'unknown',
      vectorSize: 1536,
      distance: 'Cosine',
      pointsCount: 0,
      indexedCount: 0,
      status: 'red',
      diskUsageBytes: 0,
      lastIndexedAt: null,
    }
  );
};

// ── Auth session (Phase 3, Mode B) ────────────────────────────────────────

export const mockAuthSession = (): AuthSession => ({
  authenticated: false,
});
