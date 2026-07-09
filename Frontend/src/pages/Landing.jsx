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
  const { isAuthenticated, role } = useSelector((s) => s.auth);
  const [searchQuery, setSearchQuery] = useState('');

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

  // ── Normal Landing Page Queries (for public view) ──
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['landing-jobs'],
    queryFn: () => api.get('/jobs', { params: { limit: 6, status: 'open' } }).then((r) => r.data?.data ?? r.data ?? {}),
    enabled: !isAuthenticated,
    staleTime: 60_000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['landing-stats'],
    queryFn: () => api.get('/jobs/stats').then((r) => r.data?.data ?? r.data ?? {}),
    enabled: !isAuthenticated,
    staleTime: 30_000,
  });

  const featuredJobs = Array.isArray(jobsData) ? jobsData.slice(0, 6) : (jobsData?.jobs ?? []).slice(0, 6);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/discover${searchQuery.trim() ? `?keyword=${encodeURIComponent(searchQuery.trim())}` : ''}`);
  };

  // ── Render Logged-In Ads Feed ──
  if (isAuthenticated) {
    return (
      <div className="bg-[hsl(var(--background))] text-foreground w-full min-h-screen py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border pb-6 mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-primary" /> Promoted Campaigns
              </h1>
              <p className="text-muted-foreground text-xs mt-1 font-medium">
                Sponsored offers, campaigns, and updates verified by WorkQuora
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => navigate(role === 'CLIENT' ? '/client/dashboard' : '/freelancer/dashboard')}
                className="px-4 py-2 bg-[hsl(var(--surface))] border border-border hover:border-primary/50 text-xs font-bold text-muted-foreground hover:text-primary rounded-xl transition-all cursor-pointer"
              >
                Go to Dashboard
              </button>
              <button 
                onClick={() => navigate('/discover')}
                className="px-4 py-2 bg-primary hover:opacity-90 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Browse Jobs
              </button>
            </div>
          </div>

          {/* Loading State */}
          {adsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[hsl(var(--surface))] border border-border rounded-2xl p-6 animate-pulse h-80" />
              ))}
            </div>
          ) : visibleAds.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20 bg-[hsl(var(--surface-2))] border border-border/60 rounded-3xl p-8 max-w-2xl mx-auto shadow-sm">
              <Sparkles className="w-12 h-12 mx-auto text-primary opacity-40 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">You're All Caught Up!</h3>
              <p className="text-muted-foreground text-xs leading-relaxed max-w-md mx-auto mb-6">
                There are no active sponsored campaigns for you right now. Advertisements adhere to daily frequency caps.
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={() => navigate('/discover')} className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer">
                  Explore Jobs & Talents
                </button>
              </div>
            </div>
          ) : (
            /* Ads Grid */
            <motion.div 
              initial="hidden" 
              animate="visible" 
              variants={staggerContainer} 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {visibleAds.map((ad, i) => (
                <motion.div
                  key={ad._id}
                  variants={fadeInUp}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="bg-[hsl(var(--surface))] border border-border/80 hover:border-primary/30 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
                >
                  {/* Media Display */}
                  <div className="relative aspect-video w-full bg-black/20 overflow-hidden border-b border-border/40">
                    {ad.mediaType === 'VIDEO' ? (
                      <video
                        src={ad.mediaUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={ad.mediaUrl}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        loading="lazy"
                      />
                    )}
                    <span className="absolute top-3 right-3 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-black/60 text-white/90 backdrop-blur-sm tracking-wide">
                      Sponsored
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                          {ad.brandName}
                        </span>
                        <span className="text-[9px] text-muted-foreground/80 font-medium">
                          Duration: {ad.durationSeconds || 5}s
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-1">
                        {ad.title}
                      </h3>
                      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
                        {ad.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                      <button
                        onClick={() => handleAdClick(ad)}
                        className="w-full py-2.5 px-4 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Visit Brand <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
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
              <button
                key={cat.label}
                onClick={() => navigate(`/discover?category=${cat.label.toLowerCase()}`)}
                className="px-4 py-2 bg-[hsl(var(--surface))] border border-border hover:border-primary/50 hover:bg-primary/5 text-xs font-semibold text-muted-foreground hover:text-primary rounded-full transition-all"
              >
                <span className="mr-1.5">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
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
      <section className="py-24 bg-[hsl(var(--background))]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer} className="text-center mb-16">
            <motion.p variants={fadeInUp} className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
              How It Works
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-foreground">
              Simple. Fast. Secure.
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#0EA5E9]/10 text-[#0EA5E9] flex items-center justify-center text-sm font-bold">C</span>
                For Clients
              </h3>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="space-y-4">
                {[
                  { step: '01', title: 'Post a Job', desc: 'Describe your project and set a budget' },
                  { step: '02', title: 'Review Proposals', desc: 'Get bids from verified freelancers' },
                  { step: '03', title: 'Hire & Pay Securely', desc: 'Escrow protects your payment' },
                ].map((item) => (
                  <AnimatedCard key={item.step} className="p-5 flex gap-4">
                    <span className="text-2xl font-bold text-primary/20">{item.step}</span>
                    <div>
                      <h4 className="font-semibold text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </AnimatedCard>
                ))}
              </motion.div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-sm font-bold">F</span>
                For Freelancers
              </h3>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="space-y-4">
                {[
                  { step: '01', title: 'Browse Jobs', desc: 'Find work matching your skills' },
                  { step: '02', title: 'Submit Proposal', desc: 'Pitch your rate and timeline' },
                  { step: '03', title: 'Work & Get Paid', desc: 'Deliver and receive payment instantly' },
                ].map((item) => (
                  <AnimatedCard key={item.step} className="p-5 flex gap-4">
                    <span className="text-2xl font-bold text-[#10B981]/30">{item.step}</span>
                    <div>
                      <h4 className="font-semibold text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </AnimatedCard>
                ))}
              </motion.div>
            </div>
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
