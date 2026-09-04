'use client';

import { useState } from 'react';
import {
  Cpu, Shield, Bell, Database, GitBranch, Eye, EyeOff, AlertTriangle,
  Plus, Trash2, Pencil,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  useSettings,
  useUpdateLlmSettings,
  useDeleteLlmSettings,
  useCreateProvider,
  useUpdateProvider,
  useDeleteProvider,
} from '@/hooks/use-dashboard';
import type {
  LlmProviderId,
  SettingsDto,
  UpdateLlmSettingsRequest,
  ProviderConfigDto,
  CreateProviderConfigRequest,
  UpdateProviderConfigRequest,
} from '@/lib/types';
import { cn } from '@/lib/utils';

const PROVIDER_LABELS: Record<LlmProviderId, string> = {
  openai: 'OpenAI',
  ollama: 'Ollama (local)',
  gemini: 'Google Gemini',
  deepseek: 'DeepSeek',
  anthropic: 'Anthropic (Claude)',
  openrouter: 'OpenRouter',
  nvidia: 'NVIDIA NIM',
  zai: 'Z.AI (GLM)',
  minimax: 'MiniMax',
  xiaomi: 'Xiaomi MiMo',
  kimi: 'Kimi (Moonshot)',
  grok: 'Grok (xAI)',
  custom: 'Custom (OpenAI-compatible)',
};

const PROVIDER_DEFAULT_URLS: Partial<Record<LlmProviderId, string>> = {
  gemini: 'https://generativelanguage.googleapis.com',
  deepseek: 'https://api.deepseek.com',
  anthropic: 'https://api.anthropic.com',
  openrouter: 'https://openrouter.ai/api/v1',
  nvidia: 'https://integrate.api.nvidia.com/v1',
  zai: 'https://api.z.ai/api/paas/v4',
  minimax: 'https://api.minimaxi.com/v1',
  xiaomi: 'https://api.xiaomimimo.com/v1',
  kimi: 'https://api.moonshot.cn/v1',
  grok: 'https://api.x.ai/v1',
};

const PROVIDER_OPTIONS = Object.entries(PROVIDER_LABELS) as [LlmProviderId, string][];

/** Agent roles that can be assigned to a specific provider config. */
const AGENT_ROLES = [
  { key: 'planner', label: 'Planner', description: 'Analyzes the issue and creates the implementation plan' },
  { key: 'patch_generator', label: 'Patch Generator', description: 'Writes the actual code changes' },
  { key: 'validation', label: 'Validation', description: 'Reviews and validates generated patches' },
  { key: 'onboarding', label: 'Onboarding', description: 'Indexes new repositories (cheap model is fine)' },
] as const;

/** Detect provider from a base URL for display purposes. */
function detectProviderFromUrl(baseUrl: string | null): LlmProviderId {
  if (!baseUrl) return 'openai';
  for (const [id, url] of Object.entries(PROVIDER_DEFAULT_URLS)) {
    if (baseUrl.startsWith(url)) return id as LlmProviderId;
  }
  return 'custom';
}

// ── Read-only sections ──────────────────────────────────────────────────────

interface Section {
  icon: typeof Cpu;
  title: string;
  entries: { label: string; value: string }[];
}

