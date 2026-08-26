# LazyDev Frontend — Verification Checklist

> Generated after completing all phases of the frontend UI plan.
> Dev server: `cd /Users/arkarchanmyae/Desktop/projects/lazydev-frontend && pnpm dev`
> Open: `http://localhost:3000` (mocks enabled by default)

## Build & Lint

- [ ] `pnpm build` passes with 0 errors
- [ ] `pnpm lint` passes with 0 errors, 0 warnings
- [ ] All 7 routes build: `/`, `/runs`, `/runs/[taskId]`, `/queues`, `/repos`, `/settings`, `/_not-found`

## Phase 1 — Overview (`/`)

- [ ] Status strip shows "Operational" with green check icon
- [ ] Status strip shows "Updated Xm ago" with auto-refresh 15s indicator
- [ ] 4 KPI cards render: Success rate %, Total resolved, Failed runs, Queue depth
- [ ] Queue depth card shows color band (green <5, amber <20, red ≥20)
- [ ] Throughput chart shows 14-day stacked bar (green=success, red=failed)
- [ ] Recent runs table shows last 10 runs with status badges
- [ ] Recent runs table: issue #, title, status, attempts, patch icon, created time
- [ ] Queue snapshot shows segmented bar + per-state counts (waiting/active/completed/failed/delayed/paused)
- [ ] Sidebar shows LazyDev logo, nav items, and "selfhosted mode" at bottom
- [ ] Dark mode renders correctly (system preference)

## Phase 1 — Runs List (`/runs`)

- [ ] Paginated table renders with 20 rows per page
- [ ] Status filter buttons work: All / Success / Failed
- [ ] Search box filters by issue #, title, or taskId (300ms debounce)
- [ ] Pagination buttons (Prev/Next) work with page counter
- [ ] Row click navigates to `/runs/:taskId`
- [ ] FAILED rows show Retry button
- [ ] Empty state shows when no runs match filter/search
- [ ] Total count displayed

## Phase 1 — Run Detail (`/runs/:taskId`) — Flagship

- [ ] Back to runs link works
- [ ] Header card: status badge, issue # + title (links to GitHub), repo, branch
- [ ] TaskId is copyable (click to copy, shows check icon)
- [ ] Pipeline timeline renders all 7 nodes: Onboarding → Analyzer → Research → Planner → Patcher → Validator → Git
- [ ] Each node is expandable — click to show output
- [ ] Validator node shows "attempt N" badge when attempts > 1
- [ ] Validator→Patcher loop-back shown as dashed connector with label
- [ ] Failed nodes show red X icon
- [ ] Patch viewer renders unified diff with syntax highlighting (red -, green +, blue @@)
- [ ] Patch viewer has Copy button (shows "Copied" for 2s)
- [ ] Patch viewer has "Open PR ↗" link when PR exists
- [ ] Unapplied changes warning banner shows when applicable
- [ ] Failure forensics panel shows on FAILED runs (red-tinted log)
- [ ] Failure forensics has Retry button
- [ ] Feedback panel renders with quick-feedback chips
- [ ] Feedback panel textarea + Submit button
- [ ] Feedback panel shows pending consumption status
- [ ] "Simulate Live" button replays pipeline stages with animation
- [ ] Live indicator shows "Live · {currentNode}" with pulsing radio icon
- [ ] "Stop" button halts the simulation

## Phase 2 — Queues (`/queues`) — Mode A only

- [ ] Counts grid shows 6 states (Active/Waiting/Delayed/Failed/Completed) with counts
- [ ] Clicking a state tab loads jobs for that state
- [ ] Failed jobs show error reason + alert icon
- [ ] Retry button on failed jobs
- [ ] "Drain failed" button on failed tab
- [ ] Grafana link at bottom

## Phase 2 — Repositories (`/repos`)

- [ ] Repo cards render with owner/name, default branch
- [ ] Onboarding status badge (Indexed=green, Syncing=blue, Pending=slate, Failed=red)
- [ ] Indexed files count + last sync time
- [ ] Auto-fix toggle works (click to toggle)
- [ ] Re-sync button triggers (shows spinning icon)

## Phase 2 — Settings (`/settings`) — Mode A only

- [ ] 5 config cards render: LLM, Sandbox, Notifications, Queue, Database
- [ ] All values are read-only
- [ ] Secrets are masked (Discord webhook, DB host show ••••)
- [ ] No raw secrets visible anywhere

## Phase 3 — Command Palette (⌘K)

- [ ] ⌘K (or Ctrl+K) opens the palette
- [ ] ESC closes the palette
- [ ] Typing searches runs by issue #, title, taskId
- [ ] Arrow keys navigate results (up/down)
- [ ] Enter navigates to selected run detail
- [ ] Click result navigates to run detail
- [ ] Backdrop blur + click outside closes
- [ ] ⌘K hint shown in sidebar footer

## Mock vs Real Backend

- [ ] Default: mocks work (no backend needed) — `NEXT_PUBLIC_ENABLE_MOCKS=true`
- [ ] Set `NEXT_PUBLIC_ENABLE_MOCKS=false` in `.env.local` → hits real backend at `:3200`
- [ ] `/metrics` mock shape matches real backend exactly (DashboardMetrics interface)
- [ ] MSW worker starts within 5s or UI proceeds with error states (no hang)

## Mode A → Mode B Forward-Compat

- [ ] API client accepts optional `installationId` scope (no-op in Mode A)
- [ ] Sidebar hides Queues/Settings/Observability when `meta.deploymentMode !== 'selfhosted'`
- [ ] `/api/dashboard/meta` drives mode detection (not build-time flag)

## Responsive

- [ ] Sidebar visible on desktop
- [ ] Tables scroll horizontally on narrow screens
- [ ] KPI cards stack to 2 columns on mobile
- [ ] Repo cards stack to 1 column on mobile

## Git

- [ ] All work committed to `main` branch in `lazydev-frontend` repo
- [ ] 3 commits: initial scaffold, Overview + fixes, all remaining phases
- [ ] `.env.example` tracked, `.env*` ignored
- [ ] `docs/` contains both plan files for self-containment
