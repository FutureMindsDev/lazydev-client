'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Bot,
  GitBranch,
  ListChecks,
  Settings,
  LineChart,
} from 'lucide-react';
import { useMeta } from '@/hooks/use-dashboard';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: typeof Activity;
  /** Only render in self-hosted mode (plan §3). */
  selfHostedOnly?: boolean;
  /** External link (Observability) rather than a route. */
  external?: boolean;
}

const NAV: NavItem[] = [
  { label: 'Overview', href: '/', icon: Activity },
  { label: 'Runs', href: '/runs', icon: ListChecks },
  { label: 'Queues', href: '/queues', icon: GitBranch, selfHostedOnly: true },
  { label: 'Settings', href: '/settings', icon: Settings, selfHostedOnly: true },
  {
    label: 'Observability',
    href: 'http://localhost:3000',
    icon: LineChart,
    selfHostedOnly: true,
    external: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: meta } = useMeta();
  const isSelfHosted = meta?.deploymentMode === 'selfhosted';

  const items = NAV.filter((n) => !n.selfHostedOnly || isSelfHosted);

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Bot className="h-5 w-5" aria-hidden />
        <span className="text-sm font-semibold">LazyDev</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active =
            !item.external &&
            (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href));
          const Icon = item.icon;
          const content = (
            <>
              <Icon className="h-4 w-4" aria-hidden />
              <span>{item.label}</span>
            </>
          );
          if (item.external) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {content}
              </a>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {content}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3 text-xs text-muted-foreground">
        {meta ? (
          <span className="capitalize">{meta.deploymentMode} mode</span>
        ) : (
          <span>Loading mode…</span>
        )}
      </div>
    </aside>
  );
}
