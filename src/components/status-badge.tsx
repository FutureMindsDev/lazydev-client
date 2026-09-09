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

import { Badge } from '@/components/ui/badge';
import type { RunStatus } from '@/lib/types';

/** Consistent status language everywhere (plan §8): SUCCESS=emerald, FAILED=red. */
export function StatusBadge({ status, className }: { status: RunStatus; className?: string }) {
  return (
    <Badge variant={status === 'SUCCESS' ? 'success' : 'failed'} className={className}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  );
}
