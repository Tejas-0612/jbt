import {
  applicationListItemSchema,
  applicationSchema,
  type CreateApplicationInput,
  type ListApplicationsParams,
} from '@jbt/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJson, getPage, postJson } from '@/lib/api';

/** Cache keys for application data, in one place so they can't drift apart. */
export const applicationKeys = {
  // Every list page (any search, filter, sort or page) starts with this, so one
  // invalidation marks them all out of date.
  lists: () => ['applications', 'list'] as const,
  list: (params: ListApplicationsParams) => [...applicationKeys.lists(), params] as const,
  detail: (id: string) => ['applications', 'detail', id] as const,
};

/** One page of the user's applications. */
export function useApplicationList(params: ListApplicationsParams) {
  return useQuery({
    queryKey: applicationKeys.list(params),
    queryFn: () =>
      getPage(`/api/v1/applications?${new URLSearchParams(params)}`, applicationListItemSchema),
    // While the next page or search loads, keep showing the current rows instead of
    // flashing back to the loading state.
    placeholderData: keepPreviousData,
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => getJson(`/api/v1/applications/${encodeURIComponent(id)}`, applicationSchema),
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateApplicationInput) =>
      postJson('/api/v1/applications', input, applicationSchema),
    // The answer is the full application: store it, so its page opens instantly.
    // Every list is now out of date: refetch the ones on screen, the rest when opened.
    onSuccess: (application) => {
      queryClient.setQueryData(applicationKeys.detail(application.id), application);
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });
}
