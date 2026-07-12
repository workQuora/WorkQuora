import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft, MapPin, Star, BadgeCheck, Briefcase, Clock, Mail, Phone, Calendar,
  Loader2, CheckCircle2, MessageSquare, ExternalLink, User2,
} from 'lucide-react';
import api from '../services/api';

const FreelancerPublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: () => api.get(`/profile/user/${userId}`).then((r) => r.data?.data ?? r.data),
    enabled: !!userId,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (isError || !profile) return (
    <div className="min-h-screen bg-background text-foreground p-10 text-center">
      <User2 className="w-16 h-16 mx-auto text-muted-foreground opacity-20 mb-4" />
      <p className="text-muted-foreground text-lg mb-4">User not found.</p>
      <button onClick={() => navigate(-1)} className="text-primary hover:underline cursor-pointer">← Go Back</button>
    </div>
  );

  const skills = Array.isArray(profile.skills)
    ? profile.skills
    : (profile.skills || '').split(',').map((s) => s.trim()).filter(Boolean);

  const stats = profile.stats || {};

  // All 5 KYC steps complete — the only verification signal shown (blue tick
  // next to the name). No partial-verification display.
  const isFullyVerified = !!profile.isFullyVerified;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors cursor-pointer mb-6">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {/* Profile Header Card */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          {/* Cover Gradient */}
          <div className="h-36 bg-gradient-to-r from-primary via-purple-500 to-pink-500 relative">
            {/* Active status — top right */}
            <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md ${
              profile.isActive
                ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30'
                : 'bg-white/10 text-white/80 border border-white/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${profile.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/50'}`} />
              {profile.isActive ? 'Active Now' : 'Offline'}
            </div>
          </div>

          {/* Profile Info */}
          <div className="px-8 pb-8 -mt-14">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                {profile.profilePic ? (
                  <img src={profile.profilePic} alt={profile.name}
                    className="w-28 h-28 rounded-2xl border-4 border-card object-cover shadow-xl" />
                ) : (
                  <div className="w-28 h-28 rounded-2xl border-4 border-card bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl">
                    {profile.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {/* Name + Info */}
              <div className="flex-1 pt-4 md:pt-6">
                {/* Name + blue tick if fully KYC-verified (all 5 steps) */}
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                    {profile.name}
                  </h1>
                  {isFullyVerified && (
                    <BadgeCheck title="Fully verified" className="w-5 h-5 text-blue-500 fill-blue-500/15 shrink-0" />
                  )}
                </div>

                <p className="text-muted-foreground font-medium text-lg">{profile.title || profile.role || 'Freelancer'}</p>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                  {profile.averageRating > 0 && (
                    <Link to={`/reviews/${profile.id || profile._id}`} className="flex items-center gap-1 text-amber-500 font-semibold hover:underline">
                      <Star className="w-4 h-4 fill-current" />
                      {profile.averageRating.toFixed(1)} / 5
                      <span className="text-muted-foreground font-normal">· See all reviews</span>
                    </Link>
                  )}
                  {profile.hourlyRate > 0 && (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{profile.hourlyRate.toLocaleString('en-IN')}/hr
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {skills.map((s) => (
                      <span key={s} className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-1 rounded-lg font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {/* Left Column (2/3) */}
          <div className="md:col-span-2 space-y-6">
            {/* About */}
            {profile.bio && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-base font-bold text-foreground mb-3 pb-3 border-b border-border">About</h2>
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-sm">{profile.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-base font-bold text-foreground mb-4 pb-3 border-b border-border">
                {profile.role === 'CLIENT' ? 'Platform Activity' : 'Work Stats'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {profile.role === 'CLIENT' ? (
                  [
                    { label: 'Posted Jobs', value: stats.postedJobs ?? '0', icon: Briefcase, color: 'blue' },
                    { label: 'Active Jobs', value: stats.activeJobs ?? '0', icon: Clock, color: 'amber' },
                    { label: 'Completed Jobs', value: stats.completedJobs ?? '0', icon: CheckCircle2, color: 'emerald' },
                  ].map(({ label, value, icon: Icon, color }) => {
                    const textColors = {
                      emerald: 'text-emerald-500',
                      blue: 'text-blue-500',
                      amber: 'text-amber-500',
                    };
                    return (
                      <div key={label} className="bg-background rounded-xl p-4 border border-border/60 text-center">
                        <Icon className={`w-5 h-5 ${textColors[color] || 'text-muted-foreground'} mx-auto mb-2`} />
                        <p className="text-xl font-extrabold text-foreground">{value}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-1">{label}</p>
                      </div>
                    );
                  })
                ) : (
                  [
                    { label: 'Completed', value: stats.completedProjects ?? profile.earnings?.completedJobs ?? '0', icon: CheckCircle2, color: 'emerald' },
                    { label: 'Active Projects', value: stats.activeProjects ?? '0', icon: Briefcase, color: 'blue' },
                    { label: 'Total Proposals', value: stats.totalProposals ?? '0', icon: Clock, color: 'amber' },
                    { label: 'Total Earned', value: profile.earnings?.allTimeIncome ? `₹${profile.earnings.allTimeIncome.toLocaleString('en-IN')}` : '₹0', icon: Star, color: 'indigo' },
                  ].map(({ label, value, icon: Icon, color }) => {
                    const textColors = {
                      emerald: 'text-emerald-500',
                      blue: 'text-blue-500',
                      amber: 'text-amber-500',
                      indigo: 'text-primary',
                    };
                    return (
                      <div key={label} className="bg-background rounded-xl p-4 border border-border/60 text-center">
                        <Icon className={`w-5 h-5 ${textColors[color] || 'text-muted-foreground'} mx-auto mb-2`} />
                        <p className="text-xl font-extrabold text-foreground">{value}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-1">{label}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-base font-bold text-foreground mb-4 pb-3 border-b border-border">Contact</h2>
              <div className="space-y-3">
                {profile.email && (
                  <a href={`mailto:${profile.email}`}
                    className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors group">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <span className="truncate">{profile.email}</span>
                  </a>
                )}
                {profile.phone && (
                  <a href={`tel:${profile.phone}`}
                    className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors group">
                    <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                      <Phone className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span>{profile.phone}</span>
                  </a>
                )}
                <button
                  onClick={() => navigate('/shared/messages')}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-primary-foreground py-3 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-md mt-2">
                  <MessageSquare className="w-4 h-4" /> Send Message
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerPublicProfile;
