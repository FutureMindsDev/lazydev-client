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


import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';

/** Global SWR defaults: dedupe by key, keep previous data during revalidation. */
export function SwrProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: true,
        errorRetryCount: 3,
        provider: () => new Map(),
      }}
    >
      {children}
    </SWRConfig>
  );
}
