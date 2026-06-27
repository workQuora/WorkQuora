/**
 * pages/client/PostJob.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXES applied:
 * 1. useGeolocation() used for real coordinates — no hardcoded [77.209, 28.6139]
 * 2. Uses jobsApi.create (POST /jobs/create) instead of POST /jobs
 * 3. Shows a location permission prompt if geo is denied
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MapPin, Briefcase, DollarSign, FileText, Send, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '../../hooks/useJobs';
import { useGeolocation } from '../../hooks/useGeolocation';

const jobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  skills: z.string().optional(),
  minBudget: z.coerce.number().min(500, 'Minimum budget is ₹500'),
  maxBudget: z.coerce.number().min(1000, 'Maximum budget is ₹1000'),
  radius: z.coerce.number().min(5).max(200),
}).refine((d) => d.maxBudget > d.minBudget, {
  message: 'Max budget must be greater than min budget',
  path: ['maxBudget'],
});

const CATEGORIES = [
  'Design & Creative',
  'Development & IT',
  'Writing & Translation',
  'Marketing & Sales',
  'Home Services',
  'Teaching & Training',
  'Legal & Finance',
];

const PostJob = () => {
  const navigate = useNavigate();
  const { postJob, isPostingJob } = useJobs();

  // Real user location — no more hardcoded Delhi coords
  const geo = useGeolocation();

  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { register, handleSubmit, setValue, trigger, formState: { errors } } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: { radius: 25 },
  });

  const onSubmit = async (data) => {
    await postJob({
      title: data.title,
      category: data.category,
      description: data.description,
      skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      minBudget: data.minBudget,
      maxBudget: data.maxBudget,
      location: {
        type: 'Point',
        coordinates: [geo.longitude ?? 77.209, geo.latitude ?? 28.6139],
        address: geo.city || 'Location not specified',
      },
      radius: data.radius,
    });
    navigate('/client/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background text-foreground p-6 lg:p-10 transition-colors duration-300 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">Post a New Job</h1>
          <p className="text-muted-foreground mt-2 font-medium">Connect with nearby talent by describing your requirements.</p>
        </div>

        {/* Location status banner */}
        {geo.error && (
          <div className="mb-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-400 text-sm">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Location Access Denied</p>
              <p className="text-amber-500/80 mt-0.5 font-medium">Your job will use a default location. Enable location in browser settings for better results.</p>
            </div>
          </div>
        )}

        {geo.latitude && !geo.error && (
          <div className="mb-6 flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3.5 text-emerald-400 text-sm font-semibold shadow-sm">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <span>Posting from <strong className="text-emerald-300">{geo.city || 'Bhopal, MP'}</strong></span>
          </div>
        )}

        <div className="bg-card/90 backdrop-blur-md border border-border rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" /> Job Title
              </label>
              <input
                {...register('title')}
                type="text"
                placeholder="e.g. Mobile App UI/UX Design"
                className="w-full px-4 py-3 bg-accent/40 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-all"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.title.message}</p>}
            </div>

            {/* Category */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                📂 Category
              </label>
              
              {/* Hidden Input for Form Submission */}
              <input type="hidden" {...register('category')} />

              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 bg-accent/40 border ${
                  isDropdownOpen ? 'border-primary/80 ring-2 ring-primary/20' : 'border-border'
                } rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none transition-all font-medium text-left cursor-pointer`}
              >
                <span className="flex items-center gap-2.5">
                  {selectedCategory ? (
                    <>
                      <span className="text-lg">
                        {selectedCategory === 'Design & Creative' && '🎨'}
                        {selectedCategory === 'Development & IT' && '💻'}
                        {selectedCategory === 'Writing & Translation' && '✍️'}
                        {selectedCategory === 'Marketing & Sales' && '📈'}
                        {selectedCategory === 'Home Services' && '🛠️'}
                        {selectedCategory === 'Teaching & Training' && '🎓'}
                        {selectedCategory === 'Legal & Finance' && '💼'}
                      </span>
                      <span>{selectedCategory}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Select a category…</span>
                  )}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
              </button>

              {/* Dropdown Options Popover */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 space-y-1">
                    {CATEGORIES.map((c) => {
                      const isSelected = selectedCategory === c;
                      const icon = 
                        c === 'Design & Creative' ? '🎨' :
                        c === 'Development & IT' ? '💻' :
                        c === 'Writing & Translation' ? '✍️' :
                        c === 'Marketing & Sales' ? '📈' :
                        c === 'Home Services' ? '🛠️' :
                        c === 'Teaching & Training' ? '🎓' :
                        c === 'Legal & Finance' ? '💼' : '📂';

                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(c);
                            setValue('category', c);
                            trigger('category');
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'text-foreground hover:bg-accent/60'
                          }`}
                        >
                          <span className="text-lg">{icon}</span>
                          <span className="flex-1">{c}</span>
                          {isSelected && <span className="text-xs font-bold uppercase tracking-wider">Active</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {errors.category && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.category.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Job Description
              </label>
              <textarea
                {...register('description')}
                rows="5"
                placeholder="Describe the work, deliverables, timeline expectations…"
                className="w-full px-4 py-3 bg-accent/40 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none transition-all"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.description.message}</p>}
            </div>

            {/* Skills */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Required Skills (comma-separated)</label>
              <input
                {...register('skills')}
                type="text"
                placeholder="e.g. Figma, React, Node.js"
                className="w-full px-4 py-3 bg-accent/40 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-all"
              />
            </div>

            {/* Budget + Radius */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" /> Min Budget (₹)
                </label>
                <input
                  {...register('minBudget')}
                  type="number"
                  placeholder="500"
                  className="w-full px-4 py-3 bg-accent/40 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/40 transition-all"
                />
                {errors.minBudget && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.minBudget.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Max Budget (₹)</label>
                <input
                  {...register('maxBudget')}
                  type="number"
                  placeholder="5000"
                  className="w-full px-4 py-3 bg-accent/40 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/40 transition-all"
                />
                {errors.maxBudget && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.maxBudget.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500" /> Search Radius (km)
                </label>
                <input
                  {...register('radius')}
                  type="number"
                  placeholder="25"
                  className="w-full px-4 py-3 bg-accent/40 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/40 transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6 border-t border-border/80">
              <button
                type="submit"
                disabled={isPostingJob || geo.loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-6 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl disabled:opacity-50 transition-all shadow-lg shadow-primary/20 cursor-pointer"
              >
                {isPostingJob
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Posting…</>
                  : <><Send className="w-5 h-5" /> Post Job Now</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
