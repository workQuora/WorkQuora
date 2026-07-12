import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2, Edit2, MapPin, Trash2, User, CheckCircle, XCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { useProfile } from '../../../hooks/useProfile';
import { Card, SectionHeader, Button, Input, Select } from '../../../components/ui';
import api from '../../../services/api';

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

const ProfileSection = ({ profile }) => {
  const { updateProfile, isUpdating, uploadPhoto, isUploading, deletePhoto, isDeletingPhoto } = useProfile();
  const { register, handleSubmit, watch, reset } = useForm();
  const dob = watch('dateOfBirth');
  const age = calcAge(dob);

  const usernameValue = watch('username');
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking' | 'available' | 'taken' | 'invalid' | null

  useEffect(() => {
    if (!profile) return;
    reset({
      name: profile.name || '',
      bio: profile.bio || '',
      gender: profile.gender || 'OTHER',
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().slice(0, 10) : '',
      username: profile.username || '',
    });
  }, [profile, reset]);

  useEffect(() => {
    const current = (profile?.username || '').toLowerCase();
    const next = (usernameValue || '').trim().toLowerCase();
    if (!next || next === current) {
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
  }, [usernameValue, profile?.username]);

  const onSubmit = (data) => {
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
        bio: data.bio,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth || undefined,
        ...(usernameChanged && { username: nextUsername }),
      },
      {
        onSuccess: () => {
          if (usernameChanged) window.location.reload();
        },
      }
    );
  };

  const handlePhotoChange = async (e) => {
    let file = e.target.files?.[0];
    if (!file) return;
    try {
      file = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true });
    } catch (err) {
      console.warn('Compression failed, using original file', err);
    }
    const formData = new FormData();
    formData.append('photo', file);
    uploadPhoto(formData);
  };

  return (
    <div className="space-y-4">
      <SectionHeader icon={User} title="Profile & identity" subtitle="Manage how others see you" />

      {/* Avatar */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xl font-bold overflow-hidden text-white shadow-inner">
                {profile?.profilePic || profile?.avatar ? (
                  <img src={profile.profilePic || profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white">
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={isUploading} />
              </label>
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-foreground truncate">{profile?.name || 'Your Name'}</h4>
              <p className="text-sm text-muted-foreground truncate">@{profile?.username || 'username'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
            <Button as="label" variant="secondary" size="sm" isLoading={isUploading} className="cursor-pointer">
              {!isUploading && 'Upload photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={isUploading} />
            </Button>
            {(profile?.profilePic || profile?.avatar) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => deletePhoto()}
                isLoading={isDeletingPhoto}
                className="text-danger hover:bg-danger/10"
              >
                {!isDeletingPhoto && (<><Trash2 className="w-3.5 h-3.5" /> Remove</>)}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Personal details */}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <div className="grid sm:grid-cols-2 gap-x-6">
            <Input label="Full Name" {...register('name')} placeholder="John Doe" />
            <div className="w-full mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">Username</label>
              <div className="relative">
                <input
                  {...register('username')}
                  placeholder="username"
                  className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm bg-white dark:bg-zinc-800/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
                    usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-danger' : 'border-border focus:border-primary'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  {usernameStatus === 'available' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <XCircle className="w-4 h-4 text-danger" />}
                </div>
              </div>
              {usernameStatus === 'taken' && <p className="text-danger text-xs mt-1">Username already taken</p>}
              {usernameStatus === 'invalid' && <p className="text-danger text-xs mt-1">Letters, numbers and underscores only, min 3 characters</p>}
              {usernameStatus === 'available' && <p className="text-emerald-500 text-xs mt-1">Username is available</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-6">
            <div>
              <Input label="Date of Birth" type="date" {...register('dateOfBirth')} max={new Date().toISOString().slice(0, 10)} />
              {age !== null && (
                <p className={`text-xs font-semibold -mt-3 mb-4 ${age < 18 ? 'text-danger' : 'text-primary'}`}>
                  Age: {age} {age < 18 && '— must be 18 or older'}
                </p>
              )}
            </div>
            <Select label="Gender" options={GENDER_OPTIONS} {...register('gender')} />
          </div>

          <div className="space-y-1.5 mb-4">
            <label className="block text-sm font-medium text-foreground">Bio</label>
            <textarea
              {...register('bio')}
              rows="4"
              placeholder="Briefly describe your experience or business..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-zinc-800/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-colors"
            />
          </div>

          <div className="space-y-1.5 mb-2">
            <label className="block text-sm font-medium text-foreground">Location</label>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm bg-muted/40 border border-border rounded-xl px-3.5 py-2.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{profile?.location?.city || profile?.location?.address || 'Not set'}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isUpdating}
              disabled={usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking'}
            >
              {!isUpdating && 'Save Profile'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfileSection;
