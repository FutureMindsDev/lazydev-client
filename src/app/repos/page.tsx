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


import { RepoCard } from '@/components/repo-card';
import { useRepos } from '@/hooks/use-dashboard';

/** Repositories page (plan §4.5) — onboarded repos with cache/onboarding status. */
export default function ReposPage() {
  const { data: repos, error, isLoading } = useRepos();

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-5 text-lg font-semibold">Repositories</h1>
      {error ? (
        <p className="text-sm text-failed">Failed to load repos: {error.message}</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : repos && repos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 p-8 text-center">
          <p className="text-sm text-muted-foreground">No repositories onboarded.</p>
          <p className="text-xs text-muted-foreground">
            Install the LazyDev GitHub App to start tracking repositories.
          </p>
        </div>
      )}
    </div>
  );
}
