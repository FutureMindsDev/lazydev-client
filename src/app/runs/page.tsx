import Link from 'next/link';

export default function RunsPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <h1 className="text-lg font-semibold">Runs</h1>
      <p className="text-sm text-muted-foreground">
        The paginated runs list (plan §4.2) is the next slice. For now, recent
        runs are visible on the <Link href="/" className="text-foreground underline">Overview</Link>.
      </p>
    </div>
  );
}
