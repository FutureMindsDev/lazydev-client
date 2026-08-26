'use client';

import { useState, useCallback, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft } from 'lucide-react';
import { useRuns } from '@/hooks/use-dashboard';
import { cn } from '@/lib/utils';

/**
 * Global command palette (plan §4.7 / §8).
 * ⌘K / Ctrl+K opens it. Search by issue #, title, or taskId.
 * Enter navigates to the selected run's detail page.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const router = useRouter();

  // Global hotkey
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const { data } = useRuns({ limit: 10, offset: 0, search: query || undefined });
  const results = data?.items ?? [];

  const navigate = useCallback(
    (taskId: string) => {
      router.push(`/runs/${taskId}`);
      setOpen(false);
      setQuery('');
    },
    [router],
  );


  const selected = Math.min(selectedIdx, Math.max(0, results.length - 1));
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-lg border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border p-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIdx((s) => Math.min(results.length - 1, s + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIdx((s) => Math.max(0, s - 1));
              } else if (e.key === 'Enter' && results[selected]) {
                e.preventDefault();
                navigate(results[selected].taskId);
              }
            }}
            placeholder="Search runs by issue #, title, or taskId…"
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {query ? 'No matching runs.' : 'Start typing to search runs…'}
            </p>
          ) : (
            results.map((run, i) => (
              <button
                key={run.taskId}
                onClick={() => navigate(run.taskId)}
                onMouseEnter={() => setSelectedIdx(i)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left transition-colors',
                  i === selected ? 'bg-muted' : 'hover:bg-muted/50',
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono-output text-xs text-muted-foreground">#{run.issueNumber}</span>
                  <span className="line-clamp-1 max-w-[300px] text-sm">{run.issueTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs',
                      run.status === 'SUCCESS' ? 'bg-success/15 text-success' : 'bg-failed/15 text-failed',
                    )}
                  >
                    {run.status}
                  </span>
                  {i === selected && <CornerDownLeft className="h-3 w-3 text-muted-foreground" />}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
