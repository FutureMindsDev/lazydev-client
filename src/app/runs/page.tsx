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
