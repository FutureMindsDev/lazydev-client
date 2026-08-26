/**
 * Mock fixtures for the standalone (no-backend) dev mode.
 *
 * The /metrics fixture mirrors the real backend response shape exactly — see
 * src/dashboard/dashboard.controller.ts in the backend repo — so flipping
 * NEXT_PUBLIC_ENABLE_MOCKS=false needs zero component changes.
 */

import type { AuditLogDto, DashboardMeta, DashboardMetrics, Paginated } from '@/lib/types';

const NOW = Date.now();
const day = (n: number) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
};

const TITLES = [
  'Fix memory leak in connection pool',
  'Webhook signature verification fails for push events',
  'Sandbox container does not clean up on validation timeout',
  'Patch generator targets wrong overload of overloaded method',
  'Research agent returns stale embeddings after reindex',
  'Validator reports false-positive on flaky integration test',
  'Onboarding agent crashes on monorepo with workspaces',
  'Git agent opens PR against wrong base branch',
  'Planner produces empty implementationPlan for trivial typo fix',
  'Audit log missing taskId when issue payload has no task id',
  'Redis feedback key not consumed on early-exit validator',
  'Prometheus scrape target unreachable after port change',
  'Multi-tenant query leaks runs across installation ids',
  'BullMQ retry backoff ignores exponential config',
  'LLM token usage not recorded in audit log',
];

function makeRun(i: number): AuditLogDto {
  const status: AuditLogDto['status'] = i % 3 === 0 ? 'FAILED' : 'SUCCESS';
  const attempts = (i % 5) + 1;
  const hasPatch = status === 'SUCCESS' || i % 2 === 0;
  return {
    id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    taskId: `task-${String(i + 1).padStart(4, '0')}`,
    issueNumber: 100 + i,
    issueTitle: TITLES[i % TITLES.length],
    status,
    validationAttempts: attempts,
    finalValidationFeedback:
      status === 'FAILED'
        ? `Validation failed after ${attempts} attempts: test suite exited with code 1`
        : null,
    generatedPatch: hasPatch
      ? `diff --git a/src/example.ts b/src/example.ts\nindex 1a2b3c4..5d6e7f8 100644\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -10,7 +10,7 @@\n- const old = buggy();\n+ const fixed = safe();\n`
      : null,
    createdAt: day(i),
    installationId: null,
  };
}

const RUNS: AuditLogDto[] = Array.from({ length: 64 }, (_, i) => makeRun(i));

export const mockMetrics = (): DashboardMetrics => {
  const total = RUNS.length;
  const success = RUNS.filter((r) => r.status === 'SUCCESS').length;
  const failed = total - success;
  return {
    queues: {
      'issue-processing': {
        waiting: 3,
        active: 1,
        completed: success,
        failed,
        delayed: 0,
        paused: 0,
      },
    },
    auditLogs: { total, success, failed },
    status: 'operational',
    timestamp: new Date().toISOString(),
  };
};

export const mockMeta = (): DashboardMeta => ({
  deploymentMode: 'selfhosted',
  auth: 'none',
});

export const mockRuns = (limit: number, offset: number, status?: 'SUCCESS' | 'FAILED'): Paginated<AuditLogDto> => {
  let items = [...RUNS].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (status) items = items.filter((r) => r.status === status);
  const total = items.length;
  items = items.slice(offset, offset + limit);
  return { items, total, limit, offset };
};

export const mockRun = (taskId: string): AuditLogDto | undefined =>
  RUNS.find((r) => r.taskId === taskId);
