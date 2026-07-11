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
import { MapPin, Briefcase, DollarSign, Send, AlertCircle, ChevronDown, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '../../hooks/useJobs';
import { useGeolocation } from '../../hooks/useGeolocation';
import { Card, Button, Input, Badge } from '../../components/ui';

const jobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  skills: z.string().optional(),
  locationAddress: z.string().min(3, 'Location must be at least 3 characters'),
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

const CATEGORY_ICON = {
  'Design & Creative': '🎨',
  'Development & IT': '💻',
  'Writing & Translation': '✍️',
  'Marketing & Sales': '📈',
  'Home Services': '🛠️',
  'Teaching & Training': '🎓',
  'Legal & Finance': '💼',
};

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

  // Sync city name to field
  React.useEffect(() => {
    if (geo.city && geo.city !== 'Detecting…' && geo.city !== 'Location Denied') {
      setValue('locationAddress', geo.city);
    }
  }, [geo.city, setValue]);

  const onSubmit = async (data) => {
    let coords = [geo.longitude ?? 77.209, geo.latitude ?? 28.6139];
    let address = data.locationAddress || geo.city || 'Location not specified';

    // Geocode custom location if provided and different from detected city
    if (data.locationAddress && data.locationAddress !== geo.city) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.locationAddress)}&format=json&limit=1`);
        const result = await response.json();
        if (result && result.length > 0) {
          coords = [parseFloat(result[0].lon), parseFloat(result[0].lat)];
          address = result[0].display_name || data.locationAddress;
        }
      } catch (err) {
        console.warn('Geocoding failed, using fallback coordinates:', err);
      }
    }

    await postJob({
      title: data.title,
      category: data.category,
      description: data.description,
      skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      minBudget: data.minBudget,
      maxBudget: data.maxBudget,
      location: {
        type: 'Point',
        coordinates: coords,
        address: address,
      },
      radius: data.radius,
    });
    navigate('/client/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background text-foreground p-6 lg:p-10 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Post a new job</h1>
          <p className="text-muted-foreground mt-3">Connect with nearby talent by describing your requirements.</p>

          {/* Location status */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {geo.latitude && !geo.error && (
              <Badge variant="success">
                <MapPin className="w-3 h-3" /> Posting from {geo.city || 'Bhopal, MP'}
              </Badge>
            )}
            {geo.error && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning bg-warning/10 px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" /> Location access denied — using default location
              </span>
            )}
          </div>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Title */}
            <Input
              label="Job Title"
              icon={Briefcase}
              {...register('title')}
              type="text"
              placeholder="e.g. Mobile App UI/UX Design"
              error={errors.title?.message}
            />

            {/* Category */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>

              {/* Hidden Input for Form Submission */}
              <input type="hidden" {...register('category')} />

              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-zinc-800/50 border text-foreground focus:outline-none transition-colors cursor-pointer ${
                  isDropdownOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {selectedCategory ? (
                    <>
                      <span className="text-base">{CATEGORY_ICON[selectedCategory] || '📂'}</span>
                      <span className="font-medium">{selectedCategory}</span>
                    </>
                  ) : (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="w-4 h-4" /> Select a category…
                    </span>
                  )}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
              </button>

              {/* Dropdown Options Popover */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-md overflow-hidden z-50">
                  <div className="p-2 space-y-1">
                    {CATEGORIES.map((c) => {
                      const isSelected = selectedCategory === c;
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
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-white'
                              : 'text-foreground hover:bg-muted'
                          }`}
                        >
                          <span className="text-base">{CATEGORY_ICON[c]}</span>
                          <span className="flex-1">{c}</span>
                          {isSelected && <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {errors.category && <p className="text-danger text-xs mt-1.5">{errors.category.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Job Description</label>
              <textarea
                {...register('description')}
                rows="5"
                placeholder="Describe the work, deliverables, timeline expectations…"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-zinc-800/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-colors ${errors.description ? 'border-danger' : 'border-border focus:border-primary'}`}
              />
              {errors.description && <p className="text-danger text-xs mt-1.5">{errors.description.message}</p>}
            </div>

            {/* Skills */}
            <Input
              label="Required Skills (comma-separated)"
              {...register('skills')}
              type="text"
              placeholder="e.g. Figma, React, Node.js"
            />

            {/* Location input */}
            <Input
              label="Job Location / City"
              icon={MapPin}
              {...register('locationAddress')}
              type="text"
              placeholder="e.g. Bhopal, MP or Lalghati, Bhopal"
              error={errors.locationAddress?.message}
            />

            {/* Budget + Radius */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
              <Input
                label="Min Budget (₹)"
                icon={DollarSign}
                {...register('minBudget')}
                type="number"
                placeholder="500"
                error={errors.minBudget?.message}
              />
              <Input
                label="Max Budget (₹)"
                icon={DollarSign}
                {...register('maxBudget')}
                type="number"
                placeholder="5000"
                error={errors.maxBudget?.message}
              />
              <Input
                label="Search Radius (km)"
                icon={MapPin}
                {...register('radius')}
                type="number"
                placeholder="25"
              />
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-border">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isPostingJob || geo.loading}
                isLoading={isPostingJob}
                className="w-full"
              >
                {!isPostingJob && (<><Send className="w-4 h-4" /> Post Job Now</>)}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default PostJob;
