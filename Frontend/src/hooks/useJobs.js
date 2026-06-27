/**
 * hooks/useJobs.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All job-related data operations.
 * Inner hooks (useFetchJobs, useJobById…) are stable — they only re-create
 * when their deps change, not on every parent render.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi, geoApi } from '../api/endpoints';
import { getApiData } from '../api/client';
import toast from 'react-hot-toast';

export const useJobs = () => {
  const queryClient = useQueryClient();

  // ── Geo-filtered job feed (for map + freelancer feed) ─────────────────────
  const useNearbyJobs = (geoParams = {}) =>
    useQuery({
      queryKey: ['nearbyJobs', geoParams],
      queryFn: async () => {
        const response = await geoApi.nearbyJobs(geoParams);
        return getApiData(response) || [];
      },
      enabled: !!(geoParams.lat && geoParams.lng),
      staleTime: 60_000, // 1 min
    });

  // ── AI-powered freelancer feed ─────────────────────────────────────────────
  const useJobFeed = (geoParams = {}) =>
    useQuery({
      queryKey: ['jobFeed', geoParams],
      queryFn: async () => {
        const response = await jobsApi.feed(geoParams);
        return getApiData(response) || [];
      },
      enabled: !!(geoParams.lat && geoParams.lng),
      staleTime: 120_000,
    });

  // ── Search / filtered jobs ─────────────────────────────────────────────────
  const useFetchJobs = (filters = {}) =>
    useQuery({
      queryKey: ['jobs', filters],
      queryFn: async () => {
        const response = await jobsApi.search(filters);
        return getApiData(response) || [];
      },
    });

  // ── Single job detail ──────────────────────────────────────────────────────
  const useJobById = (jobId) =>
    useQuery({
      queryKey: ['job', jobId],
      queryFn: async () => {
        const response = await jobsApi.getById(jobId);
        return getApiData(response);
      },
      enabled: !!jobId,
    });

  // ── Client's own posted jobs ───────────────────────────────────────────────
  const useClientJobs = () =>
    useQuery({
      queryKey: ['clientJobs'],
      queryFn: async () => {
        const response = await jobsApi.myJobs();
        return getApiData(response) || [];
      },
    });

  // ── Post job ───────────────────────────────────────────────────────────────
  const postJobMutation = useMutation({
    mutationFn: (jobData) => jobsApi.create(jobData),
    onSuccess: () => {
      toast.success('Job posted successfully!');
      queryClient.invalidateQueries({ queryKey: ['clientJobs'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobFeed'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to post job.');
    },
  });

  // ── Apply to job ───────────────────────────────────────────────────────────
  const applyMutation = useMutation({
    mutationFn: ({ jobId, ...proposal }) => jobsApi.apply(jobId, proposal),
    onSuccess: (_, { jobId }) => {
      toast.success('Proposal submitted!');
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit proposal.');
    },
  });

  // ── Update job status ──────────────────────────────────────────────────────
  const updateStatusMutation = useMutation({
    mutationFn: ({ jobId, status }) => jobsApi.updateStatus(jobId, status),
    onSuccess: (_, { jobId }) => {
      toast.success('Job status updated!');
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['clientJobs'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status.');
    },
  });

  return {
    // inner query hooks
    useNearbyJobs,
    useJobFeed,
    useFetchJobs,
    useJobById,
    useClientJobs,

    // mutations
    postJob: postJobMutation.mutateAsync,
    isPostingJob: postJobMutation.isPending,

    applyToJob: applyMutation.mutateAsync,
    isApplying: applyMutation.isPending,

    updateJobStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
};
