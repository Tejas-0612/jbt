import { applicationSchema, type CreateApplicationInput } from '@jbt/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJson, postJson } from '@/lib/api';

/** Cache keys for application data, in one place so they can't drift apart. */
export const applicationKeys = {
  detail: (id: string) => ['applications', id] as const,
};

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
    onSuccess: (application) => {
      queryClient.setQueryData(applicationKeys.detail(application.id), application);
    },
  });
}
