'use client';

/**
 * Copyright (c) 2026 FutureMindsDev. All rights reserved.
 *
 * LazyDev™ is a trademark of FutureMindsDev.
 * Organization : https://github.com/FutureMindsDev
 *
 * Authors:
 *   Arkar Chan Myae  <https://github.com/arkar-chanmyae>
 *   Khin Me Me Latt  <https://github.com/KhinMeMeLatt>
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */


import { create } from 'zustand';
import { api } from '@/lib/api';
import type { AuditLogDto, DashboardMetrics } from '@/lib/types';

/** Staleness threshold for runs data — refetch if older than this (ms). */
const RUNS_STALE_MS = 30_000;
/** Metrics polling interval (ms). */
export const METRICS_POLL_MS = 15_000;

interface DashboardStore {
  // ── Runs (fetched once with limit=200, reused by Overview + Runs pages) ──
  runs: AuditLogDto[];
  runsTotal: number;
  runsLoading: boolean;
  runsError: Error | null;
  runsUpdatedAt: number | null;
  fetchRuns: (force?: boolean) => Promise<void>;

  // ── Metrics (polled on an interval by DashboardDataProvider) ─────────────
  metrics: DashboardMetrics | null;
  metricsLoading: boolean;
  metricsError: Error | null;
  fetchMetrics: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  runs: [],
  runsTotal: 0,
  runsLoading: false,
  runsError: null,
  runsUpdatedAt: null,

  metrics: null,
  metricsLoading: false,
  metricsError: null,

  fetchRuns: async (force?: boolean) => {
    const { runsUpdatedAt, runsLoading } = get();
    if (!force && runsLoading) return;
    if (!force && runsUpdatedAt && Date.now() - runsUpdatedAt < RUNS_STALE_MS) return;

    set({ runsLoading: true, runsError: null });
    try {
      const res = await api.listRuns({ limit: 200, offset: 0 });
      set({
        runs: res.items,
        runsTotal: res.total,
        runsLoading: false,
        runsUpdatedAt: Date.now(),
      });
    } catch (err) {
      set({ runsLoading: false, runsError: err as Error });
    }
  },

  fetchMetrics: async () => {
    set({ metricsLoading: true });
    try {
      const data = await api.metrics();
      set({ metrics: data, metricsLoading: false, metricsError: null });
    } catch (err) {
      set({ metricsLoading: false, metricsError: err as Error });
    }
  },
}));
