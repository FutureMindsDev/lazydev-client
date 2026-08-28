'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Custom error boundary (plan §4.7): catches render errors, shows a
 * recoverable error page with retry and home navigation.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    // Class component can't use useRouter hook — hard navigation is intentional
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-failed/10">
            <AlertTriangle className="h-8 w-8 text-failed" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              An unexpected error occurred while rendering this page. You can retry
              or return to the dashboard.
            </p>
            {this.state.error && (
              <pre className="mt-3 max-w-lg overflow-auto rounded-md border border-border bg-muted p-3 text-left text-xs text-muted-foreground">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
            <button
              onClick={this.handleHome}
              className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Home className="h-4 w-4" />
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
