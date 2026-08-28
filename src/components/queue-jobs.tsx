'use client';

import { useState } from 'react';
import { RotateCcw, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useJobs, useMetrics } from '@/hooks/use-dashboard';
import { timeAgo, cn } from '@/lib/utils';
import type { JobStateKey } from '@/lib/types';

const TABS: { key: JobStateKey; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'delayed', label: 'Delayed' },
  { key: 'failed', label: 'Failed' },
  { key: 'completed', label: 'Completed' },
];

const QUEUE_NAME = 'issue-processing';

/**
 * BullMQ inspector-lite (plan §4.4, Mode A only).
 * Job list tabs + retry/drain actions.
 */
export function QueueJobs() {
  const [activeTab, setActiveTab] = useState<JobStateKey>('failed');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const { data: metrics } = useMetrics();
  const { data, error, isLoading, mutate } = useJobs(QUEUE_NAME, activeTab);
  const jobs = data?.items ?? [];
  const { toast } = useToast();

  const counts = metrics?.queues?.[QUEUE_NAME] ?? {};

  const handleRetry = async (jobId: string) => {
    setActionMsg(null);
    try {
      const { api } = await import('@/lib/api');
      await api.retryJob(QUEUE_NAME, jobId);
      setActionMsg(`Retried job ${jobId}`);
      toast({ title: 'Job retried', description: jobId, variant: 'success' });
      mutate();
    } catch {
      setActionMsg('Retry failed');
      toast({ title: 'Retry failed', description: jobId, variant: 'error' });
    }
  };

  const handleDrain = async () => {
    setActionMsg(null);
    try {
      const { api } = await import('@/lib/api');
      const result = await api.drainQueue(QUEUE_NAME, activeTab);
      setActionMsg(`Drained ${result.count} jobs`);
      toast({ title: 'Queue drained', description: `${result.count} ${activeTab} jobs removed`, variant: 'warning' });
      mutate();
    } catch {
      setActionMsg('Drain failed');
      toast({ title: 'Drain failed', variant: 'error' });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Counts grid */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors',
              activeTab === tab.key
                ? 'border-foreground bg-muted'
                : 'border-border hover:bg-muted/50',
            )}
          >
            <span className="text-xs text-muted-foreground">{tab.label}</span>
            <span className="font-mono-output text-lg font-semibold tabular-nums">
              {counts[tab.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Jobs · {activeTab}</CardTitle>
          {activeTab === 'failed' && jobs.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDrain}>
              <Trash2 className="h-3.5 w-3.5" /> Drain failed
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {actionMsg && (
            <div className="border-b border-border px-5 py-2 text-xs text-muted-foreground">
              {actionMsg}
            </div>
          )}
          {error ? (
            <p className="p-5 text-sm text-failed">Failed to load jobs: {error.message}</p>
          ) : isLoading && jobs.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Loading…</p>
          ) : jobs.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No {activeTab} jobs.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2 font-medium">Job ID</th>
                    <th className="px-5 py-2 font-medium">Name</th>
                    <th className="px-5 py-2 font-medium">Attempts</th>
                    <th className="px-5 py-2 font-medium">Created</th>
                    <th className="px-5 py-2 font-medium">Error</th>
                    <th className="px-5 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-5 py-2.5 align-middle">
                        <span className="font-mono-output text-xs">{job.id}</span>
                      </td>
                      <td className="px-5 py-2.5 align-middle text-sm">{job.name}</td>
                      <td className="px-5 py-2.5 align-middle">
                        <span className="font-mono-output text-sm tabular-nums">{job.attempts}</span>
                      </td>
                      <td className="px-5 py-2.5 align-middle">
                        <span className="text-xs text-muted-foreground">{timeAgo(job.timestamp)}</span>
                      </td>
                      <td className="px-5 py-2.5 align-middle max-w-[300px]">
                        {job.failedReason ? (
                          <span className="flex items-center gap-1.5 text-xs text-failed">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span className="line-clamp-2">{job.failedReason}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 align-middle">
                        {job.state === 'failed' && (
                          <Button variant="outline" size="sm" onClick={() => handleRetry(job.id)}>
                            <RotateCcw className="h-3 w-3" /> Retry
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Deep metrics live in Grafana.{' '}
        <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="underline">
          Open Grafana ↗
        </a>
      </p>
    </div>
  );
}
