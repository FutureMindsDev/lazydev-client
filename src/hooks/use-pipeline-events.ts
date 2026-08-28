'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { PipelineEvent, PipelineStage } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3200';

/**
 * Real SSE subscription to GET /api/dashboard/events?taskId=… (plan §9 Phase 3).
 *
 * When the backend exposes this endpoint (Nest @Sse decorator emitting
 * {node, status, payload} as agents complete), this hook provides the live
 * event stream. Until then, useSimulatedPipeline provides the same UX.
 *
 * The hook merges incoming events into a PipelineStage[] that the
 * PipelineTimeline component can render directly — same interface as the
 * simulation, so the Run Detail page can switch between them seamlessly.
 */

const NODE_LABELS: Record<string, string> = {
  onboarding: 'Onboarding',
  analyzer: 'Analyzer',
  research: 'Research',
  tools: 'Tools',
  planner: 'Planner',
  patcher: 'Patcher',
  validator: 'Validator',
  human_feedback: 'Human Feedback',
  git: 'Git / PR',
};

const NODE_ORDER: string[] = ['onboarding', 'analyzer', 'research', 'tools', 'planner', 'patcher', 'validator', 'human_feedback', 'git'];

const INITIAL_STAGES: PipelineStage[] = NODE_ORDER.map((node) => ({
  node: node as PipelineStage['node'],
  label: NODE_LABELS[node] ?? node,
  status: 'pending',
}));

export function usePipelineEvents(taskId: string | null, enabled: boolean) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  const stop = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
    setIsLive(false);
  }, []);

  useEffect(() => {
    if (!taskId || !enabled) {
      // Cleanup without calling stop() to avoid setState-in-effect
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
      return;
    }

    // Reset state for new subscription — legitimate effect initialization
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStages(INITIAL_STAGES);
    setError(null);
    setIsLive(true);

    const url = `${BASE_URL}/api/dashboard/events?taskId=${encodeURIComponent(taskId)}`;
    const source = new EventSource(url);
    sourceRef.current = source;

    source.onmessage = (ev) => {
      try {
        const event: PipelineEvent = JSON.parse(ev.data);
        setStages((prev) =>
          prev.map((s) => {
            if (s.node !== event.node) return s;
            const status =
              event.status === 'completed' ? 'completed' :
              event.status === 'failed' ? 'failed' : 'active';
            return {
              ...s,
              status,
              output: event.payload ?? s.output,
              attempt: event.attempt ?? s.attempt,
            };
          }),
        );
      } catch {
        // Ignore malformed events
      }
    };

    source.onerror = () => {
      setError('Live event stream ended or could not be established.');
      setIsLive(false);
      source.close();
      sourceRef.current = null;
    };

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [taskId, enabled]);

  return { stages, isLive, error, stop };
}
