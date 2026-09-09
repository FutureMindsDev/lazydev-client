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


import { useState } from 'react';
import { Send, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { useFeedbackStatus } from '@/hooks/use-dashboard';

const QUICK_CHIPS = [
  'Wrong file targeted',
  'Tests are failing due to flaky setup',
  'Scope too large — only fix point 2',
  'The fix introduces a new bug',
];

interface FeedbackPanelProps {
  taskId: string;
  isTerminal: boolean;
}

/**
 * Human-in-the-loop feedback panel (plan §4.3).
 * Submits to POST /api/dashboard/runs/:taskId/feedback.
 * Shows pending consumption indicator via /feedback-status polling.
 */
export function FeedbackPanel({ taskId, isTerminal }: FeedbackPanelProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: feedbackStatus } = useFeedbackStatus(taskId);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.sendFeedback(taskId, { feedback: text.trim() });
      setSubmitted(true);
      setText('');
      toast({
        title: 'Feedback submitted',
        description: `Pending consumption by pipeline for ${taskId}`,
        variant: 'success',
      });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to submit feedback';
      setError(msg);
      toast({ title: 'Feedback failed', description: msg, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = feedbackStatus?.pending ?? false;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-semibold">Human Feedback</h4>
        {isPending ? (
          <span className="flex items-center gap-1 rounded-full bg-retry/15 px-2 py-0.5 text-xs text-retry">
            <Clock className="h-3 w-3" /> Pending consumption
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" /> No pending feedback
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Feedback is consumed once by the running pipeline within 24h.
        {isTerminal && ' This run is terminal — feedback will apply on next retry.'}
      </p>

      {/* Quick-feedback chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => setText(chip)}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Type corrective feedback for the AI pipeline…"
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {error && <p className="text-xs text-failed">{error}</p>}
      {submitted && (
        <p className="flex items-center gap-1.5 text-xs text-success">
          <CheckCircle2 className="h-3.5 w-3.5" /> Feedback submitted — pending consumption by pipeline.
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!text.trim() || submitting}
        size="sm"
        className="w-fit"
      >
        <Send className="h-3.5 w-3.5" />
        {submitting ? 'Submitting…' : 'Submit Feedback'}
      </Button>
    </div>
  );
}
