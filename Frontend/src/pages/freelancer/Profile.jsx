import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MapPin, Star, Edit3, Moon, Sun, Camera, Loader2, X, Save, ShieldCheck, ShieldX, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../context/ThemeContext';
import { loginSuccess } from '../../actions/authSlice';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';

const FreelancerProfile = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((s) => s.auth);
  const { useGetProfile, updateProfile, isUpdating, uploadPhoto, isUploading } = useProfile();
  const { data: profile, isLoading } = useGetProfile();
  const { theme, toggleTheme } = useTheme();

  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  // Pre-fill edit form with current profile data
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

  // Sync kycVerified from fresh profile data into Redux (so Navbar badge stays accurate)
  useEffect(() => {
    if (profile && token) {
      const kycDone = !!(profile.isKycVerified || profile.kycVerified || (profile.kyc?.aadhaarVerified && profile.kyc?.panVerified));
      if (kycDone !== user?.isKycVerified) {
        dispatch(loginSuccess({ user: { ...user, isKycVerified: kycDone, isEmailVerified: user?.isEmailVerified }, token }));
      }
    }
  }, [profile]);

  const handlePhotoChange = async (e) => {
    let file = e.target.files?.[0];
    if (!file) return;
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
      file = await imageCompression(file, options);
    } catch (err) {
      console.warn("Compression failed, using original file", err);
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

  // Skills normalization — backend stores as comma-string or array
  const skills = Array.isArray(displayProfile?.skills)
    ? displayProfile.skills
    : (displayProfile?.skills || '').split(',').map((s) => s.trim()).filter(Boolean);

  const kycStatus = displayProfile?.kyc?.status;
  // Compute live from kyc fields (Aadhaar + PAN = fully verified) — kycVerified is the dedicated flag
  const isKycVerified = !!(displayProfile?.isKycVerified || displayProfile?.kycVerified || (displayProfile?.kyc?.aadhaarVerified && displayProfile?.kyc?.panVerified));

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 w-full">


      <div className="max-w-5xl mx-auto px-6 pb-16">
        {/* KYC Banner */}
        {!kycStatus && (
          <div className="mb-6 flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-2xl px-5 py-4">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm">KYC Verification Required</p>
              <p className="text-xs mt-0.5 opacity-80">Complete your KYC to unlock payments and full platform access.</p>
            </div>
            <a href="/shared/settings" className="text-xs font-bold underline shrink-0">Verify Now →</a>
          </div>
        )}
        {kycStatus === 'approved' && (
          <div className="mb-6 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-2xl px-5 py-4">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <p className="font-bold text-sm">KYC Verified ✓ — You're fully verified and trusted!</p>
          </div>
        )}

        {/* Cover */}
        <div className="h-48 w-full rounded-t-3xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 relative">
          <button className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white transition-colors">
            <Camera size={18} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="relative -mt-16 bg-card border border-border rounded-b-3xl rounded-t-xl p-8 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            {/* Avatar + Info */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="relative">
                {displayProfile?.profilePic || displayProfile?.avatar ? (
                  <img src={displayProfile.profilePic || displayProfile.avatar} alt={displayProfile.name}
                    className="w-32 h-32 rounded-full border-4 border-card object-cover shadow-xl" />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-card bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl">
                    {displayProfile?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 p-2 bg-primary hover:opacity-90 text-primary-foreground rounded-full shadow-lg cursor-pointer transition-transform hover:scale-105">
                  {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
                {/* KYC verification badge on avatar */}
                <div
                  title={isKycVerified ? 'KYC Verified — Aadhaar & PAN verified' : 'KYC incomplete — complete Aadhaar & PAN'}
                  className={`absolute -top-1 -right-1 flex items-center justify-center w-8 h-8 rounded-full shadow-md border-2 border-card z-10 ${
                    isKycVerified ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                >
                  {isKycVerified
                    ? <ShieldCheck className="w-4 h-4 text-white" />
                    : <ShieldX className="w-4 h-4 text-white" />
                  }
                </div>
              </div>

              <div className="text-center md:text-left mb-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  {displayProfile?.name || 'Your Name'}
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${
                    isKycVerified
                      ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-500 border-red-500/30'
                  }`}>
                    {isKycVerified
                      ? <><ShieldCheck className="w-3 h-3" /> Verified</>
                      : <><ShieldX className="w-3 h-3" /> Not Verified</>
                    }
                  </span>
                </h1>
                {displayProfile?.role !== 'CLIENT' && (
                  <p className="text-lg text-muted-foreground font-medium">{displayProfile?.title || 'Freelancer'}</p>
                )}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-sm text-muted-foreground">
                  {displayProfile?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={16} className="text-primary" />
                      {typeof displayProfile.location === 'object'
                        ? (displayProfile.location.address || displayProfile.location.city || 'Local')
                        : displayProfile.location}
                    </span>
                  )}
                  {displayProfile?.averageRating != null && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star size={16} className="fill-current" />
                      {displayProfile.averageRating} / 5
                    </span>
                  )}
                  {displayProfile?.role !== 'CLIENT' && displayProfile?.hourlyRate > 0 && (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{displayProfile.hourlyRate.toLocaleString('en-IN')}/hr
                    </span>
                  )}
                </div>
                {/* Skills */}
                {displayProfile?.role !== 'CLIENT' && skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 justify-center md:justify-start">
                    {skills.slice(0, 8).map((s) => (
                      <span key={s} className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-1 rounded-lg font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {/* KYC verification status banner */}
                {isKycVerified ? (
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl px-3 py-2 text-xs font-semibold mt-2">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    KYC Verified — Aadhaar &amp; PAN confirmed ✓
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl px-3 py-2 text-xs font-semibold mt-2">
                    <ShieldX className="w-4 h-4 shrink-0" />
                    KYC incomplete — <a href="/shared/settings" className="underline font-bold">Complete Verification →</a>
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => setIsEditing(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg active:scale-95 cursor-pointer">
              <Edit3 size={18} /> Edit Profile
            </button>
          </div>

          {/* Bio */}
          {displayProfile?.bio && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">About</h3>
              <p className="text-foreground/80 leading-relaxed">{displayProfile.bio}</p>
            </div>
          )}

          {/* Stats */}
          {displayProfile?.earnings && (
            <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Jobs Completed', value: displayProfile.earnings.completedJobs ?? '—' },
                { label: 'Total Earned', value: displayProfile.earnings.allTimeIncome ? `₹${displayProfile.earnings.allTimeIncome.toLocaleString('en-IN')}` : '₹0' },
                { label: 'Wallet Balance', value: displayProfile.earnings.walletBalance ? `₹${displayProfile.earnings.walletBalance.toLocaleString('en-IN')}` : '₹0' },
                { label: 'Rating', value: displayProfile.averageRating ? `${displayProfile.averageRating}/5 ⭐` : 'No rating yet' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-background rounded-2xl p-4 border border-border/60">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-lg font-black text-foreground">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl w-full max-w-lg p-8 shadow-2xl relative my-8">
            <button onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-accent text-muted-foreground transition-colors">
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
                  className="flex-1 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-muted-foreground font-medium transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isUpdating}
                  className="flex-1 py-3 bg-primary hover:opacity-90 text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer shadow-md">
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                  {isUpdating ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreelancerProfile;