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
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-failed/10">
            <AlertTriangle className="h-8 w-8 text-failed" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Application error</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              A critical error occurred. Try reloading the page.
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
            )}
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-terracotta to-amber px-4 py-2 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.03]"
          >
            <RefreshCw className="h-4 w-4" />
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
