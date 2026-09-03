'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import type {
  DashboardMeta,
  FeedbackStatus,
  PaginatedJobs,
  RepositoryDto,
  RunDetailDto,
  RunStatus,
  SettingsDto,
} from '@/lib/types';

/** /meta is static per session; fetch once. */
export function useMeta() {
  return useSWR<DashboardMeta>('meta', () => api.meta(), {
    revalidateOnFocus: false,
    refreshInterval: 0,
  });
}

// ── Runs list (paginated, filtered) ───────────────────────────────────────

interface UseRunsParams {
  limit?: number;
  offset?: number;
  status?: RunStatus;
  search?: string;
}

export function useRuns(params: UseRunsParams) {
  const key = JSON.stringify(['runs-list', params]);
  return useSWR(
    key,
    () => api.listRuns({ limit: params.limit, offset: params.offset, status: params.status, search: params.search }),
    { keepPreviousData: true, revalidateOnFocus: true },
  );
}

// ── Run detail ────────────────────────────────────────────────────────────

export function useRunDetail(taskId: string | null) {
  return useSWR<RunDetailDto>(taskId ? ['run-detail', taskId] : null, () => api.getRun(taskId!), {
    refreshInterval: 0,
  });
}

export function useFeedbackStatus(taskId: string | null) {
  return useSWR<FeedbackStatus>(
    taskId ? ['feedback-status', taskId] : null,
    () => api.getFeedbackStatus(taskId!),
    { refreshInterval: 10_000 },
  );
}

// ── Queues ────────────────────────────────────────────────────────────────

export function useJobs(queueName: string, state?: string) {
  const key = JSON.stringify(['jobs', queueName, state]);
  return useSWR<PaginatedJobs>(key, () => api.listJobs(queueName, state), {
    refreshInterval: 10_000,
    keepPreviousData: true,
  });
}

// ── Repositories ──────────────────────────────────────────────────────────

export function useRepos() {
  return useSWR<RepositoryDto[]>('repos', () => api.listRepos(), { revalidateOnFocus: true });
}

// ── Settings ──────────────────────────────────────────────────────────────

export function useSettings() {
  return useSWR<SettingsDto>('settings', () => api.getSettings());
}
