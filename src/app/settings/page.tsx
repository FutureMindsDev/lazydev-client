'use client';

import { Cpu, Shield, Bell, Database, GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/hooks/use-dashboard';
import type { SettingsDto } from '@/lib/types';

interface Section {
  icon: typeof Cpu;
  title: string;
  entries: { label: string; value: string }[];
}

function buildSections(s: SettingsDto): Section[] {
  return [
    {
      icon: Cpu,
      title: 'LLM Provider',
      entries: [
        { label: 'Provider', value: s.llm.provider },
        { label: 'Model', value: s.llm.model },
        { label: 'Fallback', value: s.llm.fallbackModel ?? '—' },
      ],
    },
    {
      icon: Shield,
      title: 'Sandbox',
      entries: [
        { label: 'Network mode', value: s.sandbox.networkMode },
        { label: 'Timeout', value: `${s.sandbox.timeout}s` },
      ],
    },
    {
      icon: Bell,
      title: 'Notifications',
      entries: [
        { label: 'Discord', value: s.notifications.discord ? 'Enabled' : 'Disabled' },
        { label: 'Webhook', value: s.notifications.discordWebhookMasked ?? '—' },
      ],
    },
    {
      icon: GitBranch,
      title: 'Queue',
      entries: [
        { label: 'Concurrency', value: String(s.queue.concurrency) },
        { label: 'Max attempts', value: String(s.queue.maxAttempts) },
      ],
    },
    {
      icon: Database,
      title: 'Database',
      entries: [
        { label: 'Type', value: s.database.type },
        { label: 'Host', value: s.database.hostMasked },
      ],
    },
  ];
}

/** Settings page (plan §4.6) — read-only config display, Mode A only. */
export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-5 text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-5 text-lg font-semibold">Settings</h1>
        <p className="text-sm text-failed">Failed to load settings.</p>
      </div>
    );
  }

  const sections = buildSections(settings);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-2 text-lg font-semibold">Settings</h1>
      <p className="mb-5 text-xs text-muted-foreground">
        Read-only configuration display. Secrets are masked and never rendered.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-2">
                  {section.entries.map((entry) => (
                    <div key={entry.label} className="flex items-center justify-between text-sm">
                      <dt className="text-muted-foreground">{entry.label}</dt>
                      <dd className="font-mono-output text-foreground">{entry.value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
