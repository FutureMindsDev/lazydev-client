'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Bot, Loader2, ShieldCheck } from 'lucide-react';

/**
 * GitHub OAuth login page (plan §4.7, Mode B only).
 *
 * In Mode A (self-hosted, auth='none'), this page redirects to '/'.
 * In Mode B (hosted, auth='github-oauth'), it shows the GitHub login button
 * which redirects to GET /api/auth/github (backend initiates OAuth flow).
 */
export default function LoginPage() {
  const router = useRouter();
  const { data: meta } = useSWR('meta', () => api.meta());
  const { data: session } = useSWR('session', () => api.getAuthSession());
  const [redirecting, setRedirecting] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3200';

  // If already authenticated, redirect home
  useEffect(() => {
    if (session?.authenticated) {
      router.replace('/');
    }
  }, [session, router]);

  // If Mode A (no auth), redirect home
  useEffect(() => {
    if (meta && meta.auth === 'none') {
      router.replace('/');
    }
  }, [meta, router]);

  const handleGitHubLogin = () => {
    setRedirecting(true);
    // External redirect to backend OAuth initiation endpoint — intentional
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `${baseUrl}/api/auth/github`;
  };

  // Loading state while we figure out the auth mode
  if (!meta || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Mode A — will redirect, show nothing
  if (meta.auth === 'none') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">LazyDev</h1>
            <p className="text-sm text-muted-foreground">Sign in to your control plane</p>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-foreground">Authenticate</h2>
            <p className="text-xs text-muted-foreground">
              Sign in with GitHub to access your repositories and manage automated
              issue resolution.
            </p>
          </div>

          <button
            onClick={handleGitHubLogin}
            disabled={redirecting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {redirecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            {redirecting ? 'Redirecting…' : 'Continue with GitHub'}
          </button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>We only request read access to repository metadata.</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to the LazyDev terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}
