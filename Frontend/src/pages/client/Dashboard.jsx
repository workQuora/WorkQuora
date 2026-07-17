import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Briefcase, PlusCircle, CheckCircle, IndianRupee, FileText, ArrowRight, History,
} from 'lucide-react';
import api from '../../services/api';
import AdBanner from '../../components/shared/AdBanner';
import { WelcomeOverlay } from '../../components/ui/WelcomeOverlay';
import { AnimatedCard } from '../../components/ui/AnimatedCard';
import { StatCounter } from '../../components/ui/StatCounter';
import { staggerContainer, fadeInUp } from '../../utils/animations';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const STATUS_STYLE = {
  open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'in-progress': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, onboarding } = useSelector((state) => state.auth);

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['client-dashboard'],
    queryFn: () => api.get('/dashboard/client').then((r) => r.data?.data ?? r.data),
    staleTime: 60_000,
    enabled: !!user && onboarding?.onboardingComplete === true,
  });

  const activeJobs = dashData?.stats?.activeJobs ?? 0;
  const totalSpent = dashData?.stats?.totalSpent ?? 0;
  const pendingProposals = dashData?.stats?.pendingProposals ?? 0;
  const completedJobs = dashData?.stats?.completedJobs ?? 0;
  const recentJobs = dashData?.recentJobs ?? [];

  const stats = [
    { label: 'Active Jobs', value: activeJobs, icon: Briefcase, color: '#0EA5E9', sublabel: 'Currently open or in progress' },
    { label: 'Total Spent', value: totalSpent, icon: IndianRupee, color: '#1E00A9', prefix: '₹', sublabel: 'On completed jobs' },
    { label: 'Pending Proposals', value: pendingProposals, icon: FileText, color: '#6366F1', sublabel: 'Awaiting your review' },
    { label: 'Jobs Completed', value: completedJobs, icon: CheckCircle, color: '#10B981', sublabel: 'All-time' },
  ];

  const quickActions = [
    { label: 'Post New Job', icon: PlusCircle, onClick: () => navigate('/client/post-job'), primary: true },
    { label: 'My Jobs', icon: Briefcase, onClick: () => navigate('/client/jobs') },
    { label: 'View History', icon: History, onClick: () => navigate('/client/history') },
  ];

  const subtext = activeJobs > 0
    ? `You have ${activeJobs} active job${activeJobs !== 1 ? 's' : ''} in progress`
    : 'Ready to post your first job?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full min-h-screen bg-background p-6 md:p-10 transition-colors duration-300"
    >
      <WelcomeOverlay userId={user?._id || user?.id} message="Ready to find your next great hire? 🎯" />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {greeting()}, {user?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{subtext}</p>
          </div>
          <button
            onClick={() => navigate('/client/post-job')}
            className="flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-primary/20 active:scale-95 shrink-0 cursor-pointer"
          >
            <PlusCircle size={16} /> Post a New Job
          </button>
        </div>

        <div className="mb-8">
          <AdBanner platform="MOBILE" className="shadow-lg shadow-black/10" />
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border p-5 rounded-2xl shadow-sm animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {stats.map((s, i) => (
              <AnimatedCard key={s.label} className="p-5" delay={i * 0.1}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}15` }}>
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  <StatCounter target={s.value} prefix={s.prefix} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{s.sublabel}</p>
              </AnimatedCard>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {quickActions.map((a) => (
            <motion.button
              key={a.label}
              onClick={a.onClick}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border font-bold text-xs transition-colors ${
                a.primary
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : 'bg-card text-foreground border-border hover:border-primary/40'
              }`}
            >
              <a.icon size={16} /> {a.label}
            </motion.button>
          ))}
        </div>

        {/* Recent activity */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-foreground">Your Job Postings</h2>
            <button onClick={() => navigate('/client/post-job')} className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              Post a Job <ArrowRight size={14} />
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
              <p className="text-muted-foreground text-sm">No activity yet.</p>
              <button
                onClick={() => navigate('/client/post-job')}
                className="mt-4 bg-primary text-primary-foreground px-5 py-2 rounded-xl font-bold text-xs hover:opacity-90 transition-all"
              >
                Post Your First Job
              </button>
            </div>
          ) : (
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-3">
              {recentJobs.slice(0, 5).map((job) => (
                <motion.div
                  key={job._id}
                  variants={fadeInUp}
                  className="p-5 border border-border/60 rounded-xl bg-background/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-foreground">{job.title}</h4>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border ${STATUS_STYLE[job.status] || 'bg-muted text-muted-foreground border-border'}`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Budget: ₹{job.budgetRange?.min?.toLocaleString('en-IN') || '—'}
                      {job.budgetRange?.max ? ` – ₹${job.budgetRange.max.toLocaleString('en-IN')}` : ''}
                      {' '}• {job.category || 'General'}
                      {' '}• {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/job/${job._id}`)}
                    className="px-4 py-2 bg-accent hover:bg-accent/80 text-foreground border border-border font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0"
                  >
                    View Details <ArrowRight size={14} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ClientDashboard;
