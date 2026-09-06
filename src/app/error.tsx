'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Route-level error boundary (plan §4.7).
 * Next.js automatically wraps each route segment in this boundary.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[route-error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-failed/10">
        <AlertTriangle className="h-8 w-8 text-failed" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          An unexpected error occurred while rendering this page.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
        )}
        {error.message && (
          <pre className="mt-3 max-w-lg overflow-auto rounded-md border border-border bg-muted p-3 text-left text-xs text-muted-foreground">
            {error.message}
          </pre>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-terracotta to-amber px-4 py-2 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.03]"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Home className="h-4 w-4" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
