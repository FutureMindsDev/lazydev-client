<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: LazyDev Frontend (Self-hosted)

Self-hosted control-plane UI for the Lazy Issue Resolver NestJS backend
(separate repo at `../lazy-issue-resolver`). See `docs/` for the full UI plan.
This distribution supports a single self-hosted backend installation only —
there is no multi-tenant / hosted-mode code path.

### Commands
- `pnpm dev` — dev server on :3000 (mocks enabled by default)
- `pnpm build` — production build (Turbopack)
- `pnpm lint` — eslint
- `pnpm start` — serve production build

### Mock vs real backend
- `NEXT_PUBLIC_ENABLE_MOCKS=true` (default): MSW intercepts API calls; no
  backend needed. Set to `false` in `.env.local` to hit the real backend at
  `NEXT_PUBLIC_API_URL` (default `http://localhost:3200`).
- The `/metrics` mock fixture mirrors the real backend response shape exactly
  (`src/mocks/data.ts`), so flipping the flag needs zero component changes.

### Architecture notes
- Self-hosted only. `src/lib/api.ts` has no tenancy scoping — every call hits
  the single backend installation directly.
- All sidebar nav items (Overview, Runs, Queues, Repositories, Settings)
  always render.
- Data contracts in `src/lib/types.ts` mirror backend DTOs/entities exactly.
- The actual LangGraph node names are `research` (not "researcher"), `tools`,
  and `human_feedback` — corrected from the plan doc for the future Run Detail.
- Shared dashboard data (runs list + metrics) lives in a Zustand store
  (`src/stores/dashboard-store.ts`), fetched once at the app level by
  `DashboardDataProvider` in `layout.tsx`. Components consume via
  `useDashboardStore` selectors — no duplicate `/runs` or `/metrics` calls.
  SWR is still used for entity-scoped queries (`useRunDetail`, `useJobs`,
  `useRepos`, `useSettings`, `useRuns` for paginated/filtered lists).
- When `NEXT_PUBLIC_ENABLE_MOCKS=false`, the `MocksProvider` unregisters any
  stale MSW service worker from prior sessions. `NEXT_PUBLIC_*` vars are
  inlined at build time — restart `pnpm dev` after changing `.env.local`.

### Dependency version notes (verified during setup)
- `lucide-react@1.34.0`: no `Github` icon export; use `Bot` for branding.
- `@tanstack/react-table@9.1.2`: new API (`useTable`/`createCoreRowModel`,
  not `useReactTable`/`getCoreRowModel`). Not yet wired — the Overview's
  10-row table renders directly; TanStack will be used for the future
  paginated Runs list.
