/**
 * Typed API client for the LazyDev NestJS backend.
 *
 * Tenancy-aware by design: every method accepts an optional `installationId`
 * scope. In Mode A (self-hosted) it is a no-op; in Mode B (hosted) it becomes
 * a query param so every request is installation-scoped — the hard wall the
 * plan §2.1/§10 requires. No exceptions, including Overview KPIs.
 */

import type {
  AuditLogDto,
  DashboardMeta,
  DashboardMetrics,
  FeedbackRequest,
  FeedbackResponse,
  FeedbackStatus,
  Paginated,
  PaginatedJobs,
  RepositoryDto,
  RunDetailDto,
  RunStatus,
  SettingsDto,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3200';

interface ListRunsParams {
  installationId?: number;
  repo?: string;
  limit?: number;
  offset?: number;
  status?: RunStatus;
  search?: string;
}

function withScope(path: string, installationId?: number): string {
  if (installationId === undefined) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}installationId=${installationId}`;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} failed`, await res.text().catch(() => ''));
  }
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `POST ${path} failed`, await res.text().catch(() => ''));
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  // ── Dashboard ──────────────────────────────────────────────────────────

  /** GET /api/dashboard/metrics — exists in the backend today. */
  metrics(): Promise<DashboardMetrics> {
    return getJson<DashboardMetrics>('/api/dashboard/metrics');
  },

  /** GET /api/dashboard/meta — mode + auth discovery. */
  meta(): Promise<DashboardMeta> {
    return getJson<DashboardMeta>('/api/dashboard/meta');
  },

  // ── Runs ───────────────────────────────────────────────────────────────

  /** GET /api/dashboard/runs — paginated audit-log listing (planned endpoint). */
  listRuns(params: ListRunsParams = {}): Promise<Paginated<AuditLogDto>> {
    const qs = new URLSearchParams();
    if (params.installationId !== undefined) qs.set('installationId', String(params.installationId));
    if (params.repo) qs.set('repo', params.repo);
    if (params.limit !== undefined) qs.set('limit', String(params.limit));
    if (params.offset !== undefined) qs.set('offset', String(params.offset));
    if (params.status) qs.set('status', params.status);
    if (params.search) qs.set('search', params.search);
    const q = qs.toString();
    return getJson<Paginated<AuditLogDto>>(`/api/dashboard/runs${q ? `?${q}` : ''}`);
  },

  /** GET /api/dashboard/runs/:taskId — single run detail (planned endpoint). */
  getRun(taskId: string, installationId?: number): Promise<RunDetailDto> {
    return getJson<RunDetailDto>(withScope(`/api/dashboard/runs/${taskId}`, installationId));
  },

  /** POST /api/dashboard/runs/:taskId/feedback — HITL (planned endpoint). */
  sendFeedback(taskId: string, body: FeedbackRequest, installationId?: number): Promise<FeedbackResponse> {
    return postJson<FeedbackResponse>(withScope(`/api/dashboard/runs/${taskId}/feedback`, installationId), body);
  },

  /** GET /api/dashboard/runs/:taskId/feedback-status — is feedback pending? */
  getFeedbackStatus(taskId: string, installationId?: number): Promise<FeedbackStatus> {
    return getJson<FeedbackStatus>(withScope(`/api/dashboard/runs/${taskId}/feedback-status`, installationId));
  },

  /** POST /api/dashboard/repos/:repo/issues/:number/retry — re-enqueue a failed issue. */
  retryRun(repo: string, issueNumber: number, installationId?: number): Promise<{ ok: boolean; taskId: string }> {
    return postJson<{ ok: boolean; taskId: string }>(
      withScope(`/api/dashboard/repos/${encodeURIComponent(repo)}/issues/${issueNumber}/retry`, installationId),
      {},
    );
  },

  // ── Queues (Mode A only) ───────────────────────────────────────────────

  /** GET /api/dashboard/queues/:name/jobs?state= — BullMQ job listing. */
  listJobs(queueName: string, state?: string, limit = 50, offset = 0): Promise<PaginatedJobs> {
    const qs = new URLSearchParams();
    if (state) qs.set('state', state);
    qs.set('limit', String(limit));
    qs.set('offset', String(offset));
    return getJson<PaginatedJobs>(`/api/dashboard/queues/${queueName}/jobs?${qs.toString()}`);
  },

  /** POST /api/dashboard/queues/:name/jobs/:id/retry — retry a failed job. */
  retryJob(queueName: string, jobId: string): Promise<{ ok: boolean }> {
    return postJson<{ ok: boolean }>(`/api/dashboard/queues/${queueName}/jobs/${jobId}/retry`, {});
  },

  /** POST /api/dashboard/queues/:name/drain — drain failed jobs. */
  drainQueue(queueName: string, state = 'failed'): Promise<{ ok: boolean; count: number }> {
    return postJson<{ ok: boolean; count: number }>(`/api/dashboard/queues/${queueName}/drain`, { state });
  },

  // ── Repositories ───────────────────────────────────────────────────────

  /** GET /api/dashboard/repos — list onboarded repos. */
  listRepos(installationId?: number): Promise<RepositoryDto[]> {
    return getJson<RepositoryDto[]>(withScope('/api/dashboard/repos', installationId));
  },

  /** POST /api/dashboard/repos/:id/resync — re-trigger index sync. */
  resyncRepo(repoId: string): Promise<{ ok: boolean }> {
    return postJson<{ ok: boolean }>(`/api/dashboard/repos/${repoId}/resync`, {});
  },

  // ── Settings (Mode A only) ─────────────────────────────────────────────

  /** GET /api/dashboard/settings — safe config display (secrets masked). */
  getSettings(): Promise<SettingsDto> {
    return getJson<SettingsDto>('/api/dashboard/settings');
  },
};
