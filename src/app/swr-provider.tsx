'use client';

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
