'use client';

import { useMetrics } from '@/hooks/use-dashboard';
import { StatusStrip } from '@/components/status-strip';
import { KpiCard } from '@/components/kpi-card';
import { QueueSnapshot } from '@/components/queue-snapshot';
import { ThroughputChart } from '@/components/throughput-chart';
import { RecentRunsTable } from '@/components/recent-runs-table';
import { queueDepth, queueDepthBand } from '@/lib/utils';

/** Overview screen (plan §4.1): 10-second answer to "is LazyDev healthy?" */
export default function OverviewPage() {
  const { data, isLoading } = useMetrics();
  const audit = data?.auditLogs;
  const counts = data?.queues?.['issue-processing'];

  const successRate = audit && audit.total > 0
    ? Math.round((audit.success / audit.total) * 100)
    : null;
  const depth = counts ? queueDepth(counts) : null;
  const band = depth !== null ? queueDepthBand(depth) : undefined;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Overview</h1>
      </header>

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
    </div>
  );
}
