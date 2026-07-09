import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Star, Edit3, Camera, Loader2, X, Save, ShieldCheck, ShieldX, AlertTriangle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useProfile } from '../../hooks/useProfile';
import { loginSuccess } from '../../actions/authSlice';
import { reviewsApi } from '../../api/endpoints';
import { AnimatedCard } from '../../components/ui/AnimatedCard';
import KycVerificationCard from '../../components/KycVerificationCard';
import imageCompression from 'browser-image-compression';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'kyc', label: 'KYC Status' },
];

const FreelancerProfile = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((s) => s.auth);
  const { useGetProfile, updateProfile, isUpdating, uploadPhoto, isUploading } = useProfile();
  const { data: profile, isLoading } = useGetProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (profile && isEditing) {
      reset({
        name: profile.name || '',
        title: profile.title || '',
        bio: profile.bio || '',
        skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || ''),
        hourlyRate: profile.hourlyRate || '',
      });
    }
  }, [profile, isEditing, reset]);

  // Sync kycVerified and profile picture from fresh profile data into Redux (so Navbar stays accurate)
  useEffect(() => {
    if (profile && token) {
      const kycDone = !!(profile.isKycVerified || profile.kycVerified || (profile.kyc?.aadhaarVerified && profile.kyc?.panVerified));
      const hasPicChanged = profile.profilePic !== user?.profilePic || profile.avatar !== user?.avatar;
      if (kycDone !== user?.isKycVerified || hasPicChanged) {
        dispatch(loginSuccess({ 
          user: { 
            ...user, 
            isKycVerified: kycDone, 
            isEmailVerified: user?.isEmailVerified,
            profilePic: profile.profilePic,
            avatar: profile.avatar
          }, 
          token 
        }));
      }
    }
  }, [profile, token, user, dispatch]);

  const handlePhotoChange = async (e) => {
    let file = e.target.files?.[0];
    if (!file) return;
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
      file = await imageCompression(file, options);
    } catch (err) {
      console.warn('Compression failed, using original file', err);
    }
    const formData = new FormData();
    formData.append('photo', file);
    uploadPhoto(formData);
  };

  const onProfileSubmit = (data) => {
    updateProfile(
      {
        name: data.name,
        title: data.title,
        bio: data.bio,
        skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        hourlyRate: Number(data.hourlyRate) || 0,
      },
      {
        onSuccess: (res) => {
          const updatedUser = res?.data?.data ?? res?.data;
          if (updatedUser && token) {
            dispatch(loginSuccess({ user: { ...user, ...updatedUser }, token }));
          }
          setIsEditing(false);
        },
      }
    );
  };

  const displayProfile = profile || user;
  const userId = displayProfile?.id || displayProfile?._id || user?._id || user?.id;

  const skills = Array.isArray(displayProfile?.skills)
    ? displayProfile.skills
    : (displayProfile?.skills || '').split(',').map((s) => s.trim()).filter(Boolean);

  // kycStatus enum is pending|verified|rejected — 'approved' is never a real value
  const kycStatus = displayProfile?.kyc?.status;
  const isKycVerified = !!(displayProfile?.isKycVerified || displayProfile?.kycVerified || (displayProfile?.kyc?.aadhaarVerified && displayProfile?.kyc?.panVerified));

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', userId],
    queryFn: () => reviewsApi.getUser(userId).then((r) => r.data?.data ?? []),
    enabled: !!userId && activeTab === 'reviews',
  });

  const locationLabel = typeof displayProfile?.location === 'object'
    ? (displayProfile.location?.address || displayProfile.location?.city || '')
    : displayProfile?.location;

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground w-full">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {!kycStatus && (
          <div className="mb-6 flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-2xl px-5 py-4">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm">KYC Verification Required</p>
              <p className="text-xs mt-0.5 opacity-80">Complete your KYC to unlock payments and full platform access.</p>
            </div>
            <button onClick={() => setActiveTab('kyc')} className="text-xs font-bold underline shrink-0">Verify Now →</button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Profile card */}
          <AnimatedCard className="p-6 text-center h-fit lg:sticky lg:top-24" hover={false}>
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full ring-4 ring-primary/20 ring-offset-2 ring-offset-card overflow-hidden mx-auto">
                {displayProfile?.profilePic || displayProfile?.avatar ? (
                  <img src={displayProfile.profilePic || displayProfile.avatar} alt={displayProfile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                    {displayProfile?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg cursor-pointer">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={isUploading} />
              </label>
            </div>

            <h2 className="text-xl font-bold text-foreground">{displayProfile?.name || 'Your Name'}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {displayProfile?.role === 'CLIENT' ? 'Client' : (displayProfile?.title || 'Freelancer')}
            </p>

            {isKycVerified ? (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <ShieldCheck className="w-4 h-4" /> KYC Verified
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-amber-500 text-sm font-medium">
                <ShieldX className="w-4 h-4" /> KYC Pending
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">{displayProfile?.earnings?.completedJobs ?? 0}</div>
                <div className="text-xs text-muted-foreground">Jobs Done</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground flex items-center justify-center gap-0.5">
                  {displayProfile?.averageRating || '—'}
                  {displayProfile?.averageRating > 0 && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                </div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {displayProfile?.hourlyRate ? `₹${displayProfile.hourlyRate}` : '—'}
                </div>
                <div className="text-xs text-muted-foreground">Per Hour</div>
              </div>
            </div>

            {locationLabel && (
              <div className="flex items-center justify-center gap-1.5 mt-4 text-muted-foreground text-sm">
                <MapPin className="w-3.5 h-3.5" /> {locationLabel}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setIsEditing(true)}
              className="w-full mt-6 py-2.5 rounded-xl border-2 border-primary/20 text-primary font-medium text-sm hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </motion.button>
          </AnimatedCard>

          {/* Right: Tabs */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-1 mb-6 bg-muted/50 p-1 rounded-xl w-fit">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    activeTab === t.id ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && (
                  <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">About</h3>
                      <p className="text-foreground/80 leading-relaxed text-sm">
                        {displayProfile?.bio || 'No bio added yet.'}
                      </p>
                    </div>

                    {displayProfile?.role !== 'CLIENT' && (
                      <div>
                        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">Skills</h3>
                        {skills.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {skills.map((skill) => (
                              <span key={skill} className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No skills added yet.</p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      {displayProfile?.role !== 'CLIENT' && (
                        <div>
                          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-1">Hourly Rate</h3>
                          <p className="text-foreground font-semibold">
                            {displayProfile?.hourlyRate ? `₹${displayProfile.hourlyRate.toLocaleString('en-IN')}/hr` : 'Not set'}
                          </p>
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-1">Member Since</h3>
                        <p className="text-foreground font-semibold">
                          {displayProfile?.createdAt
                            ? new Date(displayProfile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-foreground">Reviews</h3>
                      {userId && (
                        <Link to={`/reviews/${userId}`} className="text-xs text-primary font-bold hover:underline">
                          See all reviews
                        </Link>
                      )}
                    </div>
                    {reviewsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
                      </div>
                    ) : !reviewsData || reviewsData.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">No reviews yet. Complete jobs to get reviews.</p>
                    ) : (
                      <div className="space-y-3">
                        {reviewsData.slice(0, 3).map((r) => (
                          <div key={r._id} className="p-4 rounded-xl border border-border/60">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-foreground">{r.reviewer?.name || 'Anonymous'}</span>
                              <span className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                                <Star className="w-3.5 h-3.5 fill-current" /> {r.rating}
                              </span>
                            </div>
                            {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'kyc' && <KycVerificationCard hideOnComplete={false} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end p-4 overflow-y-auto">
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="bg-card border border-border rounded-3xl w-full max-w-lg p-8 shadow-2xl relative my-8"
            >
              <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-accent text-muted-foreground transition-colors">
                <X size={20} />
              </button>
              <h2 className="text-2xl font-bold text-foreground mb-6">Edit Profile</h2>

              <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Full Name</label>
                  <input {...register('name')} placeholder="Your full name"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Bio</label>
                  <textarea {...register('bio')} rows="4" placeholder="Tell about yourself or your company…"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary resize-none transition-colors text-sm" />
                </div>
                {user?.role !== 'CLIENT' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Professional Title</label>
                      <input {...register('title')} placeholder="e.g. Full Stack Developer"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Skills (comma-separated)</label>
                      <input {...register('skills')} placeholder="React, Node.js, Figma…"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Hourly Rate (₹)</label>
                      <input {...register('hourlyRate')} type="number" placeholder="e.g. 500"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-muted-foreground font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isUpdating}
                    className="flex-1 py-3 bg-primary hover:opacity-90 text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md">
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                    {isUpdating ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FreelancerProfile;
