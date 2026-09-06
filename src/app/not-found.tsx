import Link from 'next/link';
import Image from 'next/image';
import { Home, Search } from 'lucide-react';

/**
 * 404 page (plan §4.7): friendly not-found with navigation back.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <Image
        src="/LazyDev-icon.jpeg"
        alt="LazyDev logo"
        width={128}
        height={128}
        sizes="64px"
        className="h-16 w-16 rounded-2xl border border-border object-cover shadow-sm"
      />
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
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-terracotta to-amber px-4 py-2 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.03]"
        >
          <Home className="h-4 w-4" />
          Go Home
        </Link>
        <Link
          href="/runs"
          className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Search className="h-4 w-4" />
          Browse Runs
        </Link>
      </div>
    </div>
  );
}
