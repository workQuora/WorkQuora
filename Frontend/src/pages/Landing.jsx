import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, Shield, Zap, Users, Briefcase, ArrowRight, ArrowUpRight, 
  ChevronDown, X, Megaphone, ExternalLink, Sparkles 
} from 'lucide-react';
import api from '../services/api';
import AdBanner from '../components/shared/AdBanner';
import { GradientBlob } from '../components/ui/GradientBlob';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { StatCounter } from '../components/ui/StatCounter';
import { fadeInUp, staggerContainer } from '../utils/animations';

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
  const { isAuthenticated, role, user } = useSelector((s) => s.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' | 'freelancers'

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
    staleTime: 60_000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['landing-stats'],
    queryFn: () => api.get('/jobs/stats').then((r) => r.data?.data ?? r.data ?? {}),
    staleTime: 30_000,
  });

  const featuredJobs = Array.isArray(jobsData) ? jobsData.slice(0, 6) : (jobsData?.data ?? jobsData?.jobs ?? []).slice(0, 6);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/discover${searchQuery.trim() ? `?keyword=${encodeURIComponent(searchQuery.trim())}` : ''}`);
  };

  // ── Render Logged-In Freelancer Home View ──
  // ── Render Logged-In Freelancer Home View ──
  if (isAuthenticated) {
    // Fetch freelancer stats for the right column
    const { data: dashData } = useQuery({
      queryKey: ['freelancer-dashboard-home'],
      queryFn: () => api.get('/dashboard/freelancer').then((r) => r.data?.data ?? r.data),
      enabled: role === 'FREELANCER',
      staleTime: 60_000,
    });

    const activeMilestones = dashData?.stats?.pendingTasks ?? 4;

    // Directly use real DB jobs — no fallbacks. Empty DB = empty UI.
    const jobList = featuredJobs || [];
    const firstJob = jobList[0] || null;
    const secondJob = jobList[1] || null;
    const premiumJob = jobList[2] || null;

    // Only show real ads from DB — no hardcoded fallback ad
    const featuredAd = visibleAds && visibleAds.length > 0 ? visibleAds[0] : null;

    return (
      <div className="bg-slate-50/50 dark:bg-[#07070c] text-slate-800 dark:text-foreground w-full min-h-screen py-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* 1. Welcome Hero Section */}
          <section className="text-center py-16 mb-10 bg-white dark:bg-[#0d0d15] rounded-3xl border border-slate-200/60 dark:border-white/5 shadow-sm p-8 relative overflow-hidden transition-all duration-300">
            <GradientBlob className="opacity-15 dark:opacity-20" />
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="max-w-xl mx-auto relative z-10"
            >
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-5 tracking-tight flex items-center justify-center gap-2">
                Welcome Back, {user?.name?.split(' ')[0] || 'Partner'}! 👋
              </h1>
              
              {/* Search input to match UI design exactly */}
              <form onSubmit={handleSearch} className="relative flex items-center bg-[#f0f2f8] dark:bg-[#151522] border border-transparent dark:border-white/5 rounded-2xl px-4 py-2 mb-6">
                <Search className="w-5 h-5 text-slate-400 dark:text-muted-foreground mr-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for open contracts, gigs..."
                  className="bg-transparent text-slate-850 dark:text-foreground w-full focus:outline-none placeholder:text-slate-400 dark:placeholder:text-muted-foreground/60 text-xs font-semibold py-1.5"
                />
                <button type="submit" className="text-xs text-primary dark:text-primary font-bold hover:underline px-2 mr-2 shrink-0 cursor-pointer">
                  Search Gigs
                </button>
              </form>

              {/* Categories badge grid */}
              <div className="flex flex-wrap justify-center gap-2.5">
                {CATEGORIES.slice(0, 4).map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => navigate(`/discover?category=${cat.label.toLowerCase()}`)}
                    className="px-5 py-1.5 bg-[#eef0fc] dark:bg-primary/10 border-none text-xs font-bold text-primary dark:text-primary-foreground rounded-full hover:bg-indigo-100/50 dark:hover:bg-primary/10 transition-all cursor-pointer"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </section>

          {/* 2. Grid Layout: Left Column (Recommended Jobs) & Right Column (Widgets) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Recommended Jobs (2/3 width) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Recommended Jobs Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Recommended Jobs for You
                </h2>
                <button 
                  onClick={() => navigate('/discover')}
                  className="text-xs font-bold text-primary dark:text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View All &rarr;
                </button>
              </div>

              {/* Two Column cards — 100% real DB data */}
              {jobsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[0, 1].map((i) => (
                    <div key={i} className="bg-white dark:bg-[#0f0f18] border border-slate-200/80 dark:border-white/5 rounded-3xl p-6 animate-pulse h-52">
                      <div className="h-5 bg-slate-200 dark:bg-white/10 rounded w-1/3 mb-4" />
                      <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4 mb-3" />
                      <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-full mb-2" />
                      <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : jobList.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-[#0f0f18] border border-slate-200/80 dark:border-white/5 rounded-3xl">
                  <Briefcase className="w-12 h-12 text-slate-300 dark:text-white/20 mb-4" />
                  <p className="text-sm font-semibold text-slate-500 dark:text-muted-foreground mb-1">No jobs in database right now</p>
                  <p className="text-xs text-slate-400 dark:text-muted-foreground/60 mb-5">New jobs will appear here as soon as clients post them.</p>
                  <button onClick={() => navigate('/discover')} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold border-none cursor-pointer transition-all">
                    Browse All Jobs
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1 */}
                  {firstJob && (
                    <div className="bg-white dark:bg-[#0f0f18] border border-slate-200/80 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 h-full relative group">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-extrabold text-[#1E00A9] dark:text-[#10B981]">
                            ₹{firstJob.budgetRange?.min?.toLocaleString('en-IN') || firstJob.budget?.toLocaleString('en-IN') || '—'}
                          </span>
                          <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase">
                            {firstJob.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-1">
                          {firstJob.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                          {firstJob.description}
                        </p>
                        {firstJob.skillsRequired?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {firstJob.skillsRequired.slice(0, 2).map((skill) => (
                              <span key={skill} className="px-2.5 py-0.5 bg-slate-100 dark:bg-white/5 rounded-md text-[10px] font-semibold text-slate-500 dark:text-muted-foreground">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/job/${firstJob._id}`)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/10 border-none"
                      >
                        Apply Now
                      </button>
                    </div>
                  )}

                  {/* Card 2 */}
                  {secondJob && (
                    <div className="bg-white dark:bg-[#0f0f18] border border-slate-200/80 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 h-full relative group">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-extrabold text-[#1E00A9] dark:text-[#10B981]">
                            ₹{secondJob.budgetRange?.min?.toLocaleString('en-IN') || secondJob.budget?.toLocaleString('en-IN') || '—'}
                          </span>
                          <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase">
                            {secondJob.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-1">
                          {secondJob.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                          {secondJob.description}
                        </p>
                        {secondJob.skillsRequired?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {secondJob.skillsRequired.slice(0, 2).map((skill) => (
                              <span key={skill} className="px-2.5 py-0.5 bg-slate-100 dark:bg-white/5 rounded-md text-[10px] font-semibold text-slate-500 dark:text-muted-foreground">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/job/${secondJob._id}`)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/10 border-none"
                      >
                        Apply Now
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Premium Listing block card — only shown if there's a 3rd DB job */}
              {premiumJob && (
                <div className="bg-white dark:bg-[#0f0f18] border border-slate-200/80 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-300 hover:border-amber-500/20 group">
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
                  <button
                    onClick={() => navigate(`/job/${premiumJob._id}`)}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md shadow-indigo-600/10 border-none"
                  >
                    View Detailed Brief
                  </button>
                </div>
              )}

            </div>

            {/* Right Column: Widgets (1/3 width) */}
            <div className="flex flex-col gap-6">
              
              {/* Promoted Campaigns Widget — only shown if real ads exist in DB */}
              <div className="bg-white dark:bg-[#0f0f18] border border-slate-200/80 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone className="w-4 h-4 text-primary shrink-0" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Promoted Campaigns
                  </h3>
                </div>

                {adsLoading ? (
                  <div className="aspect-video bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse mb-4" />
                ) : featuredAd ? (
                  <div>
                    <div className="bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-2xl overflow-hidden mb-4 relative aspect-video flex flex-col justify-end p-4">
                      {featuredAd.mediaUrl && (
                        <img
                          src={featuredAd.mediaUrl}
                          alt={featuredAd.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
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
                    <p className="text-xs text-muted-foreground leading-relaxed mb-6">{featuredAd.description}</p>
                    <button
                      onClick={() => handleAdClick(featuredAd)}
                      className="w-full py-2.5 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-foreground rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Learn More
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Megaphone className="w-8 h-8 text-slate-300 dark:text-white/20 mb-3" />
                    <p className="text-xs text-muted-foreground">No active campaigns right now.</p>
                  </div>
                )}
              </div>

              {/* Manage Tasks Widget */}
              <div className="bg-white dark:bg-[#0f0f18] border border-slate-200/80 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all duration-300">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    Manage Tasks
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                    You have {activeMilestones} active milestone{activeMilestones !== 1 ? 's' : ''} due this week. Keep your rating high by staying on track.
                  </p>
                </div>

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
              </div>

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
          className="relative z-10 w-full max-w-6xl mx-auto px-6 py-32 text-center"
        >
          <motion.div variants={fadeInUp} className="max-w-2xl mx-auto mb-8">
            <AdBanner platform="WEB" className="shadow-lg shadow-black/10" />
          </motion.div>

          <motion.div variants={fadeInUp} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              India's Premier Freelance Marketplace
            </span>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
            Find Work.{' '}
            <span className="bg-gradient-to-r from-[#1E00A9] via-[#6366F1] to-[#10B981] bg-clip-text text-transparent">
              Get Hired.
            </span>{' '}
            Build Together.
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
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
              <button type="submit" className="bg-primary hover:opacity-90 text-white font-bold py-3 px-6 rounded-full transition-all flex items-center gap-1.5 shrink-0 active:scale-95 shadow-md">
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-2 mb-14">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.label}
                whileHover={{ scale: 1.05, y: -2, boxShadow: '0 8px 20px rgba(99,102,241,0.15)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/discover?category=${cat.label.toLowerCase()}`)}
                className="px-4 py-2 bg-[hsl(var(--surface))] border border-border hover:border-primary/50 hover:bg-primary/5 text-xs font-semibold text-muted-foreground hover:text-primary rounded-full transition-all cursor-pointer"
              >
                <span className="mr-1.5">{cat.emoji}</span>
                <span>{cat.label}</span>
              </motion.button>
            ))}
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center mb-16">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(30,0,169,0.25)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/auth')}
              className="px-8 py-4 bg-primary text-white rounded-xl font-semibold text-lg shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              Start as Freelancer <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/auth')}
              className="px-8 py-4 bg-[hsl(var(--surface))] text-primary rounded-xl font-semibold text-lg border-2 border-primary/20 hover:border-primary/50 transition-colors flex items-center gap-2"
            >
              Hire a Freelancer
            </motion.button>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground">
                <StatCounter target={statsData?.activeJobs ?? 0} duration={1500} />
              </span>
              <span className="text-sm mt-1">Live Jobs</span>
            </div>
            <div className="w-px h-8 bg-border hidden sm:block" />
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground">
                <StatCounter target={statsData?.freelancers ?? 0} duration={1500} />
              </span>
              <span className="text-sm mt-1">Freelancers</span>
            </div>
            <div className="w-px h-8 bg-border hidden sm:block" />
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground">
                <StatCounter target={statsData?.clients ?? 0} duration={1500} />
              </span>
              <span className="text-sm mt-1">Active Clients</span>
            </div>
            <div className="w-px h-8 bg-border hidden sm:block" />
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground">
                <StatCounter target={statsData?.totalPaidOut ?? 0} prefix="₹" duration={1500} />
              </span>
              <span className="text-sm mt-1">Total Paid Out</span>
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

      {/* Featured Jobs */}
      <section className="py-24 bg-[hsl(var(--surface-2))]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Latest Open Jobs</h2>
              <p className="text-muted-foreground mt-1">Real opportunities, right now</p>
            </div>
            <button onClick={() => navigate('/discover')} className="flex items-center gap-1.5 text-primary font-bold text-sm hover:underline shrink-0">
              View All <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {jobsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[hsl(var(--surface))] border border-border rounded-2xl p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-4" />
                  <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : featuredJobs.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-4" />
              <p className="text-muted-foreground">No jobs posted yet. Be the first to post one!</p>
              <button onClick={() => navigate('/auth')} className="mt-4 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all">
                Post a Job
              </button>
            </div>
          ) : (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.map((job, i) => (
                <AnimatedCard key={job._id} delay={i * 0.05} className="p-6 cursor-pointer group" hover>
                  <div onClick={() => navigate(`/job/${job._id}`)}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wide">
                        {job.category || 'General'}
                      </span>
                      <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase">
                        Open
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {job.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed">{job.description}</p>
                    {job.skillsRequired?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {job.skillsRequired.slice(0, 3).map((s) => (
                          <span key={s} className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-md">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/60">
                      <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₹{job.budgetRange?.min?.toLocaleString('en-IN') ?? '—'}
                        {job.budgetRange?.max ? ` – ${job.budgetRange.max.toLocaleString('en-IN')}` : ''}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-[hsl(var(--background))] border-t border-border/40">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer} className="text-center mb-12">
            <motion.p variants={fadeInUp} className="text-primary font-semibold text-xs uppercase tracking-wider mb-2">
              Step-by-Step Guide
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-3xl font-extrabold text-foreground">
              How WorkQuora Works
            </motion.h2>
          </motion.div>

          {/* Toggle Switch */}
          <div className="flex justify-center mb-12">
            <div className="bg-[hsl(var(--surface-2))] border border-border p-1 rounded-full flex gap-1 relative shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('clients')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all relative z-10 cursor-pointer ${
                  activeTab === 'clients' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {activeTab === 'clients' && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-primary rounded-full -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                I Want to Hire
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('freelancers')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all relative z-10 cursor-pointer ${
                  activeTab === 'freelancers' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {activeTab === 'freelancers' && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-primary rounded-full -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                I Want to Work
              </button>
            </div>
          </div>

          {/* Steps Display */}
          <div className="min-h-[300px]">
            {activeTab === 'clients' ? (
              <motion.div
                key="clients"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {[
                  { step: '01', title: 'Post a Job Requirement', desc: 'Describe the scope, required skills, and set a budget range.' },
                  { step: '02', title: 'Receive & Review Proposals', desc: 'Sift through bids from identity-verified local professionals.' },
                  { step: '03', title: 'Fund Escrow & Work Starts', desc: 'Your money stays safe in Escrow. Release it only when job is completed.' },
                ].map((item) => (
                  <div key={item.step} className="p-6 bg-[hsl(var(--surface))] border border-border/80 rounded-2xl flex gap-5 hover:border-primary/30 transition-colors shadow-sm">
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent opacity-80">{item.step}</span>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="freelancers"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {[
                  { step: '01', title: 'Browse Active Gigs', desc: 'Search for jobs matching your skills, category, and radius.' },
                  { step: '02', title: 'Send Premium Proposals', desc: 'Submit your timeline, bid, and verify your KYC profile to stand out.' },
                  { step: '03', title: 'Deliver Work & Get Paid', desc: 'Get instant wallet payouts once milestones are completed by the client.' },
                ].map((item) => (
                  <div key={item.step} className="p-6 bg-[hsl(var(--surface))] border border-border/80 rounded-2xl flex gap-5 hover:border-emerald-500/30 transition-colors shadow-sm">
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-[#10B981] to-emerald-500 bg-clip-text text-transparent opacity-80">{item.step}</span>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="py-24 bg-[hsl(var(--surface-2))]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'KYC Verified', desc: 'All freelancers are identity-verified with Aadhaar and PAN', color: '#1E00A9' },
              { icon: Zap, title: 'Instant Payments', desc: 'Razorpay-powered escrow with instant wallet transfers', color: '#10B981' },
              { icon: Users, title: 'Real-time Chat', desc: 'Socket.io powered messaging with file sharing', color: '#6366F1' },
            ].map((feature) => (
              <AnimatedCard key={feature.title} className="p-6">
                <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center" style={{ background: `${feature.color}15` }}>
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </AnimatedCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E00A9] to-[#6366F1]" />
        <GradientBlob className="opacity-30" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to get started?
            </h2>
            <p className="text-white/80 text-lg mb-10">
              Join thousands of clients and freelancers already on WorkQuora
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/auth')}
                className="px-8 py-4 bg-white text-primary rounded-xl font-semibold text-lg hover:bg-white/90 transition-colors"
              >
                Post a Job
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/discover')}
                className="px-8 py-4 bg-white/10 text-white rounded-xl font-semibold text-lg border border-white/20 hover:bg-white/20 transition-colors"
              >
                Browse Freelancers
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
