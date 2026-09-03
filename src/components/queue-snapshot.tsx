'use client';

import { useDashboardStore } from '@/stores/dashboard-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { queueDepth } from '@/lib/utils';
import type { JobStateKey } from '@/lib/types';

const SEGMENTS: { key: JobStateKey; label: string; color: string }[] = [
  { key: 'waiting', label: 'Waiting', color: 'bg-waiting' },
  { key: 'active', label: 'Active', color: 'bg-active' },
  { key: 'completed', label: 'Completed', color: 'bg-success' },
  { key: 'failed', label: 'Failed', color: 'bg-failed' },
  { key: 'delayed', label: 'Delayed', color: 'bg-retry' },
  { key: 'paused', label: 'Paused', color: 'bg-muted-foreground' },
];

/** Horizontal segmented bar of BullMQ counts (plan §4.1 queue snapshot). */
export function QueueSnapshot() {
  const metrics = useDashboardStore((s) => s.metrics);
  const isLoading = useDashboardStore((s) => s.metricsLoading);
  const counts = metrics?.queues?.['issue-processing'] ?? {};

  if (isLoading && !metrics) {
    return (
      <Card>
        <CardHeader><CardTitle>Queue snapshot</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Loading…</p></CardContent>
      </Card>
    );
  }

  const total = SEGMENTS.reduce((sum, s) => sum + (counts[s.key] ?? 0), 0) || 1;
  const depth = queueDepth(counts);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Queue snapshot · issue-processing</CardTitle>
        <p className="text-xs text-muted-foreground">In-flight depth: {depth}</p>
      </CardHeader>
      <CardContent>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {SEGMENTS.map((s) => {
            const v = counts[s.key] ?? 0;
            if (v === 0) return null;
            return (
              <div
                key={s.key}
                className={`${s.color} h-full`}
                style={{ width: `${(v / total) * 100}%` }}
                title={`${s.label}: ${v}`}
              />
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SEGMENTS.map((s) => (
            <div key={s.key} className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`h-2 w-2 rounded-sm ${s.color}`} />
                {s.label}
              </span>
              <span className="font-mono-output text-sm tabular-nums">{counts[s.key] ?? 0}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
