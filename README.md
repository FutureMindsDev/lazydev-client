<div align="center">
  <img src="https://drive.google.com/thumbnail?id=12Z0AzUqRPNO3WDE0_CGCjzCD4uDB5eDw&sz=w500" alt="FutureMindsDev Logo" width="500" style="border-radius: 50%;" />
</div>

# LazyDev Dashboard — Frontend (Self-hosted)

Control-plane UI for [LazyDev](https://github.com/FutureMindsDev/lazydev-server),
the AI-native autonomous CI assistant that monitors GitHub issues, generates
validated code fixes, and pushes fix branches safely.

This is the **self-hosted** distribution of the dashboard. It assumes a single
LazyDev backend installation — there is no multi-tenant / hosted-mode code path.

## What this is

<div align="center">
  <img
  src="https://drive.google.com/thumbnail?id=18dtk_f-nraHFy2wU__TWWaDHA7oFTapT&sz=w1000"
  alt="Project Screenshot"
  width="700"
  />
</div>

A Next.js 16 dashboard that makes the LazyDev AI pipeline a glass box:

- **Overview** — 10-second answer to "is LazyDev healthy?" with KPIs, throughput
  charts, and queue depth at a glance.
- **Runs** — Paginated audit log of every issue the pipeline has processed,
  with search and status filters.
- **Run Detail** — The flagship screen: animated pipeline timeline showing each
  LangGraph node (onboarding → analyzer → research → planner → patcher →
  validator → git), diff viewer, human-in-the-loop feedback panel, and failure
  forensics with one-click retry.
- **Queues** — BullMQ job inspector with retry/drain actions.
- **Repositories** — Onboarded repo cards with indexing status, auto-fix toggle,
  and Qdrant collection stats.
- **Settings** — Read-only masked config display with BYOK LLM provider management.
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

## Quick start (mocked)

```bash
pnpm install
pnpm dev          # http://localhost:3000 (mocks enabled by default)
```

No backend required — MSW intercepts every API call and returns realistic
fixtures.

## Connecting to your backend

The dashboard talks to the LazyDev backend over HTTP. Two frontend env vars
control this:

| Var | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3200` | Base URL of the LazyDev backend |
| `NEXT_PUBLIC_ENABLE_MOCKS` | `true` | Set to `false` to disable MSW and hit the real backend |

### Steps

1. **Start your LazyDev backend.** See the
   [backend repo](https://github.com/FutureMindsDev/lazy-issue-resolver) for
   deployment instructions (Docker Compose is the supported path). The backend
   serves the REST API on port `3200` by default.

2. **Configure the frontend.** In this repo:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:

   ```env
   NEXT_PUBLIC_API_URL=http://<backend-host>:3200
   NEXT_PUBLIC_ENABLE_MOCKS=false
   ```

   If the backend is on another machine, use its reachable address
   (IP or domain). Browsers enforce CORS, so the host must be reachable from
   the browser running the dashboard, not just from the Next.js server.

3. **Allow the frontend origin in the backend's CORS config.** This is the one
   backend-side setting you must touch. In the backend's `.env`:

   ```env
   CORS_ORIGINS=http://<frontend-host>:3000
   ```

   Add every origin you'll load the dashboard from (browsers treat
   `localhost` and `127.0.0.1` as different origins, so list both if needed).
   Restart the backend after changing this.

4. **(Optional) Enable dashboard auth.** If you want to gate the dashboard
   behind a bearer token, set on the backend:

   ```env
   DASHBOARD_AUTH=token
   DASHBOARD_AUTH_TOKEN=<your-secret-token>
   ```

   The frontend passes through whatever auth the backend requires — no
   frontend change needed. With `DASHBOARD_AUTH=none` (default) the dashboard
   is open to anyone who can reach it, so put it behind a network boundary
   or reverse proxy with auth in production.

5. **Restart the dev server.** `NEXT_PUBLIC_*` vars are inlined at build time,
   so you must restart `pnpm dev` after editing `.env.local` for changes to
   take effect.

   ```bash
   pnpm dev
   ```

### Production build

```bash
pnpm build
pnpm start        # serves the production build on :3000
```

Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_ENABLE_MOCKS=false` in the
environment before running `pnpm build` so they're baked into the bundle.

## Related

- **Backend**: [FutureMindsDev/lazydev-server](https://github.com/FutureMindsDev/lazydev-server) — NestJS + LangGraph + BullMQ + Qdrant
- **Intro site**: [LazyDev Intro](https://github.com/arkar-chanmyae/lazydev-intro) — marketing & documentation site
- **Backend API spec**: [`BACKEND_API_SPEC.md`](./BACKEND_API_SPEC.md)
- **Verification checklist**: [`CHECKLIST.md`](./CHECKLIST.md)

## Authors

LazyDev™ is built and maintained by **FutureMindsDev**.

| Name | Role | GitHub |
|------|------|--------|
| Arkar Chan Myae | Co-Founder · Lead AI & Systems Architect | [@arkar-chanmyae](https://github.com/arkar-chanmyae) |
| Khin Me Me Latt | Co-Founder · Software & Product Engineer | [@KhinMeMeLatt](https://github.com/KhinMeMeLatt) |

> **FutureMindsDev** is an engineering lab building smart, futuristic technology solutions for developers and the public.
> [github.com/FutureMindsDev](https://github.com/FutureMindsDev)

## License

MIT © 2026 [FutureMindsDev](https://github.com/FutureMindsDev)

LazyDev™ is a trademark of FutureMindsDev.
