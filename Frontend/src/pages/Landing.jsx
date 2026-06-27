import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Target, Zap, ShieldCheck, ArrowRight, Briefcase, Loader2, ArrowUpRight, Users, TrendingUp, X, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import AdBanner from '../components/shared/AdBanner';

const Landing = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('jobs'); // 'jobs' or 'talent'

  // Fetch real jobs for the platform stats + featured jobs
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['landing-jobs'],
    queryFn: () => api.get('/jobs', { params: { limit: 6, status: 'open' } }).then((r) => r.data?.data ?? r.data ?? {}),
    staleTime: 60_000,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['landing-stats'],
    queryFn: () => api.get('/jobs/stats').then((r) => r.data?.data ?? r.data ?? {}),
    staleTime: 30_000,
  });

  const featuredJobs = Array.isArray(jobsData) ? jobsData.slice(0, 6) : (jobsData?.jobs ?? []).slice(0, 6);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/discover${searchQuery.trim() ? `?keyword=${encodeURIComponent(searchQuery.trim())}` : ''}`);
  };

  const CATEGORIES = [
    { label: 'Design', emoji: '🎨' },
    { label: 'Development', emoji: '💻' },
    { label: 'Writing', emoji: '✍️' },
    { label: 'Marketing', emoji: '📣' },
    { label: 'Plumbing', emoji: '🔧' },
    { label: 'Electrical', emoji: '⚡' },
  ];

  return (
    <div className="bg-background text-foreground transition-colors duration-300 w-full min-h-screen">

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-16 text-center">
        <div className="max-w-2xl mx-auto mb-8">
          <AdBanner platform="WEB" className="shadow-lg shadow-black/10" />
        </div>
        <div className="inline-block bg-primary/10 border border-primary/20 text-primary font-semibold px-4 py-1.5 rounded-full mb-6 text-sm animate-pulse">
          🚀 India's #1 Geo-Based Freelance Platform
        </div>
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Find talent & work<br className="hidden md:block" />
          <span className="text-primary"> near you, instantly.</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Connect with verified freelancers and high-quality jobs within your custom radius. India's smartest local marketplace.
        </p>

        {/* Premium Unified Borderless Search Console */}
        <div className="relative max-w-2xl mx-auto mb-8 mt-8 group">
          {/* Subtle neon background glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full opacity-10 blur-lg group-hover:opacity-15 transition-opacity duration-300 pointer-events-none" />
          
          <form onSubmit={handleSearch} className="relative flex items-center bg-slate-100 dark:bg-[#0c0c14] p-1.5 pl-4 rounded-full shadow-lg transition-all focus-within:shadow-xl">
            <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs, skills, or freelancers..."
              className="bg-transparent text-slate-800 dark:text-foreground w-full focus:outline-none placeholder:text-slate-400 dark:placeholder:text-muted-foreground/60 text-sm font-semibold py-3"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1.5 mr-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/5 text-slate-400 dark:text-muted-foreground hover:text-slate-600 dark:hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-98 shadow-md"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Quick category pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => navigate(`/discover?category=${cat.label.toLowerCase()}`)}
              className="px-4 py-2 bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-xs font-semibold text-slate-600 dark:text-muted-foreground hover:text-indigo-600 dark:hover:text-white rounded-full transition-all cursor-pointer"
            >
              <span className="mr-1.5">{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-10 border-t border-border">
          <div>
            <h3 className="text-4xl font-extrabold text-foreground">
              {statsLoading ? <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /> : `${statsData?.activeJobs ?? 0}`}
            </h3>
            <p className="text-muted-foreground mt-1">Live Jobs</p>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-foreground">
              {statsLoading ? <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /> : `${statsData?.freelancers ?? 0}`}
            </h3>
            <p className="text-muted-foreground mt-1">Freelancers</p>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-foreground">
              {statsLoading ? <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /> : `${statsData?.clients ?? 0}`}
            </h3>
            <p className="text-muted-foreground mt-1">Active Clients</p>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-foreground">
              {statsLoading ? <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /> : `₹${(statsData?.totalPaidOut ?? 0).toLocaleString('en-IN')}`}
            </h3>
            <p className="text-muted-foreground mt-1">Total Paid Out</p>
          </div>
        </div>
      </main>

      {/* Featured Jobs Section */}
      <section className="border-t border-border py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Latest Open Jobs</h2>
              <p className="text-muted-foreground mt-1">Real opportunities, right now</p>
            </div>
            <button
              onClick={() => navigate('/discover')}
              className="flex items-center gap-1.5 text-primary font-bold text-sm hover:underline"
            >
              View All <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {jobsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
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
              <button
                onClick={() => navigate('/auth')}
                className="mt-4 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all"
              >
                Post a Job
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.map((job) => (
                <div
                  key={job._id}
                  onClick={() => navigate(`/job/${job._id}`)}
                  className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group"
                >
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
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed">
                    {job.description}
                  </p>
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
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/40 border-t border-border py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">Why WorkQuora?</h2>
            <p className="text-muted-foreground text-lg">Built for speed, trust, and local connections.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { Icon: Target, color: 'blue', title: 'Location-Based Matching', desc: 'Find work within your custom radius — 5 km to 200 km away.' },
              { Icon: Zap, color: 'amber', title: 'Instant Connections', desc: 'Connect with nearby clients in real-time and start working fast.' },
              { Icon: ShieldCheck, color: 'emerald', title: 'Verified & Trusted', desc: 'KYC-verified users, secure escrow payments, and 24/7 support.' },
            ].map(({ Icon, color, title, desc }) => (
              <div key={title} className="bg-card border border-border p-8 rounded-2xl text-left shadow-sm hover:border-primary/30 transition-colors">
                <div className={`bg-${color}-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 border border-${color}-500/20`}>
                  <Icon className={`w-7 h-7 text-${color}-500`} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="border-t border-border py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 rounded-3xl p-12">
            <h2 className="text-3xl font-extrabold text-foreground mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-8 text-lg">Join thousands of professionals on India's fastest-growing freelance platform.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/auth')}
                className="bg-primary text-primary-foreground font-bold px-8 py-3.5 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <Users className="w-5 h-5" /> Join as Freelancer
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="border border-border bg-card text-foreground font-bold px-8 py-3.5 rounded-2xl hover:border-primary/50 transition-all flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-5 h-5" /> Post a Job
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Landing;