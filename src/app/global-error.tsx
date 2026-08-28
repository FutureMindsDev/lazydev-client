'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Global error boundary (plan §4.7): catches errors that escape the
 * root layout. Must render its own <html><body> per Next.js convention.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Application error</h2>
            <p className="max-w-md text-sm text-gray-500">
              A critical error occurred. Try reloading the page.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400">Error ID: {error.digest}</p>
            )}
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
