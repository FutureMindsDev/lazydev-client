'use client';

import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { api } from '@/lib/api';
import type {
  ByokSettingsDto,
  DashboardMeta,
  FeedbackStatus,
  PaginatedJobs,
  ProviderConfigDto,
  RepositoryDto,
  RunDetailDto,
  RunStatus,
  SettingsDto,
  UpdateLlmSettingsRequest,
  CreateProviderConfigRequest,
  UpdateProviderConfigRequest,
} from '@/lib/types';

/** /meta is static per session; fetch once. */
export function useMeta() {
  return useSWR<DashboardMeta>('meta', () => api.meta(), {
    revalidateOnFocus: false,
    refreshInterval: 0,
  });
}

// ── Runs list (paginated, filtered) ───────────────────────────────────────

interface UseRunsParams {
  limit?: number;
  offset?: number;
  status?: RunStatus;
  search?: string;
}

export function useRuns(params: UseRunsParams) {
  const key = JSON.stringify(['runs-list', params]);
  return useSWR(
    key,
    () => api.listRuns({ limit: params.limit, offset: params.offset, status: params.status, search: params.search }),
    { keepPreviousData: true, revalidateOnFocus: true },
  );
}

// ── Run detail ────────────────────────────────────────────────────────────

export function useRunDetail(taskId: string | null) {
  return useSWR<RunDetailDto>(taskId ? ['run-detail', taskId] : null, () => api.getRun(taskId!), {
    refreshInterval: 0,
  });
}

export function useFeedbackStatus(taskId: string | null) {
  return useSWR<FeedbackStatus>(
    taskId ? ['feedback-status', taskId] : null,
    () => api.getFeedbackStatus(taskId!),
    { refreshInterval: 10_000 },
  );
}

// ── Queues ────────────────────────────────────────────────────────────────

export function useJobs(queueName: string, state?: string) {
  const key = JSON.stringify(['jobs', queueName, state]);
  return useSWR<PaginatedJobs>(key, () => api.listJobs(queueName, state), {
    refreshInterval: 10_000,
    keepPreviousData: true,
  });
}

// ── Repositories ──────────────────────────────────────────────────────────

export function useRepos() {
  return useSWR<RepositoryDto[]>('repos', () => api.listRepos(), { revalidateOnFocus: true });
}

// ── Settings ──────────────────────────────────────────────────────────────

export function useSettings() {
  return useSWR<SettingsDto>('settings', () => api.getSettings());
}

/** PUT /api/dashboard/settings/llm — optimistically updates the settings cache. */
export function useUpdateLlmSettings() {
  const { mutate } = useSWRConfig();
  return useSWRMutation<ByokSettingsDto, Error, string, UpdateLlmSettingsRequest>(
    'settings/llm',
    (_key, { arg }) => api.updateLlmSettings(arg),
    {
      onSuccess: () => mutate('settings'),
    },
  );
}

/** DELETE /api/dashboard/settings/llm — clears the BYOK config. */
export function useDeleteLlmSettings() {
  const { mutate } = useSWRConfig();
  return useSWRMutation<{ ok: boolean }, Error, string, void>(
    'settings/llm-delete',
    (_key) => api.deleteLlmSettings(),
    {
      onSuccess: () => mutate('settings'),
    },
  );
}

// ── Provider config CRUD (multi-provider) ──────────────────────────────────

/** POST /api/dashboard/settings/providers — create a provider config. */
export function useCreateProvider() {
  const { mutate } = useSWRConfig();
  return useSWRMutation<ProviderConfigDto, Error, string, CreateProviderConfigRequest>(
    'settings/providers/create',
    (_key, { arg }) => api.createProvider(arg),
    {
      onSuccess: () => mutate('settings'),
    },
  );
}

/** PUT /api/dashboard/settings/providers/:id — update a provider config. */
export function useUpdateProvider() {
  const { mutate } = useSWRConfig();
  return useSWRMutation<
    ProviderConfigDto,
    Error,
    string,
    { id: string; body: UpdateProviderConfigRequest }
  >('settings/providers/update', (_key, { arg }) => api.updateProvider(arg.id, arg.body), {
    onSuccess: () => mutate('settings'),
  });
}

/** DELETE /api/dashboard/settings/providers/:id — delete a provider config. */
export function useDeleteProvider() {
  const { mutate } = useSWRConfig();
  return useSWRMutation<{ ok: boolean }, Error, string, string>(
    'settings/providers/delete',
    (_key, { arg }) => api.deleteProvider(arg),
    {
      onSuccess: () => mutate('settings'),
    },
  );
}
