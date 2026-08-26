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
