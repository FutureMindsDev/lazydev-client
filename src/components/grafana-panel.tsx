'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { ExternalLink, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Grafana embedding panel (plan §9, Mode A).
 *
 * Renders iframe-embeddable Grafana dashboards. Requires Grafana to be
 * configured with anonymous embed access (or a service account token
 * baked into the embed URL by the backend).
 *
 * Falls back to a "Grafana not configured" message when disabled.
 */
export function GrafanaPanel() {
  const { data, error, isLoading } = useSWR('grafana', () => api.getGrafanaConfig());
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Unable to load Grafana configuration.
      </div>
    );
  }

  if (!data.enabled) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Grafana integration is not enabled. Configure it in the backend to see
        embedded observability panels here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-active" />
        <h3 className="text-sm font-semibold text-foreground">Grafana Dashboards</h3>
        <a
          href={data.baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Open Grafana <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {data.dashboards.map((dash) => (
        <div key={dash.uid} className="rounded-lg border border-border bg-card overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === dash.uid ? null : dash.uid)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted"
          >
            {expanded === dash.uid ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-foreground">{dash.title}</span>
            {dash.description && (
              <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
                {dash.description}
              </span>
            )}
            <a
              href={data.baseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </button>
          {expanded === dash.uid && (
            <div className="border-t border-border">
              <iframe
                src={dash.embedUrl}
                className="h-64 w-full border-0"
                title={dash.title}
                loading="lazy"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
