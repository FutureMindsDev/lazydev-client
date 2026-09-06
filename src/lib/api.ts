/**
 * Typed API client for the LazyDev NestJS backend (self-hosted only).
 *
 * Every endpoint maps 1:1 to the backend's /api/dashboard/* routes. There is
 * no multi-tenant scoping — the self-hosted deployment serves a single
 * installation.
 */

import type {
  AuditLogDto,
  ByokSettingsDto,
  DashboardMeta,
  DashboardMetrics,
  FeedbackRequest,
  FeedbackResponse,
  FeedbackStatus,
  GrafanaConfig,
  Paginated,
  PaginatedJobs,
  RepoIndexStats,
  RepositoryDto,
  RunDetailDto,
  RunStatus,
  SettingsDto,
  UpdateLlmSettingsRequest,
  ProviderConfigDto,
  CreateProviderConfigRequest,
  UpdateProviderConfigRequest,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3200';

interface ListRunsParams {
  repo?: string;
  limit?: number;
  offset?: number;
  status?: RunStatus;
  search?: string;
}

/**
 * Reads the CSRF token from the ld_csrf cookie (set by the backend on login)
 * for the double-submit cookie pattern. Returns undefined if no cookie is
 * present (e.g. in Mode A / token mode where CSRF is not enforced).
 */
function getCsrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|;\s*)ld_csrf=([^;]+)/);
  return match?.[1];
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} failed`, await res.text().catch(() => ''));
  }
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const csrf = getCsrfToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) {
    throw new ApiError(res.status, `POST ${path} failed`, await res.text().catch(() => ''));
  }
  return res.json() as Promise<T>;
}

async function putJson<T>(path: string, body: unknown): Promise<T> {
  const csrf = getCsrfToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) {
    throw new ApiError(res.status, `PUT ${path} failed`, await res.text().catch(() => ''));
  }
  return res.json() as Promise<T>;
}

async function deleteJson<T>(path: string): Promise<T> {
  const csrf = getCsrfToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    credentials: 'include',
  });
  if (!res.ok) {
    throw new ApiError(res.status, `DELETE ${path} failed`, await res.text().catch(() => ''));
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
    if (params.repo) qs.set('repo', params.repo);
    if (params.limit !== undefined) qs.set('limit', String(params.limit));
    if (params.offset !== undefined) qs.set('offset', String(params.offset));
    if (params.status) qs.set('status', params.status);
    if (params.search) qs.set('search', params.search);
    const q = qs.toString();
    return getJson<Paginated<AuditLogDto>>(`/api/dashboard/runs${q ? `?${q}` : ''}`);
  },

  /** GET /api/dashboard/runs/:taskId — single run detail (planned endpoint). */
  getRun(taskId: string): Promise<RunDetailDto> {
    return getJson<RunDetailDto>(`/api/dashboard/runs/${taskId}`);
  },

  /** POST /api/dashboard/runs/:taskId/feedback — HITL (planned endpoint). */
  sendFeedback(taskId: string, body: FeedbackRequest): Promise<FeedbackResponse> {
    return postJson<FeedbackResponse>(`/api/dashboard/runs/${taskId}/feedback`, body);
  },

  /** GET /api/dashboard/runs/:taskId/feedback-status — is feedback pending? */
  getFeedbackStatus(taskId: string): Promise<FeedbackStatus> {
    return getJson<FeedbackStatus>(`/api/dashboard/runs/${taskId}/feedback-status`);
  },

  /** POST /api/dashboard/repos/:repo/issues/:number/retry — re-enqueue a failed issue. */
  retryRun(repo: string, issueNumber: number): Promise<{ ok: boolean; taskId: string }> {
    return postJson<{ ok: boolean; taskId: string }>(
      `/api/dashboard/repos/${encodeURIComponent(repo)}/issues/${issueNumber}/retry`,
      {},
    );
  },

  // ── Queues ─────────────────────────────────────────────────────────────

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
  listRepos(): Promise<RepositoryDto[]> {
    return getJson<RepositoryDto[]>('/api/dashboard/repos');
  },

  /** POST /api/dashboard/repos/:id/resync — re-trigger index sync. */
  resyncRepo(repoId: string): Promise<{ ok: boolean }> {
    return postJson<{ ok: boolean }>(`/api/dashboard/repos/${repoId}/resync`, {});
  },

  // ── Settings ───────────────────────────────────────────────────────────

  /** GET /api/dashboard/settings — safe config display (secrets masked). */
  getSettings(): Promise<SettingsDto> {
    return getJson<SettingsDto>('/api/dashboard/settings');
  },

  /** PUT /api/dashboard/settings/llm — upsert BYOK LLM config. */
  updateLlmSettings(body: UpdateLlmSettingsRequest): Promise<ByokSettingsDto> {
    return putJson<ByokSettingsDto>('/api/dashboard/settings/llm', body);
  },

  /** DELETE /api/dashboard/settings/llm — remove BYOK config. */
  deleteLlmSettings(): Promise<{ ok: boolean }> {
    return deleteJson<{ ok: boolean }>('/api/dashboard/settings/llm');
  },

  // ── Provider config CRUD (multi-provider) ───────────────────────────────

  /** GET /api/dashboard/settings/providers — list saved provider configs. */
  listProviders(): Promise<ProviderConfigDto[]> {
    return getJson<ProviderConfigDto[]>('/api/dashboard/settings/providers');
  },

  /** POST /api/dashboard/settings/providers — create a new provider config. */
  createProvider(body: CreateProviderConfigRequest): Promise<ProviderConfigDto> {
    return postJson<ProviderConfigDto>('/api/dashboard/settings/providers', body);
  },

  /** PUT /api/dashboard/settings/providers/:id — update a provider config. */
  updateProvider(id: string, body: UpdateProviderConfigRequest): Promise<ProviderConfigDto> {
    return putJson<ProviderConfigDto>(`/api/dashboard/settings/providers/${id}`, body);
  },

  /** DELETE /api/dashboard/settings/providers/:id — delete a provider config. */
  deleteProvider(id: string): Promise<{ ok: boolean }> {
    return deleteJson<{ ok: boolean }>(`/api/dashboard/settings/providers/${id}`);
  },

  // ── Phase 3 additions ──────────────────────────────────────────────────

  /** GET /api/dashboard/grafana — Grafana embed config (plan §9). */
  getGrafanaConfig(): Promise<GrafanaConfig> {
    return getJson<GrafanaConfig>('/api/dashboard/grafana');
  },

  /** GET /api/dashboard/repos/:id/stats — Qdrant collection stats (plan §4.5). */
  getRepoStats(repoId: string): Promise<RepoIndexStats> {
    return getJson<RepoIndexStats>(`/api/dashboard/repos/${repoId}/stats`);
  },
};
