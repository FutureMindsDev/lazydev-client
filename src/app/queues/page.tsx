import Link from 'next/link';

export default function QueuesPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <h1 className="text-lg font-semibold">Queues</h1>
      <p className="text-sm text-muted-foreground">
        BullMQ inspector (plan §4.4, Mode A only). A read-only queue snapshot is
        available on the <Link href="/" className="text-foreground underline">Overview</Link>.
      </p>
    </div>
  );
}
