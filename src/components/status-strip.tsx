'use client';

import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboard-store';
import { timeAgo } from '@/lib/utils';

/** Big status pill from /metrics `status` + last-updated + auto-refresh indicator. */
export function StatusStrip() {
  const data = useDashboardStore((s) => s.metrics);
  const isLoading = useDashboardStore((s) => s.metricsLoading);
  const error = useDashboardStore((s) => s.metricsError);

  const operational = !error && data?.status === 'operational';
  const Icon = operational ? CheckCircle2 : AlertTriangle;
  const color = operational ? 'text-success' : 'text-failed';

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <Icon className={`h-5 w-5 ${color}`} aria-hidden />
      <div className="flex flex-col">
        <span className={`text-sm font-semibold ${color}`}>
          {isLoading ? 'Loading…' : operational ? 'Operational' : 'Degraded'}
        </span>
        <span className="text-xs text-muted-foreground">
          {data ? `Updated ${timeAgo(data.timestamp)}` : 'Awaiting first poll'}
        </span>
      </div>
      <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-active" />
        Auto-refresh 15s
      </span>
    </div>
  );
}
