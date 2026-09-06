'use client';

import { Sun, Moon, Monitor, Search } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

/**
 * Top bar (plan §4.7): global search trigger, theme toggle, external links.
 * The search trigger opens the command palette (⌘K).
 */
export function Topbar() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themeIcons = { light: Sun, dark: Moon, system: Monitor } as const;
  const ThemeIcon = themeIcons[theme];

  const cycleTheme = () => {
    const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur">
      {/* Search trigger (opens ⌘K palette) */}
      <button
        onClick={() => {
          // Dispatch the ⌘K hotkey so the existing command palette picks it up
          window.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'k',
            metaKey: true,
            bubbles: true,
          }));
        }}
        className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search runs…</span>
        <kbd className="ml-2 rounded-full border border-border px-1.5 py-0.5 text-xs">⌘K</kbd>
      </button>

      {/* Right side: theme toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={cycleTheme}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
          title={`Theme: ${theme} (resolved: ${resolvedTheme})`}
        >
          <ThemeIcon className="h-4 w-4" />
          <span className="hidden sm:inline capitalize">{theme}</span>
        </button>
      </div>
    </header>
  );
}
