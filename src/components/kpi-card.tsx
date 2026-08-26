import { type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** Color band: green/amber/red for queue depth, or undefined for neutral. */
  band?: 'green' | 'amber' | 'red';
}

const bandColor: Record<'green' | 'amber' | 'red', string> = {
  green: 'text-success',
  amber: 'text-retry',
  red: 'text-failed',
};

export function KpiCard({ label, value, hint, band }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={cn('mt-2 text-2xl font-semibold tabular-nums', band && bandColor[band])}>
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
