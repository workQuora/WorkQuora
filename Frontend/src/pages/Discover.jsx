import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapPin, SlidersHorizontal, Map, List, Loader2, RefreshCw, Search, X, Calendar, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JobMap from '../components/JobMap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import api from '../services/api';
import AdBanner from '../components/shared/AdBanner';
import { SearchBox, FilterChip, Pagination, Badge } from '../components/ui';

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
const PAGE_SIZE = 12;

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

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
  const [currentPage, setCurrentPage] = useState(1);
  const resultsTopRef = useRef(null);

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

  // Client-side pagination over the already-fetched results (API calls unchanged)
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedKeyword, category, feedMode, radius]);

  const totalPages = Math.max(1, Math.ceil(mapItems.length / PAGE_SIZE));
  const pagedItems = mapItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    if (resultsTopRef.current) {
      resultsTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background text-foreground flex flex-col transition-colors duration-300">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">
          {/* Row 1: Search + toggles */}
          <div className="flex gap-3 items-center">
            <SearchBox
              value={keyword}
              onChange={handleKeywordChange}
              onClear={() => { setKeyword(''); debouncedSet(''); }}
              placeholder={isClient ? 'Search freelancers, skills, keywords…' : 'Search jobs, skills, keywords…'}
              className="flex-1 py-3"
            />

            {/* Filter Toggle Button */}
            <button onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-2 px-4 py-3 rounded-full border text-sm font-semibold transition-all cursor-pointer shrink-0 active:scale-[0.98] ${
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

            {/* View Toggle — Apple segmented control with sliding highlight */}
            <div className="flex gap-0.5 bg-muted p-1 rounded-full shrink-0">
              {[{ mode: 'list', Icon: List }, { mode: 'map', Icon: Map }].map(({ mode, Icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className="relative p-2 rounded-full transition-colors cursor-pointer">
                  {viewMode === mode && (
                    <motion.span
                      layoutId="view-toggle-highlight"
                      className="absolute inset-0 bg-primary rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon className={`relative z-10 w-4 h-4 ${viewMode === mode ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Category filter chips — horizontal scrollable row */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="shrink-0">
                <FilterChip label={cat} active={category === cat} onClick={() => setCategory(cat)} layoutId="category-highlight" />
              </div>
            ))}
          </div>

          {/* Row 2: Filter Dropdown (collapsible) */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="bg-background border border-border rounded-2xl p-5 space-y-5">
                  {/* Feed Mode Toggle */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">Feed Mode</p>
                    <div className="flex gap-2">
                      {[{ key: 'all', label: isClient ? '🌐 All Freelancers' : '🌐 All Jobs' }, { key: 'geo', label: '📍 Nearby' }].map(({ key, label }) => (
                        <FilterChip key={key} label={label} active={feedMode === key} onClick={() => setFeedMode(key)} layoutId="feedmode-highlight" />
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
                      className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary py-2 px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer active:scale-[0.98]">
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                    <button onClick={() => { setCategory('All'); setFeedMode('all'); setRadius(25); setKeyword(''); debouncedSet(''); }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-medium">
                      Clear All Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content */}
      <div ref={resultsTopRef} className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6">
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
          <div className="space-y-6">
            <AdBanner platform="WEB" className="mb-4 shadow-xl shadow-black/20" />
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-2xl text-foreground tracking-tight">
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
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPage}
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                  >
                    {pagedItems.map((item) => (
                      isClient ? (
                        // Freelancer Card
                        <motion.div
                          key={item.id}
                          variants={staggerItem}
                          whileHover={{ y: -4 }}
                          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                          onClick={() => navigate(`/freelancer/${item.id}`)}
                          className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-shadow cursor-pointer group flex flex-col justify-between"
                        >
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
                                  <Badge variant={item.isVerified ? 'success' : 'danger'}>
                                    {item.isVerified ? 'Verified' : 'Not Verified'}
                                  </Badge>
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
                              <span className="text-xs font-bold text-foreground/80 ml-1">{Number(item.rating || 0).toFixed(1)}</span>
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
                        </motion.div>
                      ) : (
                        // Job Card
                        <motion.div
                          key={item.id}
                          variants={staggerItem}
                          whileHover={{ y: -4 }}
                          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                          onClick={() => navigate(`/job/${item.id}`)}
                          className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-shadow cursor-pointer group flex flex-col"
                        >
                          {/* Top badges */}
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="info">{item.category || 'General'}</Badge>
                            <Badge variant={item.status === 'open' ? 'success' : 'neutral'}>{item.status}</Badge>
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
                              <Badge variant={item.clientInfo.isKycVerified ? 'success' : 'danger'}>
                                {item.clientInfo.isKycVerified ? 'Verified' : 'Not Verified'}
                              </Badge>
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
                        </motion.div>
                      )
                    ))}
                  </motion.div>
                </AnimatePresence>

                {totalPages > 1 && (
                  <div className="flex justify-center pt-4">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
