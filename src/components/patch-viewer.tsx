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
import { Copy, Check, ExternalLink, AlertTriangle } from 'lucide-react';

interface PatchViewerProps {
  patch: string | null;
  prUrl?: string | null;
  unappliedChanges?: string | null;
}

/**
 * Renders a unified diff with syntax highlighting (plan §4.3).
 * Lines starting with `-` are red, `+` are green, `@@` hunk headers are blue.
 * Copy button + "Open PR" external link when available.
 * Warning banner if unappliedChanges is non-empty.
 */
export function PatchViewer({ patch, prUrl, unappliedChanges }: PatchViewerProps) {
  const [copied, setCopied] = useState(false);

  if (!patch) {
    return (
      <div className="rounded-md border border-border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">No patch was generated for this run.</p>
      </div>
    );
  }

  const lines = patch.split('\n');

  const copy = async () => {
    await navigator.clipboard.writeText(patch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      {unappliedChanges && (
        <div className="flex items-start gap-2 rounded-md border border-retry/30 bg-retry/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-retry" />
          <div>
            <p className="text-sm font-medium text-retry">Some hunks could not be applied</p>
            <p className="text-xs text-muted-foreground">{unappliedChanges}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{lines.length} lines</span>
        <div className="flex items-center gap-2">
          <button
            onClick={copy}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {prUrl && (
            <a
              href={prUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open PR
            </a>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <pre className="font-mono-output text-xs leading-relaxed">
          {lines.map((line, i) => {
            if (line.startsWith('diff --git') || line.startsWith('index ')) {
              return <div key={i} className="border-b border-border px-3 py-1 text-muted-foreground">{line}</div>;
            }
            if (line.startsWith('---') || line.startsWith('+++')) {
              return <div key={i} className="px-3 py-0.5 text-active">{line}</div>;
            }
            if (line.startsWith('@@')) {
              return <div key={i} className="bg-active/5 px-3 py-0.5 text-active">{line}</div>;
            }
            if (line.startsWith('-')) {
              return <div key={i} className="bg-failed/5 px-3 py-0.5 text-failed">{line}</div>;
            }
            if (line.startsWith('+')) {
              return <div key={i} className="bg-success/5 px-3 py-0.5 text-success">{line}</div>;
            }
            return <div key={i} className="px-3 py-0.5 text-muted-foreground">{line}</div>;
          })}
        </pre>
      </div>
    </div>
  );
}
