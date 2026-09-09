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


import { FileCode2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { useDashboardStore } from '@/stores/dashboard-store';
import { deriveRecentRuns } from '@/lib/derive';
import { timeAgo } from '@/lib/utils';

const COLUMNS = ['Issue', 'Title', 'Status', 'Attempts', 'Patch', 'Created'] as const;

/**
 * Last 10 runs table (plan §4.1). Row click → run detail (future).
 *
 * Rendered directly without TanStack Table — this is a 10-row read-only
 * display. TanStack Table v9 (with its new useTable/createCoreRowModel API)
 * will be wired for the future paginated Runs list where sorting/filtering
 * matter.
 */
export function RecentRunsTable() {
  const runs = useDashboardStore((s) => s.runs);
  const isLoading = useDashboardStore((s) => s.runsLoading);
  const recentRuns = deriveRecentRuns(runs, 10);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Recent runs</CardTitle>
        <span className="text-xs text-muted-foreground">{recentRuns.length} shown</span>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && recentRuns.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">Loading…</p>
        ) : recentRuns.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <p className="text-sm text-muted-foreground">No runs yet.</p>
            <p className="text-xs text-muted-foreground">
              Install the GitHub App webhook or trigger a test issue to see runs here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c} className="px-5 py-2 font-medium">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((run) => (
                  <tr
                    key={run.taskId}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-5 py-2.5 align-middle">
                      <span className="font-mono-output text-sm tabular-nums">#{run.issueNumber}</span>
                    </td>
                    <td className="px-5 py-2.5 align-middle">
                      <span className="line-clamp-1 max-w-[280px] text-sm">{run.issueTitle}</span>
                    </td>
                    <td className="px-5 py-2.5 align-middle">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="px-5 py-2.5 align-middle">
                      <span className="font-mono-output text-sm tabular-nums">
                        {run.validationAttempts}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 align-middle">
                      {run.hasPatch ? (
                        <FileCode2 className="h-4 w-4 text-muted-foreground" aria-label="Has patch" />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 align-middle">
                      <span className="text-xs text-muted-foreground">{timeAgo(run.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
