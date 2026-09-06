'use client';

import Image from 'next/image';
import { useDashboardStore } from '@/stores/dashboard-store';
import { StatusStrip } from '@/components/status-strip';
import { KpiCard } from '@/components/kpi-card';
import { QueueSnapshot } from '@/components/queue-snapshot';
import { ThroughputChart } from '@/components/throughput-chart';
import { RecentRunsTable } from '@/components/recent-runs-table';
import { GrafanaPanel } from '@/components/grafana-panel';
import { queueDepth, queueDepthBand } from '@/lib/utils';

/** Overview screen (plan §4.1): 10-second answer to "is LazyDev healthy?" */
export default function OverviewPage() {
  const metrics = useDashboardStore((s) => s.metrics);
  const isLoading = useDashboardStore((s) => s.metricsLoading);
  const audit = metrics?.auditLogs;
  const counts = metrics?.queues?.['issue-processing'];

  const successRate = audit && audit.total > 0
    ? Math.round((audit.success / audit.total) * 100)
    : null;
  const depth = counts ? queueDepth(counts) : null;
  const band = depth !== null ? queueDepthBand(depth) : undefined;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border shadow-sm">
        <Image
          src="/lazydev-hero.jpeg"
          alt="A developer sleeping peacefully on a bed next to a laptop that is running code during the day, with pull requests being opened automatically."
          width={2752}
          height={1536}
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="h-32 w-full object-cover sm:h-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 flex items-center gap-3 p-4">
          <Image
            src="/LazyDev-icon.jpeg"
            alt="LazyDev logo"
            width={128}
            height={128}
            sizes="40px"
            className="h-10 w-10 rounded-xl border border-border object-cover shadow-sm"
          />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Overview</h1>
            <p className="text-xs text-muted-foreground">LazyDev control plane</p>
          </div>
        </div>
      </div>

      <StatusStrip />

      {/* KPI cards — row of 4 (plan §4.1) */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Success rate"
          value={isLoading ? '—' : successRate !== null ? `${successRate}%` : '—'}
          hint={audit ? `${audit.success}/${audit.total} resolved` : undefined}
        />
        <KpiCard
          label="Total resolved"
          value={isLoading ? '—' : audit?.total ?? '—'}
        />
        <KpiCard
          label="Failed runs"
          value={isLoading ? '—' : audit?.failed ?? '—'}
          hint={audit ? 'all-time' : undefined}
        />
        <KpiCard
          label="Queue depth"
          value={isLoading ? '—' : depth ?? '—'}
          hint={depth !== null ? `${counts?.waiting} waiting · ${counts?.active} active` : undefined}
          band={band}
        />
      </section>

      <ThroughputChart />

      <RecentRunsTable />

      <QueueSnapshot />

      <GrafanaPanel />
    </div>
  );
}
