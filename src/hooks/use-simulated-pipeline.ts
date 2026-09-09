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


import { useState, useEffect, useCallback, useRef } from 'react';
import type { PipelineStage } from '@/lib/types';

/**
 * Simulates live SSE pipeline events (plan §9 Phase 3).
 *
 * In production this would be replaced by a real EventSource subscription to
 * GET /api/dashboard/events?taskId=… that emits {node, status, payload} as
 * agents complete. Here we simulate the same event stream client-side so the
 * animated timeline experience is demonstrable without a backend.
 *
 * Given a full set of stages (from a completed run), it replays them
 * one-by-one with a delay, transitioning each from pending→active→completed.
 */
export function useSimulatedPipeline(stages: PipelineStage[] | undefined) {
  const [liveStages, setLiveStages] = useState<PipelineStage[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsLive(false);
    setCurrentNode(null);
  }, []);

  const start = useCallback(() => {
    if (!stages || stages.length === 0) return;
    stop();
    setIsLive(true);

    // Reset all stages to pending
    const reset = stages.map((s) => ({ ...s, status: 'pending' as const, output: undefined }));
    setLiveStages(reset);

    let idx = 0;
    const step = () => {
      if (idx >= stages.length) {
        setIsLive(false);
        setCurrentNode(null);
        return;
      }

      const stage = stages[idx];
      setCurrentNode(stage.node);

      // Set current stage to active
      setLiveStages((prev) =>
        prev.map((s, i) => (i === idx ? { ...s, status: 'active' } : s)),
      );

      // After a delay, mark as completed/failed and show output
      timerRef.current = setTimeout(() => {
        setLiveStages((prev) =>
          prev.map((s, i) =>
            i === idx
              ? { ...s, status: stages[idx].status, output: stages[idx].output }
              : i > idx
                ? { ...s, status: 'pending' }
                : s,
          ),
        );
        idx++;
        timerRef.current = setTimeout(step, 600);
      }, 1200);
    };

    timerRef.current = setTimeout(step, 400);
  }, [stages, stop]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // When not simulating, return the original stages
  const displayStages = isLive ? liveStages : stages;

  return { displayStages, isLive, currentNode, start, stop };
}
