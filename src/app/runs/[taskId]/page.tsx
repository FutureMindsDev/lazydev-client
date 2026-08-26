'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, ExternalLink, AlertTriangle, Play, Square, Radio } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { PipelineTimeline } from '@/components/pipeline-timeline';
import { PatchViewer } from '@/components/patch-viewer';
import { FeedbackPanel } from '@/components/feedback-panel';
import { FailureForensics } from '@/components/failure-forensics';
import { Button } from '@/components/ui/button';
import { useRunDetail } from '@/hooks/use-dashboard';
import { useSimulatedPipeline } from '@/hooks/use-simulated-pipeline';
import { timeAgo } from '@/lib/utils';

/**
 * Run Detail — the flagship screen (plan §4.3).
 * Makes the AI pipeline black box into glass.
 * Includes a live pipeline simulation (Phase 3) that replays the stages
 * with animated transitions, simulating SSE events.
 */
export default function RunDetailPage() {
  const params = useParams<{ taskId: string }>();
  const taskId = params.taskId;
  const { data: run, error, isLoading } = useRunDetail(taskId);
  const [copiedId, setCopiedId] = useState(false);

  const { displayStages, isLive, currentNode, start, stop } = useSimulatedPipeline(
    run?.pipelineStages,
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-sm text-muted-foreground">Loading run…</p>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Link href="/runs" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to runs
        </Link>
        <p className="mt-4 text-sm text-failed">
          {error ? `Failed to load run: ${error.message}` : 'Run not found.'}
        </p>
      </div>
    );
  }

  const isFailed = run.status === 'FAILED';
  const copyTaskId = async () => {
    await navigator.clipboard.writeText(run.taskId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Back link */}
      <Link href="/runs" className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to runs
      </Link>

      {/* Header card */}
      <Card className="mb-5">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <StatusBadge status={run.status} />
                <a
                  href={`https://github.com/${run.repo}/issues/${run.issueNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-semibold hover:underline"
                >
                  #{run.issueNumber} · {run.issueTitle}
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              </div>
              {run.repo && (
                <p className="text-xs text-muted-foreground">
                  Repo: <span className="font-mono-output">{run.repo}</span>
                  {run.branch && <> · Branch: <span className="font-mono-output">{run.branch}</span></>}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <button onClick={copyTaskId} className="flex items-center gap-1 hover:text-foreground">
                  {copiedId ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                  <span className="font-mono-output">{run.taskId}</span>
                </button>
                <span>Created {timeAgo(run.createdAt)}</span>
                <span>Validation attempts: <span className="font-mono-output">{run.validationAttempts}</span></span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unapplied changes warning */}
      {run.unappliedChanges && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-retry/30 bg-retry/10 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-retry" />
          <div>
            <p className="text-sm font-medium text-retry">Some hunks could not be applied</p>
            <p className="text-xs text-muted-foreground">{run.unappliedChanges}</p>
            <p className="mt-1 text-xs text-muted-foreground">Review before merging the PR.</p>
          </div>
        </div>
      )}

      {/* Pipeline timeline with live simulation controls */}
      <Card className="mb-5">
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Pipeline Timeline</CardTitle>
            {isLive && (
              <span className="flex items-center gap-1.5 rounded-full bg-active/15 px-2 py-0.5 text-xs text-active">
                <Radio className="h-3 w-3 animate-pulse" /> Live · {currentNode}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isLive ? (
              <Button variant="outline" size="sm" onClick={stop}>
                <Square className="h-3 w-3" /> Stop
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={start}>
                <Play className="h-3 w-3" /> Simulate Live
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {displayStages && <PipelineTimeline stages={displayStages} />}
        </CardContent>
      </Card>

      {/* Patch viewer */}
      <Card className="mb-5">
        <CardHeader><CardTitle>Patch</CardTitle></CardHeader>
        <CardContent>
          <PatchViewer
            patch={run.generatedPatch}
            prUrl={run.prUrl}
            unappliedChanges={run.unappliedChanges}
          />
        </CardContent>
      </Card>

      {/* Failure forensics (FAILED only) */}
      {isFailed && (
        <Card className="mb-5">
          <CardContent className="p-5">
            <FailureForensics
              feedback={run.finalValidationFeedback}
              repo={run.repo}
              issueNumber={run.issueNumber}
            />
          </CardContent>
        </Card>
      )}

      {/* Human feedback panel */}
      <Card>
        <CardContent className="p-5">
          <FeedbackPanel taskId={run.taskId} isTerminal={isFailed || run.status === "SUCCESS"} />
        </CardContent>
      </Card>
    </div>
  );
}
