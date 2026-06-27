import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/endpoints';
import { getApiData } from '../api/client';   // ← client.js se, endpoints.js se nahi

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationsApi.getAll();
      return response.data || { notifications: [], unreadCount: 0 };
    },
    refetchInterval: 30_000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOneReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markOneRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    markAllRead: markAllReadMutation.mutate,
    markOneRead: markOneReadMutation.mutate,
  };
};