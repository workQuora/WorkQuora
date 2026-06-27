import React from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Wallet, Star, Clock, ArrowUpRight, Loader2, Briefcase, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import KycVerificationCard from '../../components/KycVerificationCard';
import AdBanner from '../../components/shared/AdBanner';

const FreelancerDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  // Real freelancer dashboard data from backend
  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['freelancer-dashboard'],
    queryFn: () => api.get('/dashboard/freelancer').then((r) => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  // Wallet balance
  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => api.get('/dashboard/wallet').then((r) => r.data?.data ?? r.data),
    staleTime: 30_000,
  });

  // Latest open jobs (instead of broken /geo/nearby-jobs)
  const { data: latestJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['freelancer-dashboard-jobs'],
    queryFn: () =>
      api.get('/jobs', { params: { limit: 5, status: 'open' } })
        .then((r) => Array.isArray(r.data) ? r.data : (r.data?.data ?? r.data?.jobs ?? [])),
    staleTime: 60_000,
  });

  const stats = [
    {
      label: 'Wallet Balance',
      value: walletData?.balance != null ? `₹${walletData.balance.toLocaleString('en-IN')}` : '₹0',
      icon: Wallet,
      color: 'emerald',
    },
    {
      label: 'Total Earned',
      value: dashData?.finances?.allTimeIncome != null
        ? `₹${dashData.finances.allTimeIncome.toLocaleString('en-IN')}`
        : '₹0',
      icon: TrendingUp,
      color: 'indigo',
    },
    {
      label: 'Jobs Done',
      value: dashData?.stats?.completedTasks ?? (dashLoading ? '…' : '0'),
      icon: Clock,
      color: 'blue',
    },
    {
      label: 'Active Tasks',
      value: dashData?.stats?.pendingTasks ?? (dashLoading ? '…' : '0'),
      icon: Star,
      color: 'amber',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-background p-6 md:p-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <KycVerificationCard />

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back, {user?.name?.split(' ')[0] || 'Freelancer'}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening with your profile today.</p>
        </div>

        {/* Dynamic Ad Feed */}
        <div className="mb-8">
          <AdBanner platform="MOBILE" className="shadow-lg shadow-black/10" />
        </div>

        {/* Stats */}
        {dashLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border p-5 rounded-2xl animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {stats.map(({ label, value, icon: Icon, color }) => {
              const colorMap = {
                emerald: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400',
                indigo: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400',
                blue: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400',
                amber: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400',
              };
              return (
                <div key={label} className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                    <h3 className="text-2xl font-black text-foreground mt-1">{value}</h3>
                  </div>
                  <div className={`p-3 rounded-xl ${colorMap[color] || 'bg-muted text-muted-foreground'}`}>
                    <Icon size={20} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Latest Open Contracts */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-foreground">Latest Open Contracts</h2>
            <button onClick={() => navigate('/discover')} className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer">
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          {jobsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : latestJobs.length === 0 ? (
            <div className="text-center py-10">
              <Briefcase className="w-10 h-10 mx-auto text-muted-foreground opacity-20 mb-3" />
              <p className="text-muted-foreground text-sm">No open jobs right now. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {latestJobs.map((job) => (
                <div key={job._id}
                  className="p-4 border border-border/60 hover:border-primary/40 rounded-xl transition-all bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  <div>
                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{job.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Budget: ₹{job.budgetRange?.min?.toLocaleString('en-IN') || '—'}
                      {job.budgetRange?.max ? ` – ₹${job.budgetRange.max.toLocaleString('en-IN')}` : ''}
                      {' '}• {job.category || 'General'}
                    </p>
                    {job.skillsRequired?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.skillsRequired.slice(0, 3).map((s) => (
                          <span key={s} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-md">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/job/${job._id}`)}
                    className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:opacity-90 transition-all shrink-0 cursor-pointer shadow-sm"
                  >
                    View Job
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreelancerDashboard;