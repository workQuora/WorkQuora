/**
 * hooks/useDashboard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dashboard analytics for client and freelancer.
 * Uses dedicated /analytics endpoints for real chart data.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { analyticsApi } from '../api/endpoints';
import { getApiData } from '../api/client';

export const useDashboard = () => {
  const role = useSelector((s) => s.auth.role); // 'CLIENT' | 'FREELANCER'

  // ── Client metrics ─────────────────────────────────────────────────────────
  // Returns: { totalSpent, activeHires, completedProjects, projectProgress[] }
  const useClientDashboard = () =>
    useQuery({
      queryKey: ['clientDashboard'],
      queryFn: async () => {
        const response = await analyticsApi.clientMetrics();
        return getApiData(response);
      },
      enabled: role === 'CLIENT',
      staleTime: 60_000,
    });

  // ── Freelancer revenue ─────────────────────────────────────────────────────
  // Returns: { weeklyData[], totalEarnings, locationStats[], growthPercent }
  const useFreelancerDashboard = () =>
    useQuery({
      queryKey: ['freelancerDashboard'],
      queryFn: async () => {
        const response = await analyticsApi.freelancerRevenue();
        return getApiData(response);
      },
      enabled: role === 'FREELANCER',
      staleTime: 60_000,
    });

  return { useClientDashboard, useFreelancerDashboard };
};
