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


import { AlertOctagon, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface FailureForensicsProps {
  feedback: string | null;
  repo?: string;
  issueNumber?: number;
}

/**
 * Failure forensics panel (plan §4.3) — shown only on FAILED runs.
 * Final validation feedback in a red-tinted log panel + Retry button.
 */
export function FailureForensics({ feedback, repo, issueNumber }: FailureForensicsProps) {
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<string | null>(null);

  const handleRetry = async () => {
    if (!repo || issueNumber === undefined) return;
    setRetrying(true);
    setRetryResult(null);
    try {
      const { api } = await import('@/lib/api');
      const result = await api.retryRun(repo, issueNumber);
      setRetryResult(`Re-enqueued as ${result.taskId}`);
    } catch {
      setRetryResult('Retry failed — check server logs');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <AlertOctagon className="h-4 w-4 text-failed" />
        <h4 className="text-sm font-semibold text-failed">Failure Forensics</h4>
      </div>

      <div className="overflow-x-auto rounded-md border border-failed/30 bg-failed/5 p-4">
        <pre className="font-mono-output whitespace-pre-wrap text-xs text-failed/90">
          {feedback ?? 'No validation feedback recorded.'}
        </pre>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleRetry}
          disabled={retrying || !repo || issueNumber === undefined}
          variant="outline"
          size="sm"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {retrying ? 'Retrying…' : 'Retry Run'}
        </Button>
        {retryResult && (
          <span className="text-xs text-muted-foreground">{retryResult}</span>
        )}
      </div>
    </div>
  );
}
