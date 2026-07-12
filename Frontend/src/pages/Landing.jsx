import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Shield, Zap, Users, Briefcase, ArrowRight, ArrowUpRight,
  ChevronDown, X, ExternalLink, Sparkles, Star, MessageSquare, FileText, Check,
  ClipboardList, UserCheck, UserPlus, Award, Compass, Rocket,
  PlusCircle, LayoutDashboard, Wallet, MapPin
} from 'lucide-react';
import api from '../services/api';
import AdBanner from '../components/shared/AdBanner';
import { GradientBlob } from '../components/ui/GradientBlob';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { StatCounter } from '../components/ui/StatCounter';
import { fadeInUp, staggerContainer } from '../utils/animations';
import { Card, Button, Badge } from '../components/ui';

const JOB_STATUS_VARIANT = { open: 'success', 'in-progress': 'warning', completed: 'info', cancelled: 'danger' };

const CATEGORIES = [
  { label: 'Design', emoji: '🎨' },
  { label: 'Development', emoji: '💻' },
  { label: 'Writing', emoji: '✍️' },
  { label: 'Marketing', emoji: '📣' },
  { label: 'Plumbing', emoji: '🔧' },
  { label: 'Electrical', emoji: '⚡' },
];

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, user, onboarding } = useSelector((s) => s.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' | 'freelancers'

  const scrollToHowItWorks = (tab) => {
    setActiveTab(tab);
    setTimeout(() => {
      const element = document.getElementById('how-it-works');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  // ── Ads Logic for Logged-In Users ──
  const { data: activeAds, isLoading: adsLoading } = useQuery({
    queryKey: ['active-ads-landing'],
    queryFn: () => api.get('/ads/active', { params: { platform: 'WEB' } }).then((r) => r.data?.data ?? r.data ?? []),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const [initialImpressions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ad-impressions') || '{}');
    } catch {
      return {};
    }
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const visibleAds = (activeAds || []).filter((ad) => {
    const cap = ad.dailyFrequency ?? 3;
    const currentImpressions = initialImpressions[ad._id]?.date === todayStr 
      ? initialImpressions[ad._id].count 
      : 0;
    return currentImpressions < cap;
  });

  useEffect(() => {
    if (isAuthenticated && visibleAds.length > 0) {
      visibleAds.forEach((ad) => {
        // Track impression on server
        api.post('/ads/track', { adId: ad._id, event: 'impression' }).catch(console.error);

        // Update local frequency cap in localStorage
        try {
          const impressions = JSON.parse(localStorage.getItem('ad-impressions') || '{}');
          if (!impressions[ad._id] || impressions[ad._id].date !== todayStr) {
            impressions[ad._id] = { date: todayStr, count: 1 };
          } else {
            impressions[ad._id].count += 1;
          }
          localStorage.setItem('ad-impressions', JSON.stringify(impressions));
        } catch (e) {
          console.error('Failed to update ad impressions:', e);
        }
      });
    }
  }, [visibleAds.length, isAuthenticated]);

  const handleAdClick = (ad) => {
    api.post('/ads/track', { adId: ad._id, event: 'click' }).catch(console.error);
    window.open(ad.targetLink, '_blank', 'noopener,noreferrer');
  };

  // ── Normal Landing Page Queries ──
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['landing-jobs'],
    queryFn: () => api.get('/jobs', { params: { limit: 6, status: 'open' } }).then((r) => r.data?.data ?? r.data ?? {}),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['landing-public-stats'],
    queryFn: () => api.get('/stats/public').then((r) => r.data?.data ?? r.data ?? {}),
    staleTime: 30_000,
  });

  const featuredJobs = Array.isArray(jobsData) ? jobsData.slice(0, 6) : (jobsData?.data ?? jobsData?.jobs ?? []).slice(0, 6);

  // City used for the freelancer hero subtitle — same source Navbar/Discover use
  const homeCity = useSelector((s) => s.client?.details?.currentLocation?.city) || user?.location?.city;

  // Client's own posted jobs + proposal stats for the client-role home view
  const { data: clientDashData } = useQuery({
    queryKey: ['client-dashboard-home'],
    queryFn: () => api.get('/dashboard/client').then((r) => r.data?.data ?? r.data),
    enabled: isAuthenticated && role === 'CLIENT' && onboarding?.onboardingComplete === true,
    staleTime: 60_000,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/discover${searchQuery.trim() ? `?keyword=${encodeURIComponent(searchQuery.trim())}` : ''}`);
  };

  // ── Render Logged-In Home View (role-aware) ──
  if (isAuthenticated) {
    const isClientHome = role === 'CLIENT';

    // Fetch freelancer stats for the right column
    const { data: dashData } = useQuery({
      queryKey: ['freelancer-dashboard-home'],
      queryFn: () => api.get('/dashboard/freelancer').then((r) => r.data?.data ?? r.data),
      enabled: role === 'FREELANCER' && onboarding?.onboardingComplete === true,
      staleTime: 60_000,
    });

    const activeMilestones = dashData?.stats?.pendingTasks ?? 4;

    // Directly use real DB jobs — no fallbacks. Empty DB = empty UI.
    const jobList = featuredJobs || [];
    const firstJob = jobList[0] || null;
    const secondJob = jobList[1] || null;
    const premiumJob = jobList[2] || null;

    const clientJobs = clientDashData?.recentJobs ?? [];
    const pendingProposals = clientDashData?.stats?.pendingProposals ?? 0;

    // Only show real ads from DB — no hardcoded fallback ad
    const featuredAd = visibleAds && visibleAds.length > 0 ? visibleAds[0] : null;

    return (
      <div className="bg-slate-50/50 dark:bg-[#07070c] text-slate-800 dark:text-foreground w-full min-h-screen py-8 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6">

          {/* 1. Welcome Hero Section */}
          <section className="text-center py-10 md:py-12 mb-8 bg-white dark:bg-[#0d0d15] rounded-3xl border border-slate-200/60 dark:border-white/5 shadow-sm p-5 sm:p-8 relative overflow-hidden transition-all duration-300">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.07), transparent 65%)' }}
            />
            <GradientBlob className="opacity-10 dark:opacity-15" />
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="max-w-xl mx-auto relative z-10"
            >
              <motion.h1 variants={fadeInUp} className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-sm text-slate-500 dark:text-muted-foreground mb-6">
                {isClientHome
                  ? 'Find the right talent for your next job'
                  : `Find work near you${homeCity ? ` in ${homeCity}` : ''}`}
              </motion.p>

              {/* Search input */}
              <motion.form
                variants={fadeInUp}
                onSubmit={handleSearch}
                className="relative flex items-center gap-2 bg-slate-100 dark:bg-white/[0.03] border border-transparent focus-within:border-primary/30 rounded-full px-5 py-3 mb-5 shadow-sm transition-colors"
              >
                <Search className="w-4 h-4 text-slate-400 dark:text-muted-foreground mr-1 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isClientHome ? 'Search for talent, skills…' : 'Search for open contracts, gigs…'}
                  className="bg-transparent text-slate-850 dark:text-foreground w-full focus:outline-none placeholder:text-slate-400 dark:placeholder:text-muted-foreground/60 text-sm font-medium"
                />
                <button type="submit" className="text-xs text-primary font-bold hover:underline px-2 shrink-0 cursor-pointer">
                  Search Gigs
                </button>
              </motion.form>

              {/* Categories quick-chips */}
              <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-2">
                {CATEGORIES.slice(0, 4).map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => navigate(`/discover?category=${cat.label.toLowerCase()}`)}
                    className="px-4 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary border-none text-xs font-semibold rounded-full transition-colors cursor-pointer"
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          </section>

          {/* 2. Grid Layout: Left Column (Recommended / Jobs) & Right Column (Widgets) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column (2/3 width) */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {isClientHome ? (
                <>
                  {/* Client header + primary CTA */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Your Active Jobs
                    </h2>
                    <Button variant="primary" size="sm" onClick={() => navigate('/client/post-job')}>
                      <PlusCircle className="w-3.5 h-3.5" /> Post a New Job
                    </Button>
                  </div>

                  {clientJobs.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-16 text-center">
                      <Briefcase className="w-12 h-12 text-slate-300 dark:text-white/20 mb-4" />
                      <p className="text-sm font-semibold text-slate-500 dark:text-muted-foreground mb-1">You haven't posted any jobs yet</p>
                      <p className="text-xs text-slate-400 dark:text-muted-foreground/60 mb-5">Post a job to start receiving proposals from freelancers.</p>
                      <Button variant="primary" size="sm" onClick={() => navigate('/client/post-job')}>
                        <PlusCircle className="w-3.5 h-3.5" /> Post a New Job
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {clientJobs.slice(0, 4).map((job) => (
                        <Card
                          key={job._id}
                          hover
                          onClick={() => navigate(`/job/${job._id}`)}
                          className="cursor-pointer flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <Badge variant={JOB_STATUS_VARIANT[job.status] || 'neutral'}>{job.status}</Badge>
                              <span className="text-[10px] text-slate-400 dark:text-muted-foreground/60 uppercase font-semibold truncate">{job.category}</span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-2 line-clamp-1">
                              {job.title}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                              {job.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                              ₹{job.budgetRange?.min?.toLocaleString('en-IN') || job.budget?.toLocaleString('en-IN') || '—'}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  <Card className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Need more hands?</h3>
                      <p className="text-xs text-muted-foreground">Browse verified freelancers ready to help nearby.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => navigate('/discover')} className="shrink-0">
                      Find Talent Nearby <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Card>
                </>
              ) : (
                <>
                  {/* Freelancer header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Recommended Jobs for You
                    </h2>
                    <button
                      onClick={() => navigate('/discover')}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  {/* Two Column cards — 100% real DB data */}
                  {jobsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {[0, 1].map((i) => (
                        <div key={i} className="bg-white dark:bg-[#0f0f18] border border-slate-200/80 dark:border-white/5 rounded-2xl p-6 animate-pulse h-52">
                          <div className="h-5 bg-slate-200 dark:bg-white/10 rounded w-1/3 mb-4" />
                          <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4 mb-3" />
                          <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-full mb-2" />
                          <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-2/3" />
                        </div>
                      ))}
                    </div>
                  ) : jobList.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-16 text-center">
                      <Briefcase className="w-12 h-12 text-slate-300 dark:text-white/20 mb-4" />
                      <p className="text-sm font-semibold text-slate-500 dark:text-muted-foreground mb-1">No jobs in database right now</p>
                      <p className="text-xs text-slate-400 dark:text-muted-foreground/60 mb-5">New jobs will appear here as soon as clients post them.</p>
                      <Button variant="primary" size="sm" onClick={() => navigate('/discover')}>Browse All Jobs</Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {[firstJob, secondJob].filter(Boolean).map((job) => (
                        <Card key={job._id} hover className="flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-lg font-extrabold text-[#1E00A9] dark:text-[#10B981]">
                                ₹{job.budgetRange?.min?.toLocaleString('en-IN') || job.budget?.toLocaleString('en-IN') || '—'}
                              </span>
                              <Badge variant="success">{job.category}</Badge>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-2 line-clamp-1">
                              {job.title}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                              {job.description}
                            </p>
                            {job.distance && (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-3">
                                <MapPin className="w-3 h-3" /> {job.distance} away
                              </div>
                            )}
                            {job.skillsRequired?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {job.skillsRequired.slice(0, 2).map((skill) => (
                                  <span key={skill} className="px-2.5 py-0.5 bg-slate-100 dark:bg-white/5 rounded-md text-[10px] font-semibold text-slate-500 dark:text-muted-foreground">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button variant="primary" size="sm" className="w-full" onClick={() => navigate(`/job/${job._id}`)}>
                            Apply Now
                          </Button>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Premium Listing block card — only shown if there's a 3rd DB job */}
                  {premiumJob && (
                    <Card className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-amber-500/20 transition-colors group">
                      <div className="flex-1">
                        <span className="inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded border border-amber-500/20 mb-3 tracking-wider">
                          Premium Listing
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-primary transition-colors">
                          {premiumJob.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl mb-4 line-clamp-2">
                          {premiumJob.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold">
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                            💰 ₹{premiumJob.budgetRange?.min?.toLocaleString('en-IN') || premiumJob.budget?.toLocaleString('en-IN') || '—'}
                            {premiumJob.budgetRange?.max ? ` – ₹${premiumJob.budgetRange.max.toLocaleString('en-IN')}` : ''}
                          </span>
                          <span>⏱️ {premiumJob.duration || '2 Months'}</span>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/job/${premiumJob._id}`)} className="shrink-0">
                        View Detailed Brief
                      </Button>
                    </Card>
                  )}
                </>
              )}

            </div>

            {/* Right Column: Widgets (1/3 width) */}
            <div className="flex flex-col gap-6">

              {/* Promoted ad — only rendered at all when loading or an ad exists (no placeholder clutter) */}
              {(adsLoading || featuredAd) && (
                <Card>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground/60 uppercase tracking-widest">Promoted</span>
                  {adsLoading ? (
                    <div className="aspect-video bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse mt-3" />
                  ) : (
                    <div className="mt-3">
                      <div className="bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-2xl overflow-hidden mb-3 relative aspect-video flex flex-col justify-end p-4">
                        {featuredAd.mediaUrl && (
                          <img
                            src={featuredAd.mediaUrl}
                            alt={featuredAd.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                        <div className="relative z-10 text-left">
                          <span className="inline-flex text-[8px] font-extrabold bg-primary text-white uppercase px-1.5 py-0.5 rounded mb-1">
                            {featuredAd.brandName || 'Sponsored'}
                          </span>
                          <h4 className="text-xs font-bold text-white leading-tight">{featuredAd.title}</h4>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{featuredAd.description}</p>
                      <Button variant="secondary" size="sm" className="w-full" onClick={() => handleAdClick(featuredAd)}>
                        Learn More
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              {isClientHome ? (
                /* Quick Actions Widget (CLIENT) */
                <Card>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    Quick Actions
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                    You have {pendingProposals} pending proposal{pendingProposals !== 1 ? 's' : ''} to review.
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {[
                      { icon: PlusCircle, label: 'Post a Job', to: '/client/post-job' },
                      { icon: LayoutDashboard, label: 'Go to Dashboard', to: '/client/dashboard' },
                      { icon: Wallet, label: 'Manage Wallet', to: '/shared/wallet' },
                      { icon: MessageSquare, label: 'Messages', to: '/shared/messages' },
                    ].map((action) => (
                      <button
                        key={action.label}
                        onClick={() => navigate(action.to)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-foreground transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <action.icon className="w-3.5 h-3.5 text-primary" /> {action.label}
                        </span>
                        <span className="text-slate-400">&rarr;</span>
                      </button>
                    ))}
                  </div>
                </Card>
              ) : (
                /* Manage Tasks Widget (FREELANCER) */
                <Card>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    Manage Tasks
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                    You have {activeMilestones} active milestone{activeMilestones !== 1 ? 's' : ''} due this week. Keep your rating high by staying on track.
                  </p>

                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => navigate('/freelancer/dashboard')}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-foreground transition-all cursor-pointer"
                    >
                      <span>Go to Dashboard</span>
                      <span className="text-slate-400">&rarr;</span>
                    </button>
                    <button
                      onClick={() => navigate('/shared/wallet')}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-foreground transition-all cursor-pointer"
                    >
                      <span>Manage Wallet</span>
                      <span className="text-slate-400">&rarr;</span>
                    </button>
                  </div>
                </Card>
              )}

            </div>

          </div>

        </div>
      </div>
    );
  }

  // ── Public Landing Page View (When NOT Logged-in) ──
  return (
    <div className="bg-[hsl(var(--background))] text-foreground w-full min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <GradientBlob />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 md:py-32 text-center"
        >

          <motion.div variants={fadeInUp} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              India's Premier Freelance Marketplace
            </span>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
            Find Work.{' '}
            <span className="bg-gradient-to-r from-[#1E00A9] via-[#6366F1] to-[#10B981] bg-clip-text text-transparent">
              Get Hired.
            </span>{' '}
            Build Together.
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with verified clients and skilled freelancers. Secure escrow payments, real-time chat, KYC-verified profiles.
          </motion.p>

          {/* Search */}
          <motion.div variants={fadeInUp} className="relative max-w-2xl mx-auto mb-6 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#1E00A9] via-[#6366F1] to-[#10B981] rounded-full opacity-10 blur-lg group-hover:opacity-15 transition-opacity duration-300 pointer-events-none" />
            <form onSubmit={handleSearch} className="relative flex items-center bg-[hsl(var(--surface))] p-1.5 pl-4 rounded-full shadow-lg transition-all focus-within:shadow-xl border border-border">
              <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, skills, or freelancers..."
                className="bg-transparent text-foreground w-full focus:outline-none placeholder:text-muted-foreground/60 text-sm font-semibold py-3"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="p-1.5 mr-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button type="submit" className="bg-primary hover:opacity-90 text-white font-bold py-3 px-6 rounded-full transition-all flex items-center gap-1.5 shrink-0 active:scale-95 shadow-md border-none cursor-pointer">
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center mb-16">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(30,0,169,0.25)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => scrollToHowItWorks('clients')}
              className="px-6 py-3.5 sm:px-8 sm:py-4 bg-primary text-white rounded-xl font-semibold text-base sm:text-lg shadow-lg shadow-primary/20 flex items-center gap-2 border-none cursor-pointer"
            >
              I Want to Hire <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => scrollToHowItWorks('freelancers')}
              className="px-6 py-3.5 sm:px-8 sm:py-4 bg-[hsl(var(--surface))] text-primary rounded-xl font-semibold text-base sm:text-lg border-2 border-primary/20 hover:border-primary/50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              I Want to Work
            </motion.button>
          </motion.div>

          {/* Stats Strip */}
          <motion.div 
            variants={fadeInUp} 
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-12 bg-[hsl(var(--surface))] border border-border/80 rounded-3xl p-5 sm:p-8 max-w-4xl mx-auto shadow-sm"
          >
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-foreground">
                <StatCounter target={statsData?.liveJobs ?? 0} duration={1200} />
              </span>
              <span className="text-xs uppercase font-bold tracking-wider mt-1 text-slate-500">Live Jobs</span>
            </div>
            <div className="w-px h-8 bg-border hidden sm:block" />
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-foreground">
                <StatCounter target={statsData?.totalWorkers ?? 0} duration={1200} />
              </span>
              <span className="text-xs uppercase font-bold tracking-wider mt-1 text-slate-500">Freelancers</span>
            </div>
            <div className="w-px h-8 bg-border hidden sm:block" />
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-foreground">
                <StatCounter target={statsData?.totalClients ?? 0} duration={1200} />
              </span>
              <span className="text-xs uppercase font-bold tracking-wider mt-1 text-slate-500">Registered Clients</span>
            </div>

          </motion.div>

        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* How WorkQuora Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-[hsl(var(--surface-2))] border-t border-border/40 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer} className="text-center mb-12">
            <motion.p variants={fadeInUp} className="text-primary font-semibold text-xs uppercase tracking-wider mb-2">
              Step-by-Step Guide
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-extrabold text-foreground">
              How WorkQuora Works
            </motion.h2>
          </motion.div>

          {/* Toggle Switch */}
          <div className="flex justify-center mb-16 px-2">
            <div className="max-w-full bg-[hsl(var(--surface))] border border-border p-1 rounded-full flex gap-1 relative shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('clients')}
                className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs font-bold transition-all relative z-10 cursor-pointer border-none outline-none whitespace-nowrap ${
                  activeTab === 'clients' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {activeTab === 'clients' && (
                  <motion.div
                    layoutId="activeTabPillPublic"
                    className="absolute inset-0 bg-primary rounded-full -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                FOR CLIENTS
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('freelancers')}
                className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs font-bold transition-all relative z-10 cursor-pointer border-none outline-none whitespace-nowrap ${
                  activeTab === 'freelancers' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {activeTab === 'freelancers' && (
                  <motion.div
                    layoutId="activeTabPillPublic"
                    className="absolute inset-0 bg-primary rounded-full -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                FOR FREELANCERS
              </button>
            </div>
          </div>

          {/* Steps Display */}
          <div className="min-h-[350px]">
            <AnimatePresence mode="wait">
              {activeTab === 'clients' ? (
                <motion.div
                  key="clients-flow"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-12"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { step: '01', title: 'TELL US WHAT YOU NEED', desc: 'Explain the work or service you are looking for.', icon: ClipboardList },
                      { step: '02', title: 'FIND THE RIGHT PROFESSIONAL', desc: 'Explore people with relevant skills.', icon: UserCheck },
                      { step: '03', title: 'CHOOSE WHO YOU WANT TO WORK WITH', desc: 'Review the available information and select the right person for your work.', icon: Users },
                      { step: '04', title: 'CONTINUE YOUR WORK ON WORKQUORA', desc: 'Create your Client account and continue through the WorkQuora Client experience.', icon: Rocket },
                    ].map((item) => (
                      <div key={item.step} className="p-6 bg-[hsl(var(--surface))] border border-border/80 rounded-2xl flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <span className="text-3xl font-extrabold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent opacity-90 group-hover:scale-105 transition-transform inline-block">
                              {item.step}
                            </span>
                            <div className="p-2 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white rounded-xl transition-all duration-300">
                              <item.icon className="w-5 h-5" />
                            </div>
                          </div>
                          <h4 className="font-bold text-foreground text-sm tracking-tight leading-snug group-hover:text-primary transition-colors">{item.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                        <div className="w-full h-1 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 mt-6 rounded-full group-hover:via-primary/30 transition-colors" />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => navigate('/auth?mode=register')}
                      className="px-8 py-3.5 bg-primary hover:opacity-90 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-primary/20 cursor-pointer border-none"
                    >
                      CREATE CLIENT ACCOUNT
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="freelancers-flow"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-16"
                >
                  {/* Freelancer Step Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { step: '01', title: 'CREATE YOUR WORK PROFILE', desc: 'Tell clients what work you can do.', icon: UserPlus },
                      { step: '02', title: 'SHOW YOUR SKILLS', desc: 'Add the skills and services you provide.', icon: Award },
                      { step: '03', title: 'FIND WORK OPPORTUNITIES', desc: 'Explore work related to your skills.', icon: Compass },
                      { step: '04', title: 'CONTINUE YOUR WORK ON WORKQUORA', desc: 'Create your Freelancer account and continue through the existing WorkQuora Freelancer experience.', icon: Rocket },
                    ].map((item) => (
                      <div key={item.step} className="p-6 bg-[hsl(var(--surface))] border border-border/80 rounded-2xl flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <span className="text-3xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent opacity-90 group-hover:scale-105 transition-transform inline-block">
                              {item.step}
                            </span>
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white rounded-xl transition-all duration-300">
                              <item.icon className="w-5 h-5" />
                            </div>
                          </div>
                          <h4 className="font-bold text-foreground text-sm tracking-tight leading-snug group-hover:text-emerald-400 transition-colors">{item.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                        <div className="w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 mt-6 rounded-full group-hover:via-emerald-500/30 transition-colors" />
                      </div>
                    ))}
                  </div>

                  {/* Skills & Categories Presentation */}
                  <div className="space-y-8">
                    <div className="text-center space-y-2">
                      <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Skills People Can Offer</h3>
                      <h2 className="text-2xl font-bold text-slate-100">Explore Work Categories</h2>
                      <p className="text-xs text-muted-foreground max-w-lg mx-auto">
                        Connect with professionals offering a wide range of services designed to get your project completed on time.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        { title: 'Plumbing', desc: 'Leak repairs, tap replacements, pipe installs, and drainage solutions.', icon: '🚰' },
                        { title: 'Electrical', desc: 'Wiring repairs, switchboard installations, fan/light fittings, and safety checkups.', icon: '⚡' },
                        { title: 'Carpentry', desc: 'Furniture repairs, cabinet installations, wooden fittings, and door repairs.', icon: '🪚' },
                        { title: 'Mechanic Services', desc: 'Two-wheeler checkups, car tuning, oil changes, and minor mechanical repairs.', icon: '🔧' },
                        { title: 'Cleaning', desc: 'Deep home cleaning, washroom scrubbing, sofa vacuuming, and general sweeping.', icon: '🧹' },
                        { title: 'Painting', desc: 'Wall touch-ups, interior & exterior paint coats, and surface priming.', icon: '🎨' },
                        { title: 'Local Services', desc: 'Appliance installations, device troubleshooting, and general daily chores.', icon: '🏠' },
                        { title: 'General Handyman', desc: 'Multi-skilled tasks, item assembly, lock replacement, and general help.', icon: '🛠️' }
                      ].map((cat) => (
                        <div key={cat.title} className="p-6 bg-[#0f0f18] border border-white/5 hover:border-emerald-500/30 rounded-2xl flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all group">
                          <div className="space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg">
                              {cat.icon}
                            </div>
                            <div className="space-y-1.5">
                              <h4 className="font-bold text-slate-100 text-sm tracking-tight">{cat.title}</h4>
                              <p className="text-[11px] text-slate-400 leading-relaxed">{cat.desc}</p>
                            </div>
                          </div>
                          <div className="w-full h-0.5 bg-white/5 mt-5 group-hover:bg-emerald-500/20 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => navigate('/auth?mode=register')}
                      className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 cursor-pointer border-none"
                    >
                      CREATE WORK PROFILE
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* SCREEN 5: DUAL CLIENT + FREELANCER CONVERSION */}
      <section className="py-16 md:py-24 bg-[hsl(var(--background))] border-t border-border/40 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Side: Client Panel */}
            <div className="p-8 sm:p-12 rounded-3xl bg-[hsl(var(--surface))] border border-border/85 hover:border-primary/30 transition-all flex flex-col justify-between gap-8 group shadow-sm">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground">Hire Top Talent</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">Find the right professional for your work.</p>
                </div>
                <ul className="space-y-3.5 text-xs text-muted-foreground font-medium">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Post your requirement in seconds
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Review verified professional profiles
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Communicate clearly via real-time chat
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Complete jobs securely using digital escrow
                  </li>
                </ul>
              </div>
              <button
                onClick={() => navigate('/auth?mode=register')}
                className="w-full py-4 bg-primary hover:opacity-90 text-white rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-primary/20 active:scale-[0.98] cursor-pointer border-none"
              >
                HIRE NOW
              </button>
            </div>

            {/* Right Side: Freelancer Panel */}
            <div className="p-8 sm:p-12 rounded-3xl bg-[hsl(var(--surface))] border border-border/85 hover:border-emerald-500/30 transition-all flex flex-col justify-between gap-8 group shadow-sm">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-650" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground">Find Work</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">Discover opportunities that match your skills.</p>
                </div>
                <ul className="space-y-3.5 text-xs text-muted-foreground font-medium">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Create your professional work profile
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Explore verified opportunities in your area
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Connect directly with local clients
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Get paid instantly to your wallet ledger
                  </li>
                </ul>
              </div>
              <button
                onClick={() => navigate('/auth?mode=register')}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] cursor-pointer border-none"
              >
                FIND WORK
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-12 md:py-16 bg-[hsl(var(--surface-2))] border-t border-border/40 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { icon: Shield, title: 'KYC Verified', desc: 'Secure digital identity checks linked to Aadhaar & PAN verification.' },
              { icon: Zap, title: 'Secure Payments', desc: 'Safe deposit holding in digital escrow with UPI bank settlements.' },
              { icon: MessageSquare, title: 'Real-time Chat', desc: 'Integrated communication pipeline with instant chat support.' },
              { icon: Briefcase, title: 'On-time Payments', desc: 'Milestone tracking makes sure workers are paid on time.' },
              { icon: FileText, title: 'Low Fees', desc: 'Low platform commissions mean you take home more of your income.' },
            ].map((item) => (
              <div 
                key={item.title}
                className="p-5 rounded-2xl bg-[hsl(var(--surface))] border border-border/60 space-y-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <item.icon className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-foreground text-xs tracking-wider uppercase">{item.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
