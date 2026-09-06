'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Activity,
  GitBranch,
  ListChecks,
  Settings,
  FolderGit2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: typeof Activity;
}

const NAV: NavItem[] = [
  { label: 'Overview', href: '/', icon: Activity },
  { label: 'Runs', href: '/runs', icon: ListChecks },
  { label: 'Queues', href: '/queues', icon: GitBranch },
  { label: 'Repositories', href: '/repos', icon: FolderGit2 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <Image
          src="/LazyDev-icon.jpeg"
          alt="LazyDev logo"
          width={128}
          height={128}
          sizes="32px"
          className="h-8 w-8 rounded-xl border border-border object-cover shadow-sm"
        />
        <span className="text-sm font-semibold">LazyDev</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map((item) => {
          const active =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
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
              <Icon className="h-4 w-4" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">self-hosted mode</span>
          <kbd className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">⌘K</kbd>
        </div>
      </div>
    </aside>
  );
}