function buildReadonlySections(s: SettingsDto): Section[] {
  return [
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

// ── Shared/default BYOK provider form ───────────────────────────────────────

function ByokForm({
  configured,
  byok,
  onSaved,
  onRemoved,
}: {
  configured: boolean;
  byok: SettingsDto['byok'];
  onSaved: () => void;
  onRemoved: () => void;
}) {
  const { trigger: updateTrigger, isMutating: saving } = useUpdateLlmSettings();
  const { trigger: deleteTrigger, isMutating: removing } = useDeleteLlmSettings();
  const { toast } = useToast();

  const detectedProvider = configured
    ? detectProviderFromUrl(byok.baseUrl)
    : 'openai';

  const [provider, setProvider] = useState<LlmProviderId>(detectedProvider);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(
    configured ? (byok.baseUrl ?? '') : (PROVIDER_DEFAULT_URLS[detectedProvider] ?? ''),
  );
  const [model, setModel] = useState(configured ? (byok.model ?? '') : '');
  const [showKey, setShowKey] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleProviderChange = (id: LlmProviderId) => {
    setProvider(id);
    if (id === 'openai' || id === 'ollama') {
      setBaseUrl('');
    } else if (PROVIDER_DEFAULT_URLS[id]) {
      setBaseUrl(PROVIDER_DEFAULT_URLS[id]!);
    }
  };

  const handleSave = async () => {
    setErrorBanner(null);
    if (!model.trim()) {
      setErrorBanner('Model is required.');
      return;
    }
    if (!configured && !apiKey.trim()) {
      setErrorBanner('API key is required when configuring a provider for the first time.');
      return;
    }

    const body: UpdateLlmSettingsRequest = {
      model: model.trim(),
      baseUrl: baseUrl.trim() || null,
    };
    if (apiKey.trim()) {
      body.apiKey = apiKey.trim();
    }

    try {
      await updateTrigger(body);
      toast({
        title: configured ? 'Provider updated' : 'Provider configured',
        description: 'Your default LLM key has been saved (encrypted at rest).',
        variant: 'success',
      });
      setApiKey('');
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('400') || msg.includes('encryption')) {
        setErrorBanner(
          'Server-side encryption key not configured. Ask the administrator to set LLM_CONFIG_ENCRYPTION_KEY.',
        );
      } else {
        setErrorBanner(`Failed to save: ${msg}`);
      }
    }
  };

  const handleRemove = async () => {
    setErrorBanner(null);
    try {
      await deleteTrigger(undefined);
      toast({
        title: 'BYOK config removed',
        description: 'Reverted to server default LLM provider.',
        variant: 'warning',
      });
      setConfirmRemove(false);
      setApiKey('');
      setModel('');
      setBaseUrl('');
      setProvider('openai');
      onRemoved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorBanner(`Failed to remove: ${msg}`);
    }
  };

  return (
    <div className="space-y-4">
      {errorBanner && (
        <div className="flex items-start gap-2 rounded-md border border-failed/30 bg-failed/10 px-3 py-2 text-xs text-failed">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Current config display */}
      {configured && (
        <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Provider</dt>
              <dd className="font-mono-output text-foreground">
                {PROVIDER_LABELS[detectedProvider]}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Model</dt>
              <dd className="font-mono-output text-foreground">{byok.model ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">API Key</dt>
              <dd className="font-mono-output text-foreground">
                {byok.apiKeyHint ?? '—'}
                {byok.scope && (
                  <span className="ml-2 text-xs text-muted-foreground">({byok.scope})</span>
                )}
              </dd>
            </div>
            {byok.updatedAt && (
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="text-xs text-muted-foreground">
                  {new Date(byok.updatedAt).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRemove(true)}
              disabled={removing}
            >
              {removing ? 'Removing…' : 'Remove'}
            </Button>
          </div>
        </div>
      )}

      {confirmRemove && (
        <div className="rounded-md border border-failed/30 bg-failed/10 px-4 py-3 text-sm">
          <p className="mb-3">
            This will revert to the server&apos;s default LLM provider. Continue?
          </p>
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={handleRemove} disabled={removing}>
              Yes, remove
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfirmRemove(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* BYOK form */}
      <div className="space-y-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {configured
            ? 'Update your default provider. Leave the API key blank to keep the current one. This is the provider all agents use unless assigned to a specific one below.'
            : 'Use your own LLM provider account instead of the server defaults. Your key is encrypted at rest.'}
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Provider</label>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value as LlmProviderId)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {PROVIDER_OPTIONS.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            API Key {configured && <span className="text-muted-foreground/60">(leave blank to keep current)</span>}
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={configured ? '••••••••••••••••' : 'sk-...'}
              className="h-9 w-full rounded-md border border-border bg-background px-3 pr-10 font-mono-output text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Base URL <span className="text-muted-foreground/60">(optional)</span>
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono-output text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-4o"
            className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono-output text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="default" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : configured ? 'Save changes' : 'Save provider'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Provider config card (add/edit form) ────────────────────────────────────

interface ProviderFormState {
  label: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: LlmProviderId;
}

function emptyProviderForm(): ProviderFormState {
  return { label: '', apiKey: '', baseUrl: '', model: '', provider: 'openai' };
}

function ProviderConfigForm({
  existing,
  onSave,
  onCancel,
}: {
  existing: ProviderConfigDto | null;
  onSave: (data: { label: string; apiKey: string; baseUrl: string; model: string }) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ProviderFormState>(() => {
    if (existing) {
      return {
        label: existing.label,
        apiKey: '',
        baseUrl: existing.baseUrl ?? '',
        model: existing.model,
        provider: detectProviderFromUrl(existing.baseUrl),
      };
    }
    return emptyProviderForm();
  });
  const [showKey, setShowKey] = useState(false);

  const handleProviderChange = (id: LlmProviderId) => {
    setForm((f) => ({
      ...f,
      provider: id,
      baseUrl: id === 'openai' || id === 'ollama' ? '' : (PROVIDER_DEFAULT_URLS[id] ?? ''),
    }));
  };

  const canSave = form.label.trim() && form.model.trim() && (existing ? true : form.apiKey.trim());

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/20 px-4 py-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Label</label>
        <input
          type="text"
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          placeholder="e.g. OpenRouter (strong)"
          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Provider</label>
        <select
          value={form.provider}
          onChange={(e) => handleProviderChange(e.target.value as LlmProviderId)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {PROVIDER_OPTIONS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          API Key {existing && <span className="text-muted-foreground/60">(leave blank to keep current)</span>}
        </label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={form.apiKey}
            onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
            placeholder={existing ? '••••••••••••••••' : 'sk-...'}
            className="h-9 w-full rounded-md border border-border bg-background px-3 pr-10 font-mono-output text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Base URL <span className="text-muted-foreground/60">(optional)</span>
        </label>
        <input
          type="text"
          value={form.baseUrl}
          onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
          placeholder="https://api.openai.com/v1"
          className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono-output text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Model</label>
        <input
          type="text"
          value={form.model}
          onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
          placeholder="gpt-4o"
          className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono-output text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          variant="default"
          size="sm"
          disabled={!canSave}
          onClick={() =>
            onSave({
              label: form.label.trim(),
              apiKey: form.apiKey.trim(),
              baseUrl: form.baseUrl.trim(),
              model: form.model.trim(),
            })
          }
        >
          {existing ? 'Update' : 'Add provider'}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Provider configs section ────────────────────────────────────────────────

function ProviderConfigsSection({
  providers,
  byokConfigured,
  onSaved,
}: {
  providers: ProviderConfigDto[];
  byokConfigured: boolean;
  onSaved: () => void;
}) {
  const { trigger: createTrigger, isMutating: creating } = useCreateProvider();
  const { trigger: updateTrigger, isMutating: updating } = useUpdateProvider();
  const { trigger: deleteTrigger, isMutating: deleting } = useDeleteProvider();
  const { toast } = useToast();
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = async (data: { label: string; apiKey: string; baseUrl: string; model: string }) => {
    setErrorBanner(null);
    const body: CreateProviderConfigRequest = {
      label: data.label,
      apiKey: data.apiKey,
      baseUrl: data.baseUrl || null,
      model: data.model,
    };
    try {
      await createTrigger(body);
      toast({ title: 'Provider added', description: `"${data.label}" is now available for agent assignment.`, variant: 'success' });
      setShowForm(false);
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('400') || msg.includes('encryption')) {
        setErrorBanner('Server-side encryption key not configured. Ask the administrator to set LLM_CONFIG_ENCRYPTION_KEY.');
      } else {
        setErrorBanner(`Failed to add provider: ${msg}`);
      }
    }
  };

  const handleUpdate = async (data: { label: string; apiKey: string; baseUrl: string; model: string }) => {
    if (!editingId) return;
    setErrorBanner(null);
    const body: UpdateProviderConfigRequest = {
      label: data.label,
      baseUrl: data.baseUrl || null,
      model: data.model,
    };
    if (data.apiKey) body.apiKey = data.apiKey;
    try {
      await updateTrigger({ id: editingId, body });
      toast({ title: 'Provider updated', description: `"${data.label}" has been updated.`, variant: 'success' });
      setEditingId(null);
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorBanner(`Failed to update provider: ${msg}`);
    }
  };

  const handleDelete = async (id: string) => {
    setErrorBanner(null);
    try {
      await deleteTrigger(id);
      toast({ title: 'Provider deleted', description: 'Agent assignments to this provider have been cleared.', variant: 'warning' });
      setConfirmDeleteId(null);
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorBanner(`Failed to delete provider: ${msg}`);
    }
  };

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div>
        <h4 className="text-sm font-medium text-foreground">Additional provider configs</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Save additional LLM providers (each with its own API key, base URL, and model), then assign
          specific agents to them below. All keys are encrypted at rest.
        </p>
      </div>

      {errorBanner && (
        <div className="flex items-start gap-2 rounded-md border border-failed/30 bg-failed/10 px-3 py-2 text-xs text-failed">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Provider list */}
      {providers.length > 0 && (
        <div className="space-y-2">
          {providers.map((p) => {
            const detected = detectProviderFromUrl(p.baseUrl);
            return (
              <div key={p.id} className="rounded-md border border-border bg-muted/20 px-4 py-3">
                {editingId === p.id ? (
                  <ProviderConfigForm
                    existing={p}
                    onSave={handleUpdate}
                    onCancel={() => setEditingId(null)}
                  />
                ) : confirmDeleteId === p.id ? (
                  <div className="text-sm">
                    <p className="mb-3">Delete &quot;{p.label}&quot;? Agent assignments to this provider will be cleared.</p>
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" onClick={() => handleDelete(p.id)} disabled={deleting}>
                        {deleting ? 'Deleting…' : 'Yes, delete'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{p.label}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {PROVIDER_LABELS[detected]}
                        </span>
                      </div>
                      <dl className="mt-1.5 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-muted-foreground">Model</dt>
                          <dd className="font-mono-output text-foreground">{p.model}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-muted-foreground">API Key</dt>
                          <dd className="font-mono-output text-foreground">{p.apiKeyHint ?? '—'}</dd>
                        </div>
                        {p.baseUrl && (
                          <div className="flex items-center justify-between gap-2">
                            <dt className="text-muted-foreground">Base URL</dt>
                            <dd className="font-mono-output text-foreground truncate max-w-[200px]">{p.baseUrl}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(p.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Edit provider"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(p.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-failed/10 hover:text-failed"
                        aria-label="Delete provider"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add new provider form */}
      {showForm ? (
        <ProviderConfigForm
          existing={null}
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        !byokConfigured && providers.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Save a default provider config above first, then add additional providers here.
          </p>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            disabled={creating || updating || deleting}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add provider
          </Button>
        )
      )}
    </div>
  );
}

// ── Agent assignments section ───────────────────────────────────────────────

function AgentAssignmentsSection({
  byok,
  providers,
  onSaved,
}: {
  byok: SettingsDto['byok'];
  providers: ProviderConfigDto[];
  onSaved: () => void;
}) {
  const { trigger: updateTrigger, isMutating: saving } = useUpdateLlmSettings();
  const { toast } = useToast();
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Local state: role → providerId (empty string = use shared/default)
  const initialAssignments: Record<string, string> = {};
  if (byok.agentAssignments) {
    for (const role of AGENT_ROLES) {
      const v = byok.agentAssignments[role.key];
      if (v) initialAssignments[role.key] = v;
    }
  }
  const [assignments, setAssignments] = useState<Record<string, string>>(initialAssignments);
  const [dirty, setDirty] = useState(false);

  const handleChange = (role: string, providerId: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      if (providerId) next[role] = providerId;
      else delete next[role];
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setErrorBanner(null);
    const map: Record<string, string> = {};
    for (const role of AGENT_ROLES) {
      const v = assignments[role.key];
      if (v) map[role.key] = v;
    }
    const body: UpdateLlmSettingsRequest = {
      agentAssignments: Object.keys(map).length > 0 ? map : null,
    };
    try {
      await updateTrigger(body);
      // Sync local state
      const synced: Record<string, string> = {};
      for (const role of AGENT_ROLES) {
        const v = map[role.key];
        if (v) synced[role.key] = v;
      }
      setAssignments(synced);
      setDirty(false);
      toast({
        title: 'Agent assignments saved',
        description:
          Object.keys(map).length > 0
            ? `${Object.keys(map).length} agent(s) will use a custom provider.`
            : 'All agents now use the default provider.',
        variant: 'success',
      });
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorBanner(`Failed to save assignments: ${msg}`);
    }
  };

  const sharedModel = byok.model ?? '—';

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div>
        <h4 className="text-sm font-medium text-foreground">Agent assignments</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Assign each agent to a specific provider config. Agents without an assignment use the
          default provider (shared model: <span className="font-mono-output">{sharedModel}</span>).
        </p>
      </div>

      {errorBanner && (
        <div className="flex items-start gap-2 rounded-md border border-failed/30 bg-failed/10 px-3 py-2 text-xs text-failed">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      <div className="space-y-2">
        {AGENT_ROLES.map((role) => {
          const value = assignments[role.key] ?? '';
          return (
            <div key={role.key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                {role.label}
                <span className="ml-1.5 font-normal text-muted-foreground/70">
                  — {role.description}
                </span>
              </label>
              <select
                value={value}
                onChange={(e) => handleChange(role.key, e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Default provider ({sharedModel})</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} — {p.model}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? 'Saving…' : 'Save assignments'}
        </Button>
        {dirty && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAssignments(initialAssignments);
              setDirty(false);
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main settings page ─────────────────────────────────────────────────────

/** Settings page (plan §4.6) — LLM provider config (BYOK) + read-only sections. */
export default function SettingsPage() {
  const { data: settings, isLoading, mutate } = useSettings();

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

  const readonlySections = buildReadonlySections(settings);
  const sourceBadge = settings.llm.source === 'byok'
    ? { label: 'your key', cls: 'bg-success/15 text-success' }
    : { label: 'env default', cls: 'bg-muted text-muted-foreground' };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-2 text-lg font-semibold">Settings</h1>
      <p className="mb-5 text-xs text-muted-foreground">
        Configure your LLM provider and view system settings. Secrets are masked and never rendered.
      </p>

      {/* Zone A — LLM Provider (full width) */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <CardTitle>LLM Provider</CardTitle>
            <span className={cn('ml-auto rounded-full px-2 py-0.5 text-xs font-medium', sourceBadge.cls)}>
              {sourceBadge.label}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Effective config summary */}
          <div className="mb-4 flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Provider</span>
              <span className="font-mono-output text-foreground">
                {PROVIDER_LABELS[settings.llm.provider] ?? settings.llm.provider}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Model</span>
              <span className="font-mono-output text-foreground">{settings.llm.model}</span>
            </div>
            {settings.llm.fallbackModel && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fallback</span>
                <span className="font-mono-output text-foreground">{settings.llm.fallbackModel}</span>
              </div>
            )}
          </div>

          {/* Default BYOK provider form */}
          <ByokForm
            configured={settings.byok.configured}
            byok={settings.byok}
            onSaved={() => mutate()}
            onRemoved={() => mutate()}
          />

          {/* Additional provider configs (only when BYOK is configured) */}
          {settings.byok.configured && (
            <ProviderConfigsSection
              providers={settings.providers}
              byokConfigured={settings.byok.configured}
              onSaved={() => mutate()}
            />
          )}

          {/* Agent assignments (only when BYOK is configured) */}
          {settings.byok.configured && (
            <AgentAssignmentsSection
              byok={settings.byok}
              providers={settings.providers}
              onSaved={() => mutate()}
            />
          )}

          {!settings.byok.configured && (
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Per-agent provider assignments require a saved default provider config above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zone B — Read-only sections */}
      <div className="grid gap-4 sm:grid-cols-2">
        {readonlySections.map((section) => {
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
