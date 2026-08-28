'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import type { RepoIndexStats } from '@/lib/types';
import { Database, HardDrive, Layers, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

const statusColors: Record<RepoIndexStats['status'], string> = {
  green: 'bg-success/10 text-success border-success/30',
  yellow: 'bg-retry/10 text-retry border-retry/30',
  red: 'bg-failed/10 text-failed border-failed/30',
};

/**
 * Qdrant collection stats for a single repo (plan §4.5).
 * Shows vector size, point count, index status, and disk usage.
 */
export function RepoStats({ repoId }: { repoId: string }) {
  const { data, error, isLoading } = useSWR(
    `repo-stats-${repoId}`,
    () => api.getRepoStats(repoId),
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-xs text-muted-foreground">Index stats unavailable.</p>
    );
  }

  const stats = [
    {
      icon: Layers,
      label: 'Vectors',
      value: data.pointsCount.toLocaleString(),
      sub: `${data.indexedCount.toLocaleString()} indexed`,
    },
    {
      icon: Database,
      label: 'Collection',
      value: data.collectionName,
      sub: `${data.vectorSize}d · ${data.distance}`,
    },
    {
      icon: HardDrive,
      label: 'Disk Usage',
      value: formatBytes(data.diskUsageBytes),
      sub: data.lastIndexedAt ? `Indexed ${new Date(data.lastIndexedAt).toLocaleDateString()}` : 'Never indexed',
    },
    {
      icon: Activity,
      label: 'Status',
      value: data.status.toUpperCase(),
      sub: data.status === 'green' ? 'Healthy' : data.status === 'yellow' ? 'Indexing' : 'Error',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3 w-3" />
                {s.label}
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground font-mono-output truncate">
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground truncate">{s.sub}</p>
            </div>
          );
        })}
      </div>
      <div className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', statusColors[data.status])}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        Qdrant: {data.status === 'green' ? 'All shards active' : data.status === 'yellow' ? 'Partial index' : 'Collection error'}
      </div>
    </div>
  );
}
