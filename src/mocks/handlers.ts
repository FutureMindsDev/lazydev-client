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
} from './data';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3200';

// Small artificial delay so loading states are visible in the UI.
const LATENCY = 300;

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
    return HttpResponse.json(mockSettings());
  }),
];
