'use client';

import { QueueJobs } from '@/components/queue-jobs';
import { GrafanaPanel } from '@/components/grafana-panel';

/** Queues page (plan §4.4) — BullMQ inspector + Grafana embeds, Mode A only. */
export default function QueuesPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <h1 className="text-lg font-semibold">Queues</h1>
      <QueueJobs />
      <GrafanaPanel />
    </div>
  );
}
