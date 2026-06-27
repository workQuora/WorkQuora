import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { getApiData } from '../lib/apiResponse';

/** @param {{ jobId: string, otherUserId: string }} chat */
export const useMessages = (chat) => {
  const queryClient = useQueryClient();
  const { jobId, otherUserId } = chat || {};

  const useFetchChatHistory = () =>
    useQuery({
      queryKey: ['messages', jobId, otherUserId],
      queryFn: async () => {
        if (!jobId || !otherUserId) return [];
        const response = await api.get(`/messages/${jobId}/${otherUserId}`);
        return getApiData(response) || [];
      },
      enabled: !!jobId && !!otherUserId,
    });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ text }) => {
      const response = await api.post('/messages', {
        jobId,
        receiverId: otherUserId,
        text,
      });
      return getApiData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', jobId, otherUserId] });
    },
  });

  return {
    useFetchChatHistory,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  };
};
