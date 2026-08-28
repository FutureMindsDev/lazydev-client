'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const variantConfig: Record<ToastVariant, { icon: typeof CheckCircle2; color: string; border: string }> = {
  success: { icon: CheckCircle2, color: 'text-success', border: 'border-success/30' },
  error: { icon: AlertCircle, color: 'text-failed', border: 'border-failed/30' },
  warning: { icon: AlertTriangle, color: 'text-retry', border: 'border-retry/30' },
  info: { icon: Info, color: 'text-active', border: 'border-active/30' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = t.duration ?? 4000;
    setToasts((prev) => [...prev, { ...t, id }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast viewport — fixed bottom-right, stacks upward */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 sm:max-w-sm">
        {toasts.map((t) => {
          const cfg = variantConfig[t.variant];
          const Icon = cfg.icon;
          return (
            <div
              key={t.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border bg-card p-4 shadow-lg animate-in slide-in-from-bottom-2',
                cfg.border,
              )}
              role="alert"
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', cfg.color)} />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
