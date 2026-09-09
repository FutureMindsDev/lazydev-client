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


import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileCode2, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useRuns } from '@/hooks/use-dashboard';
import { timeAgo, cn } from '@/lib/utils';
import type { RunStatus } from '@/lib/types';
import Link from 'next/link';

const PAGE_SIZE = 20;
const STATUS_FILTERS: { label: string; value: RunStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Failed', value: 'FAILED' },
];

/**
 * Paginated runs table with filters (plan §4.2).
 * Columns: Status badge, Issue (#n + title), Validation attempts,
 * Has patch, Created, Actions (Retry on FAILED).
 */
export function RunsTable() {
  const router = useRouter();
  const [status, setStatus] = useState<RunStatus | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useMemo(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const offset = page * PAGE_SIZE;
  const { data, error, isLoading } = useRuns({ limit: PAGE_SIZE, offset, status, search });
  const runs = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search issue # or title…"
            className="h-9 w-64 rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => { setStatus(f.value); setPage(0); }}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                status === f.value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">{total} total</span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {error ? (
            <p className="p-5 text-sm text-failed">Failed to load runs: {error.message}</p>
          ) : isLoading && runs.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Loading…</p>
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <p className="text-sm text-muted-foreground">No runs found.</p>
              <p className="text-xs text-muted-foreground">
                {search ? 'Try a different search term.' : 'Install the GitHub App webhook or trigger a test issue.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2 font-medium">Status</th>
                    <th className="px-5 py-2 font-medium">Issue</th>
                    <th className="px-5 py-2 font-medium">Attempts</th>
                    <th className="px-5 py-2 font-medium">Patch</th>
                    <th className="px-5 py-2 font-medium">Created</th>
                    <th className="px-5 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.taskId} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-5 py-2.5 align-middle">
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="px-5 py-2.5 align-middle">
                        <Link href={`/runs/${run.taskId}`} className="flex items-center gap-2 hover:underline">
                          <span className="font-mono-output text-sm tabular-nums">#{run.issueNumber}</span>
                          <span className="line-clamp-1 max-w-[300px] text-sm">{run.issueTitle}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-2.5 align-middle">
                        <span className={cn(
                          'font-mono-output text-sm tabular-nums',
                          run.validationAttempts >= 5 && 'text-failed',
                        )}>
                          {run.validationAttempts}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 align-middle">
                        {run.generatedPatch ? (
                          <FileCode2 className="h-4 w-4 text-muted-foreground" aria-label="Has patch" />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 align-middle">
                        <span className="text-xs text-muted-foreground">{timeAgo(run.createdAt)}</span>
                      </td>
                      <td className="px-5 py-2.5 align-middle">
                        {run.status === 'FAILED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              // Retry handled on run detail page
                              router.push(`/runs/${run.taskId}`);
                            }}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Retry
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
