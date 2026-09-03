/**
 * Client-side derivations from the raw audit-log list.
 *
 * Kept pure + unit-testable so the Overview components stay thin. When the
 * backend later exposes dedicated endpoints (per-run timestamps for the
 * throughput chart, a /runs?limit=10 for recent runs), these can be replaced
 * by direct fetches without touching the presentational components.
 */

import type { AuditLogDto, RecentRun, ThroughputBucket } from './types';

/** Format a Date as YYYY-MM-DD in the user's local timezone (not UTC). */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function deriveRecentRuns(runs: AuditLogDto[], limit: number): RecentRun[] {
  return [...runs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map((r) => ({
      taskId: r.taskId,
      issueNumber: r.issueNumber,
      issueTitle: r.issueTitle,
      status: r.status,
      validationAttempts: r.validationAttempts,
      hasPatch: Boolean(r.generatedPatch),
      createdAt: r.createdAt,
    }));
}

/** Buckets runs into the last `days` calendar days, oldest first. */
export function deriveThroughput(runs: AuditLogDto[], days: number): ThroughputBucket[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets: ThroughputBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.push({ date: localDateKey(d), success: 0, failed: 0 });
  }

  const idx = new Map(buckets.map((b, i) => [b.date, i]));
  const earliest = buckets[0]?.date;

  for (const r of runs) {
    // Convert the UTC timestamp to a local-date key so it matches bucket keys.
    const day = localDateKey(new Date(r.createdAt));
    if (day < (earliest ?? day)) continue;
    const i = idx.get(day);
    if (i === undefined) continue;
    if (r.status === 'SUCCESS') buckets[i].success += 1;
    else buckets[i].failed += 1;
  }

  return buckets;
}
