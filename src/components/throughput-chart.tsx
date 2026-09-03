'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStore } from '@/stores/dashboard-store';
import { deriveThroughput } from '@/lib/derive';
import type { ThroughputBucket } from '@/lib/types';

/** Stacked bar chart of SUCCESS vs FAILED per day, last 14 days (plan §4.1). */
export function ThroughputChart() {
  const runs = useDashboardStore((s) => s.runs);
  const isLoading = useDashboardStore((s) => s.runsLoading);
  const throughput = deriveThroughput(runs, 14);

  const data: ThroughputBucket[] = throughput.map((b) => ({
    ...b,
    date: b.date.slice(5), // MM-DD for axis brevity
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline throughput · last 14 days</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && throughput.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="success" stackId="a" fill="var(--success)" name="Success" />
              <Bar dataKey="failed" stackId="a" fill="var(--failed)" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
