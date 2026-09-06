'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Activity,
  GitBranch,
  ListChecks,
  Settings,
  FolderGit2,
  PanelLeftClose,
  PanelLeftOpen,
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

const COLLAPSED_KEY = 'lazydev-sidebar-collapsed';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return (
    <aside
      className={cn(
        'sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      {/* Header: logo + burger toggle */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-3">
        {!collapsed && (
          <Image
            src="/LazyDev-icon.jpeg"
            alt="LazyDev logo"
            width={128}
            height={128}
            sizes="32px"
            className="h-8 w-8 rounded-xl border border-border object-cover shadow-sm"
          />
        )}
        {!collapsed && <span className="flex-1 text-sm font-semibold">LazyDev</span>}
        <button
          onClick={toggleCollapsed}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            collapsed && 'mx-auto',
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {NAV.map((item) => {
          const active =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center rounded-md text-sm transition-colors',
                collapsed ? 'justify-center px-2 py-2.5' : 'gap-2 px-3 py-2',
                active
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer: mode label */}
      <div className="shrink-0 border-t border-border p-2">
        {!collapsed ? (
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-xs text-muted-foreground">self-hosted mode</span>
            <kbd className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
