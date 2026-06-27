import React, { useState, useCallback, useEffect } from 'react';
import { Search, Loader2, Briefcase, MapPin, ArrowRight, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import api from '../services/api';

const formatBudget = (job) => {
  const min = job?.budgetRange?.min;
  const max = job?.budgetRange?.max;
  if (min != null && max != null) return `₹${min.toLocaleString('en-IN')} – ₹${max.toLocaleString('en-IN')}`;
  if (min != null) return `₹${min.toLocaleString('en-IN')}`;
  return '—';
};

const JobSkeleton = () => (
  <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
    <div className="flex gap-2 mb-4">
      <div className="h-5 bg-muted rounded-full w-20" />
      <div className="h-5 bg-muted rounded-full w-14" />
    </div>
    <div className="h-6 bg-muted rounded w-3/4 mb-3" />
    <div className="h-4 bg-muted rounded w-full mb-1.5" />
    <div className="h-4 bg-muted rounded w-2/3 mb-4" />
    <div className="flex gap-2 mb-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-5 bg-muted rounded w-16" />)}
    </div>
    <div className="pt-3 border-t border-border/60 flex justify-between">
      <div className="h-7 bg-muted rounded w-24" />
      <div className="h-5 bg-muted rounded w-16" />
    </div>
  </div>
);

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialKeyword = searchParams.get('keyword') || '';

  const { role } = useSelector((s) => s.auth);
  const isClient = role === 'CLIENT';

  const [query, setQuery] = useState(initialKeyword);
  const [debouncedQuery, setDebouncedQuery] = useState(initialKeyword);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce for suggestions — 300ms
  const debouncedSetQuery = useCallback(
    debounce((val) => setDebouncedQuery(val), 300),
    []
  );

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    debouncedSetQuery(val);
    setShowSuggestions(val.trim().length > 0);
  };

  // Suggestions query — fast, light
  const { data: suggestions = [], isFetching: suggestionsLoading } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: () =>
      api
        .get('/jobs/search', { params: { keyword: debouncedQuery, limit: 5 } })
        .then((r) => r.data?.data ?? r.data?.jobs ?? r.data ?? []),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  // Full results query — fires after user picks suggestion or presses enter
  const [submittedQuery, setSubmittedQuery] = useState(initialKeyword);
  const [activeTab, setActiveTab] = useState(isClient ? 'freelancers' : 'jobs'); // Default based on role

  // Sync activeTab if role loads asynchronously
  useEffect(() => {
    setActiveTab(isClient ? 'freelancers' : 'jobs');
  }, [isClient]);

  const { data: searchPayload = { jobs: [], freelancers: [] }, isLoading: resultsLoading, isFetching: resultsFetching } = useQuery({
    queryKey: ['search-results', submittedQuery],
    queryFn: async () => {
      if (submittedQuery.trim()) {
        const res = await api.get('/jobs/search', { params: { keyword: submittedQuery, limit: 30 } });
        return {
          jobs: res.data?.jobs ?? [],
          freelancers: res.data?.freelancers ?? []
        };
      } else {
        const [res, freeRes] = await Promise.all([
          api.get('/jobs', { params: { limit: 30, status: 'open' } }),
          api.get('/jobs/search', { params: { limit: 30 } })
        ]);
        const jobs = Array.isArray(res.data) ? res.data : (res.data?.jobs ?? res.data?.data ?? []);
        return {
          jobs,
          freelancers: freeRes.data?.freelancers ?? []
        };
      }
    },
    staleTime: 30_000,
  });

  const jobs = searchPayload.jobs;
  const freelancers = searchPayload.freelancers;

  const handleSearch = (e) => {
    e?.preventDefault();
    setShowSuggestions(false);
    setSubmittedQuery(query.trim());
    setActiveTab(isClient ? 'freelancers' : 'jobs');
  };

  const handleSuggestionClick = (job) => {
    setQuery(job.title);
    setSubmittedQuery(job.title);
    setShowSuggestions(false);
    setActiveTab(isClient ? 'freelancers' : 'jobs');
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setSubmittedQuery('');
    setShowSuggestions(false);
  };

  const isLoading = resultsLoading || resultsFetching;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Search Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 focus-within:border-primary transition-colors shadow-sm">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => query.trim().length > 0 && setShowSuggestions(true)}
                placeholder="Search jobs, skills, freelancers…"
                autoFocus
                className="flex-1 bg-transparent text-foreground focus:outline-none text-base placeholder:text-muted-foreground"
              />
              {suggestionsLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
              {query && (
                <button type="button" onClick={handleClear} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-5 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-all"
              >
                Search
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl shadow-black/20 overflow-hidden z-50">
                {suggestions.map((job) => (
                  <button
                    key={job._id}
                    type="button"
                    onClick={() => handleSuggestionClick(job)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left border-b border-border/50 last:border-0"
                  >
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {job.category} • {formatBudget(job)}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-primary font-semibold text-sm hover:bg-primary/5 transition-colors"
                >
                  See all results for "{query}" <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">
              {submittedQuery ? `Results for "${submittedQuery}"` : 'All Open Jobs'}
            </h1>
            {!isLoading && (
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === 'jobs' 
                  ? `${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'} found`
                  : `${freelancers.length} ${freelancers.length === 1 ? 'freelancer' : 'freelancers'} found`
                }
              </p>
            )}
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching…
            </div>
          )}
        </div>

        {/* Tab Selector */}
        {submittedQuery && !isLoading && (
          <div className="flex gap-2 p-1 bg-accent/20 border border-border rounded-xl mb-6 max-w-xs">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'jobs' ? 'bg-card text-foreground shadow-md border border-border' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Jobs ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab('freelancers')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'freelancers' ? 'bg-card text-foreground shadow-md border border-border' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Freelancers ({freelancers.length})
            </button>
          </div>
        )}

        {/* Skeleton loading */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => <JobSkeleton key={i} />)}
          </div>
        ) : (activeTab === 'jobs' ? jobs.length === 0 : freelancers.length === 0) ? (
          <div className="text-center py-20">
            <Briefcase className="w-16 h-16 mx-auto text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No results found</h3>
            <p className="text-muted-foreground mb-6">
              Try different keywords or browse all available options.
            </p>
            <button
              onClick={handleClear}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all cursor-pointer"
            >
              Browse All Jobs
            </button>
          </div>
        ) : activeTab === 'jobs' ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                onClick={() => navigate(`/job/${job._id}`)}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wide">
                    {job.category || 'General'}
                  </span>
                  <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                    Open
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-base leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {job.title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-3 leading-relaxed">
                  {job.description}
                </p>
                {job.skillsRequired?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {job.skillsRequired.slice(0, 3).map((s) => (
                      <span key={s} className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-md">{s}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatBudget(job)}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {job.location?.address || 'Remote'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {freelancers.map((free) => (
              <div
                key={free._id}
                onClick={() => navigate(`/freelancer/${free._id}`)}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={free.profilePic || free.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${free.name}`}
                    alt={free.name}
                    className="w-12 h-12 rounded-xl object-cover border border-border shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${free.name}`;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                        {free.name}
                      </h3>
                      <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-md uppercase font-extrabold">
                        @{free.username || 'user'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5 truncate">{free.title || 'Freelancer'}</p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{free.bio || 'No bio provided.'}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/60">
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₹{free.hourlyRate || 0}/hr
                  </span>
                  <span className="text-xs font-bold text-primary group-hover:underline">
                    View Profile →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
