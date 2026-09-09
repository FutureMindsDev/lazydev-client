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


import { useState } from 'react';
import { RotateCcw, Trash2, AlertCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useJobs } from '@/hooks/use-dashboard';
import { useDashboardStore } from '@/stores/dashboard-store';
import { timeAgo, cn } from '@/lib/utils';
import type { JobStateKey, QueueJob } from '@/lib/types';

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
 * Job list tabs + retry/drain actions + expandable detail.
 */
export function QueueJobs() {
  const [activeTab, setActiveTab] = useState<JobStateKey>('failed');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const metrics = useDashboardStore((s) => s.metrics);
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
            onClick={() => {
              setActiveTab(tab.key);
              setExpandedId(null);
            }}
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
                    <th className="w-8 px-3 py-2" />
                    <th className="px-5 py-2 font-medium">Job ID</th>
                    <th className="px-5 py-2 font-medium">Name</th>
                    <th className="px-5 py-2 font-medium">Repository</th>
                    <th className="px-5 py-2 font-medium">Attempts</th>
                    <th className="px-5 py-2 font-medium">Created</th>
                    <th className="px-5 py-2 font-medium">Error</th>
                    <th className="px-5 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <JobRow
                      key={job.id}
                      job={job}
                      expanded={expandedId === job.id}
                      onToggle={() =>
                        setExpandedId((prev) => (prev === job.id ? null : job.id))
                      }
                      onRetry={job.state === 'failed' ? () => handleRetry(job.id) : undefined}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function JobRow({
  job,
  expanded,
  onToggle,
  onRetry,
}: {
  job: QueueJob;
  expanded: boolean;
  onToggle: () => void;
  onRetry?: () => void;
}) {
  const repo = job.data?.repository ? String(job.data.repository) : null;
  const issueNumber = job.data?.issueNumber;
  const issueTitle = job.data?.title ? String(job.data.title) : null;
  const action = job.data?.action ? String(job.data.action) : null;
  const installationId = job.data?.installationId;

  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-muted/50">
        <td className="px-3 py-2.5 align-middle">
          <button
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>
        <td className="px-5 py-2.5 align-middle">
          <span className="font-mono-output text-xs">{job.id}</span>
        </td>
        <td className="px-5 py-2.5 align-middle text-sm">{job.name}</td>
        <td className="px-5 py-2.5 align-middle">
          {repo ? (
            <span className="font-mono-output text-xs text-muted-foreground">{repo}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>
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
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              title="Re-queues the job — the full issue-processing pipeline (ingestion → analysis → patch → PR) runs again from the start"
            >
              <RotateCcw className="h-3 w-3" /> Retry
            </Button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-muted/30">
          <td colSpan={8} className="px-5 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Job data
                </h4>
                <dl className="space-y-1 text-xs">
                  {repo && (
                    <div className="flex gap-2">
                      <dt className="w-28 shrink-0 text-muted-foreground">Repository</dt>
                      <dd className="font-mono-output">{repo}</dd>
                    </div>
                  )}
                  {issueNumber !== undefined && (
                    <div className="flex gap-2">
                      <dt className="w-28 shrink-0 text-muted-foreground">Issue #</dt>
                      <dd className="font-mono-output">{String(issueNumber)}</dd>
                    </div>
                  )}
                  {issueTitle && (
                    <div className="flex gap-2">
                      <dt className="w-28 shrink-0 text-muted-foreground">Title</dt>
                      <dd>{issueTitle}</dd>
                    </div>
                  )}
                  {action && (
                    <div className="flex gap-2">
                      <dt className="w-28 shrink-0 text-muted-foreground">Action</dt>
                      <dd className="font-mono-output">{action}</dd>
                    </div>
                  )}
                  {installationId !== undefined && (
                    <div className="flex gap-2">
                      <dt className="w-28 shrink-0 text-muted-foreground">Installation ID</dt>
                      <dd className="font-mono-output">{String(installationId)}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Timeline
                </h4>
                <dl className="space-y-1 text-xs">
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-muted-foreground">Created</dt>
                    <dd>{new Date(job.timestamp).toLocaleString()}</dd>
                  </div>
                  {job.processedOn && (
                    <div className="flex gap-2">
                      <dt className="w-28 shrink-0 text-muted-foreground">Processed</dt>
                      <dd>{new Date(job.processedOn).toLocaleString()}</dd>
                    </div>
                  )}
                  {job.finishedOn && (
                    <div className="flex gap-2">
                      <dt className="w-28 shrink-0 text-muted-foreground">Finished</dt>
                      <dd>{new Date(job.finishedOn).toLocaleString()}</dd>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-muted-foreground">State</dt>
                    <dd className="font-mono-output">{job.state}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-muted-foreground">Attempts</dt>
                    <dd className="font-mono-output">{job.attempts}</dd>
                  </div>
                </dl>
                {job.stackTrace && (
                  <div className="mt-3">
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Stack trace
                    </h4>
                    <pre className="max-h-48 overflow-auto rounded-md border border-border bg-background p-3 text-xs text-failed whitespace-pre-wrap break-words">
                      {job.stackTrace}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
