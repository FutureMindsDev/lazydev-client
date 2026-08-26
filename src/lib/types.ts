/**
 * Data contracts mirrored from the LazyDev NestJS backend.
 *
 * These mirror the backend DTOs/entities exactly so that flipping
 * NEXT_PUBLIC_ENABLE_MOCKS=false hits the real API at /api/dashboard/*.
 *
 * Source of truth (backend repo):
 *  - src/dashboard/dashboard.controller.ts   -> DashboardMetrics
 *  - src/orchestration/entities/audit-log.entity.ts -> AuditLogDto
 *  - src/orchestration/graph.state.ts        -> AgentState (timeline nodes)
 *
 * NOTE on pipeline node names: the actual LangGraph nodes are
 * `onboarding | analyzer | research | tools | planner | patcher | validator |
 * human_feedback | git` — the plan doc's "researcher" label is a friendly name
 * for the `research` node. Corrected here for the Run Detail screen.
 */

export type RunStatus = 'SUCCESS' | 'FAILED';

/** Shape returned by GET /api/dashboard/metrics — exists in the backend today. */
export interface DashboardMetrics {
  /** BullMQ getJobCounts() per queue name. Keys are job-state names. */
  queues: Record<string, Record<string, number>>;
  auditLogs: { total: number; success: number; failed: number };
  status: string;
  timestamp: string;
}

/** Maps audit_logs entity. Adds installationId for Mode B tenancy (null in Mode A). */
export interface AuditLogDto {
  id: string;
  taskId: string;
  issueNumber: number;
  issueTitle: string;
  status: RunStatus;
  validationAttempts: number;
  finalValidationFeedback: string | null;
  generatedPatch: string | null;
  createdAt: string;
  installationId?: number | null;
}

/** GET /api/dashboard/meta — tells the UI which deployment mode it is in. */
export interface DashboardMeta {
  deploymentMode: 'selfhosted' | 'hosted';
  auth: 'none' | 'token' | 'github-oauth';
  currentUser?: { login: string; avatarUrl: string; installations: number[] };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/** POST /api/dashboard/runs/:taskId/feedback */
export interface FeedbackRequest {
  feedback: string;
}

/** POST /api/dashboard/runs/:taskId/feedback response */
export interface FeedbackResponse {
  ok: boolean;
  pending: boolean;
}

/** GET /api/dashboard/runs/:taskId/feedback-status */
export interface FeedbackStatus {
  pending: boolean;
  submittedAt: string | null;
}

/** Phase 2 SSE event — per-task pipeline events. */
export interface PipelineEvent {
  taskId: string;
  node: PipelineNode;
  status: 'started' | 'completed' | 'failed';
  payload?: string;
  attempt?: number;
  timestamp: string;
}

/** Pipeline node names matching the actual LangGraph graph. */
export type PipelineNode =
  | 'onboarding'
  | 'analyzer'
  | 'research'
  | 'tools'
  | 'planner'
  | 'patcher'
  | 'validator'
  | 'human_feedback'
  | 'git';

/** A single pipeline stage's rendered state for the timeline. */
export interface PipelineStage {
  node: PipelineNode;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  output?: string;
  attempt?: number;
}

/** Full run detail — extends AuditLogDto with pipeline state slices. */
export interface RunDetailDto extends AuditLogDto {
  repo?: string;
  branch?: string;
  prUrl?: string | null;
  unappliedChanges?: string | null;
  triageContext?: string | null;
  researchContext?: string | null;
  implementationPlan?: string | null;
  pipelineStages?: PipelineStage[];
  feedbackStatus?: FeedbackStatus;
}

/** BullMQ job-state keys present in getJobCounts() output. */
export type JobStateKey =
  | 'waiting'
  | 'active'
  | 'completed'
  | 'failed'
  | 'delayed'
  | 'paused';

/** A single BullMQ job for the queue inspector. */
export interface QueueJob {
  id: string;
  name: string;
  state: JobStateKey;
  attempts: number;
  data: Record<string, unknown>;
  failedReason?: string | null;
  stackTrace?: string | null;
  timestamp: string;
  processedOn?: string | null;
  finishedOn?: string | null;
}

/** Paginated jobs response. */
export interface PaginatedJobs {
  items: QueueJob[];
  total: number;
  limit: number;
  offset: number;
}

/** Repository/installation card data. */
export interface RepositoryDto {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  onboardingStatus: 'pending' | 'indexed' | 'failed' | 'in_progress';
  indexedFiles: number;
  lastSync: string | null;
  autoFix: boolean;
  installationId: number | null;
}

/** Settings/config display (Mode A only, secrets masked). */
export interface SettingsDto {
  llm: {
    provider: 'openai' | 'ollama' | 'gemini' | 'deepseek';
    model: string;
    fallbackModel: string | null;
  };
  sandbox: {
    networkMode: 'none' | 'restricted' | 'unrestricted';
    timeout: number;
  };
  notifications: {
    discord: boolean;
    discordWebhookMasked: string | null;
  };
  queue: {
    concurrency: number;
    maxAttempts: number;
  };
  database: {
    type: string;
    hostMasked: string;
  };
}

/** A single run row for the recent-runs table (subset of AuditLogDto). */
export interface RecentRun {
  taskId: string;
  issueNumber: number;
  issueTitle: string;
  status: RunStatus;
  validationAttempts: number;
  hasPatch: boolean;
  createdAt: string;
}

/** One day's bucket for the 14-day throughput chart. */
export interface ThroughputBucket {
  date: string; // ISO date (YYYY-MM-DD)
  success: number;
  failed: number;
}
