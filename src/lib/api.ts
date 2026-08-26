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
  Paginated,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3200';

interface ListRunsParams {
  installationId?: number;
  repo?: string;
  limit?: number;
  offset?: number;
  status?: 'SUCCESS' | 'FAILED';
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
  /** GET /api/dashboard/metrics — exists in the backend today. */
  metrics(): Promise<DashboardMetrics> {
    return getJson<DashboardMetrics>('/api/dashboard/metrics');
  },

  /** GET /api/dashboard/meta — mode + auth discovery. */
  meta(): Promise<DashboardMeta> {
    return getJson<DashboardMeta>('/api/dashboard/meta');
  },

  /** GET /api/dashboard/runs — paginated audit-log listing (planned endpoint). */
  listRuns(params: ListRunsParams = {}): Promise<Paginated<AuditLogDto>> {
    const qs = new URLSearchParams();
    if (params.installationId !== undefined) qs.set('installationId', String(params.installationId));
    if (params.repo) qs.set('repo', params.repo);
    if (params.limit !== undefined) qs.set('limit', String(params.limit));
    if (params.offset !== undefined) qs.set('offset', String(params.offset));
    if (params.status) qs.set('status', params.status);
    const q = qs.toString();
    return getJson<Paginated<AuditLogDto>>(`/api/dashboard/runs${q ? `?${q}` : ''}`);
  },

  /** GET /api/dashboard/runs/:taskId — single run detail (planned endpoint). */
  getRun(taskId: string, installationId?: number): Promise<AuditLogDto> {
    return getJson<AuditLogDto>(withScope(`/api/dashboard/runs/${taskId}`, installationId));
  },

  /** POST /api/dashboard/runs/:taskId/feedback — HITL (planned endpoint). */
  sendFeedback(taskId: string, body: FeedbackRequest, installationId?: number): Promise<{ ok: true }> {
    return postJson<{ ok: true }>(withScope(`/api/dashboard/runs/${taskId}/feedback`, installationId), body);
  },
};
