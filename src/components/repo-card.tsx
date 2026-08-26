'use client';

import { useState } from 'react';
import { GitBranch, RefreshCw, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { timeAgo, cn } from '@/lib/utils';
import type { RepositoryDto } from '@/lib/types';

const statusConfig = {
  indexed: { label: 'Indexed', color: 'text-success', bg: 'bg-success/15' },
  in_progress: { label: 'Syncing…', color: 'text-active', bg: 'bg-active/15' },
  pending: { label: 'Pending', color: 'text-waiting', bg: 'bg-waiting/15' },
  failed: { label: 'Failed', color: 'text-failed', bg: 'bg-failed/15' },
} as const;

/**
 * Repository card (plan §4.5).
 * Shows owner/name, default branch, onboarding status, indexed files,
 * auto-fix toggle, and re-sync button.
 */
export function RepoCard({ repo }: { repo: RepositoryDto }) {
  const [syncing, setSyncing] = useState(false);
  const [autoFix, setAutoFix] = useState(repo.autoFix);
  const cfg = statusConfig[repo.onboardingStatus];

  const handleResync = async () => {
    setSyncing(true);
    try {
      const { api } = await import('@/lib/api');
      await api.resyncRepo(repo.id);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">{repo.fullName}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Default: {repo.defaultBranch}</p>
          </div>
        </div>
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', cfg.bg, cfg.color)}>
          {cfg.label}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {repo.indexedFiles} files indexed
          </span>
          {repo.lastSync && (
            <span>Last sync: {timeAgo(repo.lastSync)}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setAutoFix(!autoFix)}
            className="flex items-center gap-2 text-sm"
          >
            {autoFix ? (
              <ToggleRight className="h-5 w-5 text-success" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-muted-foreground" />
            )}
            <span className={autoFix ? 'text-foreground' : 'text-muted-foreground'}>
              Auto-fix issues
            </span>
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResync}
            disabled={syncing}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
            {syncing ? 'Syncing…' : 'Re-sync'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
