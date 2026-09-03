'use client';

import { useEffect, type ReactNode } from 'react';
import { useDashboardStore, METRICS_POLL_MS } from '@/stores/dashboard-store';

/**
 * App-level provider that triggers the initial runs fetch and polls
 * metrics on a 15s interval. Mounted once in layout.tsx so all pages
 * share the same store data — no duplicate /runs or /metrics calls.
 */
export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const fetchRuns = useDashboardStore((s) => s.fetchRuns);
  const fetchMetrics = useDashboardStore((s) => s.fetchMetrics);

  // Initial fetch of runs on mount.
  useEffect(() => {
    void fetchRuns();
  }, [fetchRuns]);

  // Poll metrics every 15s.
  useEffect(() => {
    void fetchMetrics();
    const id = setInterval(() => void fetchMetrics(), METRICS_POLL_MS);
    return () => clearInterval(id);
  }, [fetchMetrics]);

  return <>{children}</>;
}
