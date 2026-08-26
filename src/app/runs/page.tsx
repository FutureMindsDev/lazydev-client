'use client';

import { RunsTable } from '@/components/runs-table';

/** Runs list page (plan §4.2) — paginated audit-log table with filters. */
export default function RunsPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <h1 className="text-lg font-semibold">Runs</h1>
      <RunsTable />
    </div>
  );
}
