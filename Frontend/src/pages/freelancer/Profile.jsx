import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Star, Edit3, Camera, Loader2, X, Save, ShieldCheck, ShieldX, AlertTriangle,
  CheckCircle, XCircle, Eye, Upload, Trash2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useProfile } from '../../hooks/useProfile';
import { loginSuccess } from '../../actions/authSlice';
import { reviewsApi } from '../../api/endpoints';
import { AnimatedCard } from '../../components/ui/AnimatedCard';
import { Lightbox } from '../../components/ui/Lightbox';
import KycVerificationCard from '../../components/KycVerificationCard';
import imageCompression from 'browser-image-compression';
import api from '../../services/api';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

const calcAge = (dob) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'kyc', label: 'KYC Status' },
];

const FreelancerProfile = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((s) => s.auth);
  const { useGetProfile, updateProfile, isUpdating, uploadPhoto, isUploading, deletePhoto, isDeletingPhoto } = useProfile();
  const { data: profile, isLoading } = useGetProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedGender, setSelectedGender] = useState('OTHER');

  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const photoMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (photoMenuRef.current && !photoMenuRef.current.contains(e.target)) setShowPhotoMenu(false);
    };
    if (showPhotoMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPhotoMenu]);

  const { register, handleSubmit, reset, watch, setValue } = useForm();

  const usernameValue = watch('username');
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking' | 'available' | 'taken' | 'invalid' | null
  const dobValue = watch('dateOfBirth');
  const editAge = calcAge(dobValue);

  useEffect(() => {
    if (profile && isEditing) {
      reset({
        name: profile.name || '',
        username: profile.username || '',
        title: profile.title || '',
        bio: profile.bio || '',
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().slice(0, 10) : '',
        gender: profile.gender || 'OTHER',
        city: profile.location?.city || '',
        address: profile.location?.address || '',
      });
      setSelectedGender(profile.gender || 'OTHER');
      setUsernameStatus(null);
    }
  }, [profile, isEditing, reset]);

  useEffect(() => {
    const current = (profile?.username || '').toLowerCase();
    const next = (usernameValue || '').trim().toLowerCase();
    if (!isEditing || !next || next === current) {
      setUsernameStatus(null);
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,}$/.test(next)) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await api.get('/users/check-username', { params: { username: next } });
        setUsernameStatus(res.data?.available ? 'available' : 'taken');
      } catch {
        setUsernameStatus(null);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [usernameValue, isEditing, profile?.username]);

  // Sync kycVerified and profile picture from fresh profile data into Redux
  // (so Navbar stays accurate even when KYC/photo change from elsewhere,
  // e.g. the KYC tab below or an admin approval) — separate from the
  // edit-form save flow, which is now synced centrally in useProfile.js.
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
    if (data.dateOfBirth) {
      const a = calcAge(data.dateOfBirth);
      if (a !== null && a < 18) {
        toast.error('You must be at least 18 years old.');
        return;
      }
    }
    const nextUsername = (data.username || '').trim().toLowerCase();
    const usernameChanged = nextUsername && nextUsername !== (profile?.username || '').toLowerCase();
    if (usernameChanged && (usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking')) {
      toast.error('Please choose a valid, available username first.');
      return;
    }
    updateProfile(
      {
        name: data.name,
        title: data.title,
        bio: data.bio,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender,
        city: data.city,
        address: data.address,
        ...(usernameChanged && { username: nextUsername }),
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          if (usernameChanged) window.location.reload();
        },
      }
    );
  };

  const displayProfile = profile || user;
  const userId = displayProfile?.id || displayProfile?._id || user?._id || user?.id;
  const hasProfilePhoto = !!(displayProfile?.profilePic || displayProfile?.avatar);

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

  const navbarCity = useSelector((s) => s.client?.details?.currentLocation?.city);

  // Saved profile location (now user-editable) takes priority — falls back
  // to the live GPS-derived navbar city only when the profile has none set.
  const locationLabel = (typeof displayProfile?.location === 'object'
    ? (displayProfile.location?.address || displayProfile.location?.city || '')
    : displayProfile?.location) || navbarCity || 'Not set';

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
              <div className="absolute -bottom-1 -right-1" ref={photoMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowPhotoMenu((p) => !p)}
                  disabled={isUploading || isDeletingPhoto}
                  className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg cursor-pointer disabled:opacity-60"
                  aria-label="Change profile photo"
                >
                  {isUploading || isDeletingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {showPhotoMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute bottom-10 right-0 w-48 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-20 text-left origin-bottom-right"
                    >
                      {hasProfilePhoto && (
                        <button
                          type="button"
                          onClick={() => { setShowPhotoMenu(false); setViewingPhoto(displayProfile.profilePic || displayProfile.avatar); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" /> View Photo
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setShowPhotoMenu(false); fileInputRef.current?.click(); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        <Upload className="w-4 h-4 text-muted-foreground" /> Upload New Photo
                      </button>
                      {hasProfilePhoto && (
                        <button
                          type="button"
                          onClick={() => { setShowPhotoMenu(false); deletePhoto(); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors border-t border-border"
                        >
                          <Trash2 className="w-4 h-4" /> Remove Photo
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={isUploading} />
              </div>
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

            <div className="flex justify-center mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditing(true)}
                className="px-8 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-md shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </motion.button>
            </div>
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="bg-card border border-border rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative my-auto"
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
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Username</label>
                  <div className="relative">
                    <input {...register('username')} placeholder="username"
                      className={`w-full bg-background border rounded-xl px-4 py-3 pr-10 text-foreground focus:outline-none transition-colors text-sm ${
                        usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-danger' : 'border-border focus:border-primary'
                      }`} />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                      {usernameStatus === 'available' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <XCircle className="w-4 h-4 text-danger" />}
                    </div>
                  </div>
                  {usernameStatus === 'taken' && <p className="text-danger text-xs mt-1">Username already taken</p>}
                  {usernameStatus === 'invalid' && <p className="text-danger text-xs mt-1">Letters, numbers and underscores only, min 3 characters</p>}
                  {usernameStatus === 'available' && <p className="text-emerald-500 text-xs mt-1">Username is available</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Date of Birth</label>
                    <input {...register('dateOfBirth')} type="date" max={new Date().toISOString().slice(0, 10)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                    {editAge !== null && (
                      <p className={`text-xs font-semibold mt-1 ${editAge < 18 ? 'text-danger' : 'text-primary'}`}>
                        Age: {editAge} {editAge < 18 && '— must be 18 or older'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Gender</label>
                    <div className="flex gap-1.5">
                      {GENDER_OPTIONS.map((g) => (
                        <button key={g.value} type="button"
                          onClick={() => { setSelectedGender(g.value); setValue('gender', g.value); }}
                          className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                            selectedGender === g.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                          }`}>
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Bio</label>
                  <textarea {...register('bio')} rows="4" placeholder="Tell about yourself or your company…"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary resize-none transition-colors text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">City</label>
                    <input {...register('city')} placeholder="e.g. Bhopal"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Address (optional)</label>
                    <input {...register('address')} placeholder="Area, landmark…"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                  </div>
                </div>

                {user?.role !== 'CLIENT' && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Professional Title</label>
                    <input {...register('title')} placeholder="e.g. Full Stack Developer"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Manage skills, hourly rate &amp; availability in Settings → Role Settings.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-muted-foreground font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isUpdating || usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking'}
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

      <Lightbox src={viewingPhoto} alt={displayProfile?.name} onClose={() => setViewingPhoto(null)} />
    </div>
  );
};

export default FreelancerProfile;
