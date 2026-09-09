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


import { useEffect, useState, type ReactNode } from 'react';

const ENABLE_MOCKS = process.env.NEXT_PUBLIC_ENABLE_MOCKS !== 'false';

/**
 * Initializes the MSW service worker on the client when mocks are enabled.
 *
 * Gate is NEXT_PUBLIC_ENABLE_MOCKS (default: enabled). Set to 'false' in
 * .env.local to hit the real backend at NEXT_PUBLIC_API_URL.
 *
 * Robust against environments where service workers can't register (e.g.
 * browser preview proxies): if worker.start() rejects or times out, we
 * proceed anyway — SWR will handle any resulting network errors gracefully.
 */
export function MocksProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!ENABLE_MOCKS);

  useEffect(() => {
    if (!ENABLE_MOCKS) {
      // Unregister any lingering MSW service worker from a previous session
      // where mocks were enabled. The SW registration persists across reloads
      // and would otherwise intercept fetches even after ENABLE_MOCKS=false.
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => Promise.all(regs.map((r) => r.unregister())))
          .then((removed) => {
            if (removed.some(Boolean)) {
              console.info('[mocks] Unregistered stale MSW service worker(s)');
            }
          })
          .catch(() => {});
      }
      return;
    }
    let active = true;

    // Safety net: never hang the UI longer than 5s waiting for the SW.
    const timeout = setTimeout(() => {
      if (active) {
        console.warn('[mocks] MSW worker did not start within 5s — proceeding without mocks');
        setReady(true);
      }
    }, 5_000);

    (async () => {
      try {
        const { worker } = await import('@/mocks/browser');
        await worker.start({
          onUnhandledRequest: 'bypass',
          quiet: false,
        });
        if (active) {
          clearTimeout(timeout);
          setReady(true);
        }
      } catch (err) {
        console.warn('[mocks] MSW worker failed to start — proceeding without mocks:', err);
        if (active) {
          clearTimeout(timeout);
          setReady(true);
        }
      }
    })();

    return () => {
      active = false;
      clearTimeout(timeout);
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
