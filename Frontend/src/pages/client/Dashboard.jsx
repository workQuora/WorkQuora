import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, PlusCircle, Users, CheckCircle, AlertCircle, ArrowRight, Loader2, TrendingUp } from 'lucide-react';
import KycVerificationCard from '../../components/KycVerificationCard';
import api from '../../services/api';
import AdBanner from '../../components/shared/AdBanner';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['client-dashboard'],
    queryFn: () => api.get('/dashboard/client').then((r) => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  const stats = [
    {
      label: 'Active Escrow',
      value: dashData?.finances?.escrowBalance
        ? `₹${dashData.finances.escrowBalance.toLocaleString('en-IN')}`
        : '₹0',
      icon: AlertCircle,
      color: 'amber',
    },
    {
      label: 'Jobs Posted',
      value: dashData?.stats?.totalJobsPosted ?? (isLoading ? '…' : '0'),
      icon: Briefcase,
      color: 'indigo',
    },
    {
      label: 'Active Jobs',
      value: dashData?.stats?.activeJobs ?? (isLoading ? '…' : '0'),
      icon: TrendingUp,
      color: 'primary',
    },
    {
      label: 'Total Spent',
      value: dashData?.stats?.totalSpent
        ? `₹${dashData.stats.totalSpent.toLocaleString('en-IN')}`
        : '₹0',
      icon: CheckCircle,
      color: 'emerald',
    },
    {
      label: 'Completed Jobs',
      value: dashData?.stats?.completedJobs ?? (isLoading ? '…' : '0'),
      icon: CheckCircle,
      color: 'blue',
    },
  ];

  const recentJobs = dashData?.recentJobs ?? [];

  return (
    <div className="w-full min-h-screen bg-background p-6 md:p-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">

        {/* Verification Anchor */}
        <KycVerificationCard />

        {/* Greeting & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Client Console, {user?.name?.split(' ')[0] || 'Business'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Hire verified freelancers and manage your projects.</p>
          </div>
          <button
            onClick={() => navigate('/client/post-job')}
            className="flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-primary/20 active:scale-95 shrink-0 cursor-pointer"
          >
            <PlusCircle size={16} /> Post a New Job
          </button>
        </div>

        {/* Dynamic Ad Feed */}
        <div className="mb-8">
          <AdBanner platform="MOBILE" className="shadow-lg shadow-black/10" />
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card border border-border p-5 rounded-2xl shadow-sm animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-8">
            {stats.map(({ label, value, icon: Icon, color }) => {
              const colorMap = {
                amber: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400',
                indigo: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400',
                primary: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground',
                emerald: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400',
                blue: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400',
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

        {/* Recent Job Postings */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-foreground">Your Job Postings</h2>
            <button
              onClick={() => navigate('/discover')}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              Discover Talent <ArrowRight size={14} />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-5 border border-border/60 rounded-xl animate-pulse">
                  <div className="h-5 bg-muted rounded w-1/2 mb-3" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-10 h-10 mx-auto text-muted-foreground opacity-30 mb-3" />
              <p className="text-muted-foreground text-sm">No jobs posted yet.</p>
              <button
                onClick={() => navigate('/client/post-job')}
                className="mt-4 bg-primary text-primary-foreground px-5 py-2 rounded-xl font-bold text-xs hover:opacity-90 transition-all cursor-pointer"
              >
                Post Your First Job
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job._id}
                  className="p-5 border border-border/60 rounded-xl bg-background/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-foreground">{job.title}</h4>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border ${
                        job.status === 'open'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : job.status === 'in-progress'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Budget: ₹{job.budgetRange?.min?.toLocaleString('en-IN') || '—'}
                      {job.budgetRange?.max ? ` – ₹${job.budgetRange.max.toLocaleString('en-IN')}` : ''}
                      {' '}• {job.category || 'General'}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/job/${job._id}`)}
                    className="px-4 py-2 bg-accent hover:bg-accent/80 text-foreground border border-border font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    View Details <ArrowRight size={14} />
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

export default ClientDashboard;