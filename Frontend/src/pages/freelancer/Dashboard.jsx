import React from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IndianRupee, TrendingUp, Star, ArrowUpRight, Loader2, Briefcase, FileText, Wallet } from 'lucide-react';
import api from '../../services/api';
import KycVerificationCard from '../../components/KycVerificationCard';
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

const TASK_STATUS_STYLE = {
  assigned: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  traveling: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  working: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const FreelancerDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['freelancer-dashboard'],
    queryFn: () => api.get('/dashboard/freelancer').then((r) => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  const { data: latestJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['freelancer-dashboard-jobs'],
    queryFn: () =>
      api.get('/jobs', { params: { limit: 5, status: 'open' } })
        .then((r) => Array.isArray(r.data) ? r.data : (r.data?.data ?? r.data?.jobs ?? [])),
    staleTime: 60_000,
  });

  // Real fields from GET /dashboard/freelancer — note there's no "accepted proposals" or
  // "totalProposals" field on this endpoint, so Active Projects uses pendingTasks (tasks not
  // yet completed) and Completion Rate is computed from completedTasks/totalAssignedTasks —
  // the closest real equivalents actually returned by the backend.
  const activeProjects = dashData?.stats?.pendingTasks ?? 0;
  const totalEarned = dashData?.finances?.allTimeIncome ?? 0;
  const totalAssigned = dashData?.stats?.totalAssignedTasks ?? 0;
  const completedTasks = dashData?.stats?.completedTasks ?? 0;
  const completionRate = totalAssigned > 0 ? Math.round((completedTasks / totalAssigned) * 100) : 0;
  const rating = user?.averageRating ?? 0;
  const recentTasks = dashData?.recentTasks ?? [];

  const stats = [
    { label: 'Active Projects', value: activeProjects, icon: Briefcase, color: '#10B981', sublabel: 'In progress' },
    { label: 'Total Earned', value: totalEarned, icon: IndianRupee, color: '#1E00A9', prefix: '₹', sublabel: 'All-time' },
    { label: 'Completion Rate', value: completionRate, icon: TrendingUp, color: '#6366F1', suffix: '%', sublabel: `${completedTasks} of ${totalAssigned} tasks` },
    { label: 'Average Rating', value: rating, icon: Star, color: '#F59E0B', suffix: '/5', decimals: 1, sublabel: 'From client reviews' },
  ];

  const quickActions = [
    { label: 'Browse Jobs', icon: Briefcase, onClick: () => navigate('/discover'), primary: true },
    { label: 'My Proposals', icon: FileText, onClick: () => navigate('/discover') },
    { label: 'Wallet', icon: Wallet, onClick: () => navigate('/shared/wallet') },
  ];

  const subtext = rating > 4
    ? `Great work! Your rating is ${rating.toFixed(1)} ⭐`
    : activeProjects > 0
    ? `You have ${activeProjects} active project${activeProjects !== 1 ? 's' : ''}`
    : 'Ready to find your next project?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full min-h-screen bg-background p-6 md:p-10 transition-colors duration-300"
    >
      <WelcomeOverlay userId={user?._id || user?.id} message="Ready to land your next project? 🚀" />
      <div className="max-w-7xl mx-auto">
        <KycVerificationCard />

        {/* Profile Card — clickable, goes to /profile */}
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 mb-8 cursor-pointer hover:border-primary/40 transition-all group shadow-sm"
        >
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-inner">
              {user?.avatar || user?.profilePic
                ? <img src={user.avatar || user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                : <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
              }
            </div>
            {user?.isKycVerified && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-card flex items-center justify-center">
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-white"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm truncate">{user?.name || 'Your Name'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.title || user?.role || 'Freelancer'}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
              user?.isKycVerified ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}>
              {user?.isKycVerified ? '✅ KYC Verified' : '⚠️ KYC Pending'}
            </span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {greeting()}, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{subtext}</p>
        </div>

        <div className="mb-8">
          <AdBanner platform="MOBILE" className="shadow-lg shadow-black/10" />
        </div>

        {/* Stats */}
        {dashLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border p-5 rounded-2xl animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {stats.map((s, i) => (
              <AnimatedCard key={s.label} className="p-5" delay={i * 0.1}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}15` }}>
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  <StatCounter target={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{s.sublabel}</p>
              </AnimatedCard>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {quickActions.map((a) => (
            <motion.button
              key={a.label}
              onClick={a.onClick}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border font-bold text-xs transition-colors ${
                a.primary
                  ? 'bg-[#10B981] text-white border-[#10B981] shadow-md shadow-emerald-500/20'
                  : 'bg-card text-foreground border-border hover:border-primary/40'
              }`}
            >
              <a.icon size={16} /> {a.label}
            </motion.button>
          ))}
        </div>

        {/* Recent activity — note: the dashboard endpoint returns recently assigned/active
            contracts (Tasks), not submitted proposals, so this reflects that honestly. */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-foreground">Recent Contracts</h2>
          </div>

          {dashLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : recentTasks.length === 0 ? (
            <div className="text-center py-10">
              <Briefcase className="w-10 h-10 mx-auto text-muted-foreground opacity-20 mb-3" />
              <p className="text-muted-foreground text-sm">No activity yet.</p>
            </div>
          ) : (
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-3">
              {recentTasks.slice(0, 5).map((task) => (
                <motion.div
                  key={task._id}
                  variants={fadeInUp}
                  className="p-4 border border-border/60 rounded-xl bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-foreground">{task.job?.title || 'Untitled job'}</h4>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border ${TASK_STATUS_STYLE[task.status] || 'bg-muted text-muted-foreground border-border'}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Budget: ₹{task.job?.budgetRange?.min?.toLocaleString('en-IN') || task.job?.budget?.toLocaleString('en-IN') || '—'}
                      {' '}• {new Date(task.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Latest Open Jobs */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-foreground">Latest Open Contracts</h2>
            <button onClick={() => navigate('/discover')} className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
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
                    className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:opacity-90 transition-all shrink-0 shadow-sm"
                  >
                    View Job
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FreelancerDashboard;
