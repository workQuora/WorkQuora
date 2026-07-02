import React, { useState, useCallback } from 'react';
import { Search, MapPin, SlidersHorizontal, Map, List, Loader2, RefreshCw, ChevronDown, X, Calendar, IndianRupee, Star } from 'lucide-react';
import JobMap from '../components/JobMap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import api from '../services/api';
import AdBanner from '../components/shared/AdBanner';

const formatBudget = (job) => {
  const min = job?.budgetRange?.min;
  const max = job?.budgetRange?.max;
  if (min != null && max != null) return `₹${min.toLocaleString('en-IN')} – ₹${max.toLocaleString('en-IN')}`;
  if (min != null) return `₹${min.toLocaleString('en-IN')}`;
  return '—';
};

const timeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const CATEGORIES = ['All', 'Design', 'Development', 'Writing', 'Marketing', 'Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Delivery'];

const Discover = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const { role } = useSelector((s) => s.auth);
  const isClient = role === 'CLIENT';
  
  const userCoords = useSelector((s) => s.client?.details?.currentLocation) || useSelector((s) => s.auth?.user?.location);

  const [viewMode, setViewMode] = useState('list');
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [radius, setRadius] = useState(25);
  const [feedMode, setFeedMode] = useState('all'); // 'geo' or 'all'
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchParams.get('keyword') || '');
  const [showFilters, setShowFilters] = useState(false);

  const lat = userCoords?.lat ?? userCoords?.coordinates?.[1] ?? 23.2599;
  const lng = userCoords?.lng ?? userCoords?.coordinates?.[0] ?? 77.4126;

  const debouncedSet = useCallback(debounce((v) => setDebouncedKeyword(v), 500), []);

  const handleKeywordChange = (e) => {
    setKeyword(e.target.value);
    debouncedSet(e.target.value);
  };

  const geoQuery = useQuery({
    queryKey: [isClient ? 'freelancers-geo' : 'jobs-geo', lat, lng, radius, category, debouncedKeyword],
    queryFn: async () => {
      const params = {
        lat, lng, radius,
        ...(category !== 'All' && { category: category }),
        ...(debouncedKeyword.trim() && { keyword: debouncedKeyword.trim() }),
      };
      const endpoint = isClient ? '/geo/nearby-freelancers' : '/geo/nearby-jobs';
      const { data } = await api.get(endpoint, { params });
      return isClient ? (data?.freelancers ?? data?.data ?? []) : (data?.jobs ?? data ?? []);
    },
    enabled: feedMode === 'geo',
  });

  const allQuery = useQuery({
    queryKey: [isClient ? 'freelancers-all' : 'jobs-all', debouncedKeyword, category],
    queryFn: async () => {
      const params = {
        status: 'open',
        limit: 40,
        ...(debouncedKeyword.trim() && { keyword: debouncedKeyword.trim() }),
        ...(category !== 'All' && { category: category }),
      };
      if (isClient) {
        const { data } = await api.get('/jobs/search', { params });
        return data?.freelancers ?? [];
      } else {
        const endpoint = (debouncedKeyword.trim() || category !== 'All') ? '/jobs/search' : '/jobs';
        const { data } = await api.get(endpoint, { params });
        return Array.isArray(data) ? data : (data?.jobs ?? data?.data ?? []);
      }
    },
    enabled: feedMode === 'all',
  });

  const activeQuery = feedMode === 'all' ? allQuery : geoQuery;
  const items = activeQuery.data ?? [];
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;

  const mapItems = items.map((item) => {
    if (isClient) {
      return {
        id: item._id || item.id,
        title: item.name,
        username: item.username,
        category: item.title || 'Freelancer',
        distance: item.distance ? `${item.distance.toFixed(1)} km` : (item.location?.address || item.location?.city || 'Local'),
        budget: `₹${item.hourlyRate || 0}/hr`,
        posted: 'Active',
        status: item.isAvailable ? 'available' : 'busy',
        desc: item.bio || 'No bio provided.',
        skills: item.skills || [],
        location: item.location?.coordinates ? { coordinates: item.location.coordinates } : undefined,
        address: item.location?.address || item.location?.city || 'Local',
        profilePic: item.profilePic || item.avatar,
        rating: item.averageRating || 0,
        isVerified: !!(item.isKycVerified || item.kycVerified),
      };
    } else {
      return {
        id: item._id || item.id,
        title: item.title,
        category: item.category,
        distance: item.distance ? `${item.distance.toFixed(1)} km` : (item.location?.address || 'Remote'),
        budget: formatBudget(item),
        posted: timeAgo(item.createdAt),
        postedFull: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
        status: item.status,
        desc: item.description,
        skills: item.skillsRequired || [],
        location: item.location?.coordinates ? { coordinates: item.location.coordinates } : undefined,
        address: item.location?.address,
        budgetRange: item.budgetRange,
        clientInfo: item.clientInfo,
      };
    }
  });

  // Active filter count for the badge
  const activeFilterCount = (category !== 'All' ? 1 : 0) + (feedMode === 'geo' ? 1 : 0);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background text-foreground flex flex-col transition-colors duration-300">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3">
          {/* Row 1: Search + toggles */}
          <div className="flex gap-3 items-center">
            {/* Search input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={keyword} onChange={handleKeywordChange}
                placeholder={isClient ? "Search freelancers, skills, keywords…" : "Search jobs, skills, keywords…"}
                className="w-full bg-background border border-border text-foreground rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary text-sm transition-colors" />
              {keyword && (
                <button onClick={() => { setKeyword(''); debouncedSet(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:border-primary/50'
              }`}>
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* View Toggle */}
            <div className="flex gap-0.5 bg-background p-1 rounded-xl border border-border shrink-0">
              {[{ mode: 'list', Icon: List }, { mode: 'map', Icon: Map }].map(({ mode, Icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Filter Dropdown (collapsible) */}
          {showFilters && (
            <div className="bg-background border border-border rounded-2xl p-5 space-y-5 animate-in slide-in-from-top-2">
              {/* Feed Mode Toggle */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">Feed Mode</p>
                <div className="flex gap-2">
                  {[{ key: 'all', label: isClient ? '🌐 All Freelancers' : '🌐 All Jobs' }, { key: 'geo', label: '📍 Nearby' }].map(({ key, label }) => (
                    <button key={key} onClick={() => setFeedMode(key)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                        feedMode === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:border-primary/50'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button key={cat} onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                        category === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Radius Slider (only in geo mode) */}
              {feedMode === 'geo' && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">
                    Search Radius: <span className="text-primary">{radius} km</span>
                  </p>
                  <input type="range" min="5" max="200" step="5" value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-primary max-w-sm" />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1 max-w-sm"><span>5 km</span><span>100 km</span><span>200 km</span></div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <button onClick={() => activeQuery.refetch()}
                  className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary py-2 px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
                <button onClick={() => { setCategory('All'); setFeedMode('all'); setRadius(25); setKeyword(''); debouncedSet(''); }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-medium">
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">
              {isClient ? 'Loading freelancers…' : 'Loading jobs…'}
            </p>
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <p className="text-destructive mb-3 font-medium">
              {isClient ? 'Could not load freelancers.' : 'Could not load jobs.'}
            </p>
            <button onClick={() => activeQuery.refetch()} className="text-primary hover:underline text-sm font-semibold cursor-pointer">Retry</button>
          </div>
        ) : viewMode === 'map' ? (
          <JobMap jobs={mapItems.filter((j) => j.location)} center={[lat, lng]} isFreelancerMap={isClient} />
        ) : (
          <div className="space-y-4">
            <AdBanner platform="WEB" className="mb-4 shadow-xl shadow-black/20" />
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-xl text-foreground">
                {isClient
                  ? (feedMode === 'geo' ? '📍 Nearby Freelancers' : debouncedKeyword ? `Results for "${debouncedKeyword}"` : '🌐 Active Freelancers')
                  : (feedMode === 'geo' ? '📍 Nearby Jobs' : debouncedKeyword ? `Results for "${debouncedKeyword}"` : '🌐 All Open Jobs')
                }
              </h2>
              <span className="text-sm text-muted-foreground font-medium">{mapItems.length} found</span>
            </div>
            {mapItems.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground text-lg font-medium mb-1">
                  {isClient ? 'No freelancers found' : 'No jobs found'}
                </p>
                <p className="text-muted-foreground text-sm">
                  {isClient ? 'Try different keywords or filters.' : 'Try different keywords or increase the search radius.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mapItems.map((item) => (
                  isClient ? (
                    // Freelancer Card
                    <div key={item.id} onClick={() => navigate(`/freelancer/${item.id}`)}
                      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group flex flex-col justify-between">

                      {/* ── Skills Marquee Strip (top of card) ── */}
                      {item.skills.length > 0 && (
                        <div className="skills-marquee bg-primary/5 border-b border-primary/10 py-1.5 overflow-hidden">
                          <div className="skills-track flex gap-2 animate-marquee">
                            {[...item.skills, ...item.skills].map((s, idx) => (
                              <span
                                key={idx}
                                className="bg-primary/10 text-primary border border-primary/20 text-[10px] px-2 py-0.5 rounded-md font-semibold whitespace-nowrap shrink-0"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-5 flex flex-col flex-1">
                        {/* Avatar & Top Info */}
                        <div className="flex items-start gap-3.5 mb-4">
                          <img
                            src={item.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.title}`}
                            alt={item.title}
                            className="w-12 h-12 rounded-xl object-cover border border-border shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.title}`;
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            {/* 1. Username + Verification tag */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs text-primary font-extrabold truncate">
                                @{item.username || 'freelancer'}
                              </span>
                              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                                item.isVerified
                                  ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-500 border-red-500/20'
                              }`}>
                                {item.isVerified ? 'Verified' : 'Not Verified'}
                              </span>
                            </div>
                            
                            {/* 2. Name */}
                            <h3 className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors mt-0.5">
                              {item.title}
                            </h3>

                            {/* 3. Category */}
                            <p className="text-xs text-muted-foreground font-semibold mt-0.5 truncate">{item.category}</p>
                          </div>
                        </div>

                        {/* 4. Rating Number & Stars (Under info) */}
                        <div className="flex items-center gap-1 mt-1 mb-3">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < Math.round(item.rating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted-foreground/30'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-foreground/80 ml-1">{Number(item.averageRating || 0).toFixed(1)}</span>
                        </div>

                        {/* 5. Bio */}
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3 leading-relaxed flex-1">
                          {item.desc}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="px-5 pb-4 pt-3 border-t border-border/60 flex items-center justify-between">
                        <div>
                          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                            {item.budget}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                            <MapPin className="w-3 h-3" /> {item.distance}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Job Card
                    <div key={item.id} onClick={() => navigate(`/job/${item.id}`)}
                      className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group flex flex-col">
                      {/* Top badges */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border border-primary/20">
                          {item.category || 'General'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.status === 'open'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-2 leading-snug">
                        {item.title}
                      </h3>

                      {/* Client Info */}
                      {item.clientInfo && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3 flex-wrap">
                          <span>by</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/freelancer/${item.clientInfo.id}`);
                            }}
                            className="font-bold text-primary hover:underline cursor-pointer"
                          >
                            {item.clientInfo.name} (@{item.clientInfo.username || 'client'})
                          </button>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                            item.clientInfo.isKycVerified
                              ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {item.clientInfo.isKycVerified ? 'Verified' : 'Not Verified'}
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3 leading-relaxed flex-1">
                        {item.desc}
                      </p>

                      {/* Skills */}
                      {item.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {item.skills.slice(0, 3).map((s) => (
                            <span key={s} className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-md">{s}</span>
                          ))}
                          {item.skills.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{item.skills.length - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                        <div>
                          <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                            {item.budget}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <MapPin className="w-3 h-3" /> {item.distance}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground text-[10px]" title={item.postedFull}>
                            <Calendar className="w-3 h-3" /> {item.posted}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;