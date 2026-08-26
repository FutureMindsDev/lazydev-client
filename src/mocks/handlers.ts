import { http, HttpResponse } from 'msw';
import { mockMetrics, mockMeta, mockRuns, mockRun } from './data';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3200';

export const handlers = [
  http.get(`${BASE}/api/dashboard/metrics`, () =>
    HttpResponse.json(mockMetrics()),
  ),

  http.get(`${BASE}/api/dashboard/meta`, () =>
    HttpResponse.json(mockMeta()),
  ),

  http.get(`${BASE}/api/dashboard/runs`, ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? '50');
    const offset = Number(url.searchParams.get('offset') ?? '0');
    const status = url.searchParams.get('status') as 'SUCCESS' | 'FAILED' | null;
    return HttpResponse.json(mockRuns(limit, offset, status ?? undefined));
  }),

  http.get(`${BASE}/api/dashboard/runs/:taskId`, ({ params }) => {
    const run = mockRun(String(params.taskId));
    if (!run) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(run);
  }),

  http.post(`${BASE}/api/dashboard/runs/:taskId/feedback`, async ({ request }) => {
    const body = (await request.json()) as { feedback?: string };
    if (!body.feedback?.trim()) {
      return new HttpResponse(JSON.stringify({ message: 'feedback required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return HttpResponse.json({ ok: true as const });
  }),
];
