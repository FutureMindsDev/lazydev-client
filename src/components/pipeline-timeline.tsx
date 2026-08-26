'use client';

import { CheckCircle2, Circle, Loader2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { PipelineStage } from '@/lib/types';

const statusConfig = {
  completed: { icon: CheckCircle2, color: 'text-success', ring: 'border-success' },
  active: { icon: Loader2, color: 'text-active', ring: 'border-active' },
  failed: { icon: XCircle, color: 'text-failed', ring: 'border-failed' },
  pending: { icon: Circle, color: 'text-muted-foreground', ring: 'border-border' },
} as const;

/**
 * Vertical stepper mirroring the LangGraph nodes (plan §4.3).
 * Each node is expandable to show its output slice of AgentState.
 * The validator→patcher loop-back is shown as a dashed connector with
 * the attempt number when attempts > 1.
 */
export function PipelineTimeline({ stages }: { stages: PipelineStage[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['validator']));

  const toggle = (node: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(node)) next.delete(node);
      else next.add(node);
      return next;
    });
  };

  return (
    <div className="flex flex-col">
      {stages.map((stage, i) => {
        const cfg = statusConfig[stage.status];
        const Icon = cfg.icon;
        const isExpanded = expanded.has(stage.node);
        const showLoop = stage.node === 'validator' && (stage.attempt ?? 0) > 1;

        return (
          <div key={stage.node}>
            {/* Connector line */}
            {i > 0 && (
              <div className={cn('ml-[11px] h-6 w-0.5', stages[i - 1].status === 'completed' ? 'bg-success' : 'bg-border')} />
            )}
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggle(stage.node)}
                className="mt-0.5 flex items-center gap-2 text-left"
              >
                <Icon
                  className={cn('h-5 w-5 shrink-0', cfg.color, stage.status === 'active' && 'animate-spin')}
                  aria-hidden
                />
                <span className="text-sm font-medium">{stage.label}</span>
                {stage.attempt && stage.attempt > 1 && (
                  <span className="rounded bg-retry/15 px-1.5 py-0.5 text-xs text-retry">
                    attempt {stage.attempt}
                  </span>
                )}
                {stage.output && (
                  isExpanded
                    ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
            {/* Loop-back indicator */}
            {showLoop && (
              <div className="ml-[11px] flex items-center gap-2 py-1 pl-4">
                <div className="h-0.5 w-4 border-t-2 border-dashed border-retry" />
                <span className="text-xs text-retry">loops back to Patcher</span>
              </div>
            )}
            {/* Expandable output */}
            {isExpanded && stage.output && (
              <div className="ml-8 mb-2 mt-1 rounded-md border border-border bg-muted/50 p-3">
                <pre className="font-mono-output whitespace-pre-wrap text-xs text-muted-foreground">
                  {stage.output}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
