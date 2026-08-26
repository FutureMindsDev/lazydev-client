'use client';

import { useEffect, useState, type ReactNode } from 'react';

const ENABLE_MOCKS = process.env.NEXT_PUBLIC_ENABLE_MOCKS !== 'false';

/**
 * Initializes the MSW service worker on the client when mocks are enabled.
 *
 * Gate is NEXT_PUBLIC_ENABLE_MOCKS (default: enabled). Set to 'false' in
 * .env.local to hit the real backend at NEXT_PUBLIC_API_URL.
 *
 * When mocks are disabled, ready starts true and no effect runs. When enabled,
 * ready starts false and flips to true once the worker has started.
 */
export function MocksProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!ENABLE_MOCKS);

  useEffect(() => {
    if (!ENABLE_MOCKS) return;
    let active = true;
    (async () => {
      const { worker } = await import('@/mocks/browser');
      await worker.start({
        onUnhandledRequest: 'bypass',
        quiet: false,
      });
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Starting mock API…
      </div>
    );
  }
  return <>{children}</>;
}
