import { http, HttpResponse, delay } from 'msw';
import {
  mockMetrics,
  mockMeta,
  mockRuns,
  mockRun,
  mockFeedbackStatus,
  mockJobs,
  mockRepos,
  mockSettings,
  mockGrafana,
  mockRepoStats,
} from './data';
import type {
  ByokSettingsDto,
  UpdateLlmSettingsRequest,
  ProviderConfigDto,
  CreateProviderConfigRequest,
  UpdateProviderConfigRequest,
} from '@/lib/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3200';

// Small artificial delay so loading states are visible in the UI.
const LATENCY = 300;

// Mutable BYOK mock state — persists across requests within a dev session.
let mockByokState: ByokSettingsDto = {
  configured: false, scope: null, baseUrl: null, model: null, agentModelOverrides: null, agentAssignments: null, apiKeyHint: null, updatedAt: null,
};

// Mutable provider config mock state — array of saved provider configs.
let mockProviders: ProviderConfigDto[] = [];
let providerIdCounter = 0;

export const handlers = [
  // ── Dashboard ──────────────────────────────────────────────────────────
  http.get(`${BASE}/api/dashboard/metrics`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(mockMetrics());
  }),

  http.get(`${BASE}/api/dashboard/meta`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(mockMeta());
  }),

  // ── Runs ───────────────────────────────────────────────────────────────
  http.get(`${BASE}/api/dashboard/runs`, async ({ request }) => {
    await delay(LATENCY);
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? '50');
    const offset = Number(url.searchParams.get('offset') ?? '0');
    const status = url.searchParams.get('status') as 'SUCCESS' | 'FAILED' | null;
    const search = url.searchParams.get('search') ?? undefined;
    return HttpResponse.json(mockRuns(limit, offset, status ?? undefined, search));
  }),

  http.get(`${BASE}/api/dashboard/runs/:taskId`, async ({ params }) => {
    await delay(LATENCY);
    const run = mockRun(String(params.taskId));
    if (!run) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(run);
  }),

  http.get(`${BASE}/api/dashboard/runs/:taskId/feedback-status`, async ({ params }) => {
    await delay(LATENCY);
    return HttpResponse.json(mockFeedbackStatus(String(params.taskId)));
  }),

  http.post(`${BASE}/api/dashboard/runs/:taskId/feedback`, async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { feedback?: string };
    if (!body.feedback?.trim()) {
      return new HttpResponse(JSON.stringify({ message: 'feedback required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return HttpResponse.json({ ok: true, pending: true });
  }),

  http.post(`${BASE}/api/dashboard/repos/:repo/issues/:number/retry`, async () => {
    await delay(LATENCY);
    return HttpResponse.json({ ok: true, taskId: `task-${Date.now().toString(36)}` });
  }),

  // ── Queues ─────────────────────────────────────────────────────────────
  http.get(`${BASE}/api/dashboard/queues/:name/jobs`, async ({ request }) => {
    await delay(LATENCY);
    const url = new URL(request.url);
    const state = url.searchParams.get('state') ?? undefined;
    const limit = Number(url.searchParams.get('limit') ?? '50');
    const offset = Number(url.searchParams.get('offset') ?? '0');
    return HttpResponse.json(mockJobs(state, limit, offset));
  }),

  http.post(`${BASE}/api/dashboard/queues/:name/jobs/:id/retry`, async () => {
    await delay(LATENCY);
    return HttpResponse.json({ ok: true });
  }),

  http.post(`${BASE}/api/dashboard/queues/:name/drain`, async () => {
    await delay(LATENCY);
    return HttpResponse.json({ ok: true, count: 6 });
  }),

  // ── Repositories ───────────────────────────────────────────────────────
  http.get(`${BASE}/api/dashboard/repos`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(mockRepos());
  }),

  http.post(`${BASE}/api/dashboard/repos/:id/resync`, async () => {
    await delay(LATENCY);
    return HttpResponse.json({ ok: true });
  }),

  // ── Settings ───────────────────────────────────────────────────────────
  http.get(`${BASE}/api/dashboard/settings`, async () => {
    await delay(LATENCY);
    const base = mockSettings();
    if (mockByokState.configured) {
      base.llm.source = 'byok';
      base.llm.model = mockByokState.model ?? base.llm.model;
    }
    base.byok = mockByokState;
    base.providers = mockProviders;
    return HttpResponse.json(base);
  }),

  http.put(`${BASE}/api/dashboard/settings/llm`, async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as UpdateLlmSettingsRequest;
    mockByokState = {
      configured: true,
      scope: 'global',
      baseUrl: body.baseUrl !== undefined ? body.baseUrl : mockByokState.baseUrl,
      model: body.model !== undefined ? body.model : mockByokState.model,
      agentModelOverrides:
        body.agentModelOverrides !== undefined
          ? body.agentModelOverrides
          : mockByokState.agentModelOverrides,
      agentAssignments:
        body.agentAssignments !== undefined
          ? body.agentAssignments
          : mockByokState.agentAssignments,
      apiKeyHint: body.apiKey ? `••••${body.apiKey.slice(-4)}` : mockByokState.apiKeyHint,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(mockByokState);
  }),

  http.delete(`${BASE}/api/dashboard/settings/llm`, async () => {
    await delay(LATENCY);
    mockByokState = { configured: false, scope: null, baseUrl: null, model: null, agentModelOverrides: null, agentAssignments: null, apiKeyHint: null, updatedAt: null };
    return HttpResponse.json({ ok: true });
  }),

  // ── Provider config CRUD (multi-provider) ───────────────────────────────
  http.get(`${BASE}/api/dashboard/settings/providers`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(mockProviders);
  }),

  http.post(`${BASE}/api/dashboard/settings/providers`, async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as CreateProviderConfigRequest;
    if (!body.label?.trim() || !body.apiKey?.trim() || !body.model?.trim()) {
      return new HttpResponse(JSON.stringify({ message: 'label, apiKey, and model are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const provider: ProviderConfigDto = {
      id: `provider-${++providerIdCounter}`,
      label: body.label.trim(),
      baseUrl: body.baseUrl?.trim() || null,
      model: body.model.trim(),
      apiKeyHint: `••••${body.apiKey.slice(-4)}`,
      updatedAt: new Date().toISOString(),
    };
    mockProviders = [...mockProviders, provider];
    return HttpResponse.json(provider);
  }),

  http.put(`${BASE}/api/dashboard/settings/providers/:id`, async ({ params, request }) => {
    await delay(LATENCY);
    const id = String(params.id);
    const body = (await request.json()) as UpdateProviderConfigRequest;
    const idx = mockProviders.findIndex((p) => p.id === id);
    if (idx === -1) {
      return new HttpResponse(JSON.stringify({ message: 'not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    mockProviders = mockProviders.map((p) =>
      p.id === id
        ? {
            ...p,
            label: body.label !== undefined ? body.label.trim() : p.label,
            model: body.model !== undefined ? body.model.trim() : p.model,
            baseUrl: body.baseUrl !== undefined ? (body.baseUrl?.trim() || null) : p.baseUrl,
            apiKeyHint: body.apiKey ? `••••${body.apiKey.slice(-4)}` : p.apiKeyHint,
            updatedAt: new Date().toISOString(),
          }
        : p,
    );
    return HttpResponse.json(mockProviders.find((p) => p.id === id)!);
  }),

  http.delete(`${BASE}/api/dashboard/settings/providers/:id`, async ({ params }) => {
    await delay(LATENCY);
    const id = String(params.id);
    mockProviders = mockProviders.filter((p) => p.id !== id);
    // Clear any agent assignments pointing at this provider.
    if (mockByokState.agentAssignments) {
      const cleaned: Record<string, string> = {};
      for (const [role, pid] of Object.entries(mockByokState.agentAssignments)) {
        if (pid !== id) cleaned[role] = pid;
      }
      mockByokState.agentAssignments = Object.keys(cleaned).length > 0 ? cleaned : null;
    }
    return HttpResponse.json({ ok: true });
  }),

  // ── Grafana (Phase 3) ──────────────────────────────────────────────────
  http.get(`${BASE}/api/dashboard/grafana`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(mockGrafana());
  }),

  // ── Repo index stats (Phase 3) ─────────────────────────────────────────
  http.get(`${BASE}/api/dashboard/repos/:id/stats`, async ({ params }) => {
    await delay(LATENCY);
    return HttpResponse.json(mockRepoStats(String(params.id)));
  }),

  // ── SSE events (Phase 3) — MSW doesn't support real SSE, so this returns
  // a simple JSON response. The usePipelineEvents hook uses native EventSource
  // which bypasses MSW in dev mode. This handler exists for completeness.
  http.get(`${BASE}/api/dashboard/events`, async ({ request }) => {
    const url = new URL(request.url);
    const taskId = url.searchParams.get('taskId') ?? 'unknown';
    return new HttpResponse(
      `data: ${JSON.stringify({ taskId, node: 'onboarding', status: 'completed', timestamp: new Date().toISOString() })}\n\n`,
      { headers: { 'Content-Type': 'text/event-stream' } },
    );
  }),
];
