'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import type { AuditLogDto, DashboardMeta, DashboardMetrics } from '@/lib/types';
import { deriveRecentRuns, deriveThroughput } from '@/lib/derive';

/** Poll /metrics every 15s — plan §4.1 / §6. */
export function useMetrics() {
  return useSWR<DashboardMetrics>('metrics', () => api.metrics(), {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
}

/** /meta is static per session; fetch once. */
export function useMeta() {
  return useSWR<DashboardMeta>('meta', () => api.meta(), {
    revalidateOnFocus: false,
    refreshInterval: 0,
  });
}

/**
 * Recent runs + 14-day throughput, both derived from the runs list.
 *
 * In this Overview-only slice we fetch the runs list once (no polling) and
 * derive both the recent-runs table and the throughput chart client-side.
 * When the backend exposes dedicated endpoints later, swap the derivations
 * for direct fetches without touching the components.
 */
export function useRunsOverview(limit = 10) {
  const { data, error, isLoading } = useSWR(
    ['runs-overview', limit],
    () => api.listRuns({ limit: 200, offset: 0 }),
    { revalidateOnFocus: true, refreshInterval: 30_000 },
  );

  const runs: AuditLogDto[] = data?.items ?? [];
  const recentRuns = deriveRecentRuns(runs, limit);
  const throughput = deriveThroughput(runs, 14);

  return { recentRuns, throughput, error, isLoading };
}
