import Link from 'next/link';
import { Home, Search } from 'lucide-react';

/**
 * 404 page (plan §4.7): friendly not-found with navigation back.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <p className="text-6xl font-bold text-muted-foreground">404</p>
        <h2 className="text-xl font-semibold text-foreground">Page not found</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Home className="h-4 w-4" />
          Go Home
        </Link>
        <Link
          href="/runs"
          className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Search className="h-4 w-4" />
          Browse Runs
        </Link>
      </div>
    </div>
  );
}
