# LazyDev Dashboard — Frontend

Control-plane UI for [LazyDev](https://github.com/FutureMindsDev/lazy-issue-resolver),
the AI-native autonomous CI assistant that monitors GitHub issues, generates
validated code fixes, and pushes fix branches safely.

## What this is

A Next.js 16 dashboard that makes the LazyDev AI pipeline a glass box:

- **Overview** — 10-second answer to "is LazyDev healthy?" with KPIs, throughput
  charts, and queue depth at a glance.
- **Runs** — Paginated audit log of every issue the pipeline has processed,
  with search and status filters.
- **Run Detail** — The flagship screen: animated pipeline timeline showing each
  LangGraph node (onboarding → analyzer → research → planner → patcher →
  validator → git), diff viewer, human-in-the-loop feedback panel, and failure
  forensics with one-click retry.
- **Queues** — BullMQ job inspector with retry/drain actions (Mode A).
- **Repositories** — Onboarded repo cards with indexing status, auto-fix toggle,
  and Qdrant collection stats.
- **Settings** — Read-only masked config display (Mode A).
- **Command Palette** (⌘K) — Global search across all runs by issue #, title, or taskId.
- **Live SSE** — Real-time pipeline events when the backend supports it, with a
  simulation fallback for development.

## Architecture

- **Next.js 16** App Router + Turbopack
- **Tailwind v4** dark-mode-first design system
- **SWR** for polling + cache management
- **MSW** (Mock Service Worker) for standalone dev — no backend needed
- **Recharts** for throughput visualization
- **Zod**-compatible TypeScript contracts mirroring backend DTOs exactly

The frontend runs entirely against MSW mocks by default. Set
`NEXT_PUBLIC_ENABLE_MOCKS=false` in `.env.local` to hit the real NestJS backend
with zero code changes.

See [`BACKEND_API_SPEC.md`](./BACKEND_API_SPEC.md) for the full API contract the
frontend expects from the backend.

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000 (mocks enabled by default)
```

To connect to the real backend:

```bash
cp .env.example .env.local
# Set NEXT_PUBLIC_ENABLE_MOCKS=false
pnpm dev
```

## Related

- **Backend**: [FutureMindsDev/lazy-issue-resolver](https://github.com/FutureMindsDev/lazy-issue-resolver) — NestJS + LangGraph + BullMQ + Qdrant
- **Backend API spec**: [`BACKEND_API_SPEC.md`](./BACKEND_API_SPEC.md)
- **Verification checklist**: [`CHECKLIST.md`](./CHECKLIST.md)

## License

MIT
