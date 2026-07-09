import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, User, Lock, Bell, Loader2, Camera, ShieldCheck,
  AlertTriangle, CheckCircle2, ChevronRight, HelpCircle,
  Mail, MessageSquare, Home, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useProfile } from '../../hooks/useProfile';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess, logout } from '../../actions/authSlice';
import api from '../../services/api';
import imageCompression from 'browser-image-compression';
import AdBanner from '../../components/shared/AdBanner';
import KycVerificationCard from '../../components/KycVerificationCard';

const SECTIONS = [
  { id: 'account', label: 'Account', icon: User, desc: 'Manage your personal and professional details.' },
  { id: 'privacy', label: 'Privacy', icon: Lock, desc: 'Control what others can see on your profile.' },
  { id: 'kyc', label: 'Identity Verification', icon: ShieldCheck, desc: 'Submit and view your KYC status.' },
  { id: 'security', label: 'Login & Security', icon: Shield, desc: 'Update password and secure your account.' },
  { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Choose what you want to be notified about.' },
  { id: 'help', label: 'Help Center', icon: HelpCircle, desc: 'Find answers and contact support.' },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, desc: 'Permanently delete your account.' },
];

const Toggle = ({ label, description, value, onChange }) => (
  <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
    <div className="pr-4">
      <p className="font-medium text-foreground text-sm">{label}</p>
      {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={onChange}
      className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${value ? 'bg-primary' : 'bg-muted'}`}
    >
      <motion.div
        animate={{ x: value ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5"
      />
    </button>
  </div>
);

const NOTIF_LOCAL_KEY = 'wq-notification-prefs';
const DEFAULT_NOTIF_PREFS = { jobMatches: true, applicationUpdates: true, walletPayments: true, directMessages: true };

const Settings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const qc = useQueryClient();
  const { user, token } = useSelector((s) => s.auth);
  const [activeSection, setActiveSection] = useState('account');

  const { useGetProfile, updateProfile, isUpdating, uploadPhoto, isUploading } = useProfile();
  const { data: profile, isLoading, refetch } = useGetProfile();

  const { register, handleSubmit, reset } = useForm();
  const [otpSent, setOtpSent] = useState(false);
  const [resettingPwd, setResettingPwd] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const kycStatus = profile?.kyc?.status;

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        username: profile.username || '',
        title: profile.title || '',
        bio: profile.bio || '',
        skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || ''),
        hourlyRate: profile.hourlyRate || '',
      });
      setTwoFactorEnabled(profile.twoFactorEnabled || false);

      // Sync fresh profile state to Redux
      const kycDone = !!(profile.isKycVerified || profile.kycVerified || (profile.kyc?.aadhaarVerified && profile.kyc?.panVerified));
      const hasPicChanged = profile.profilePic !== user?.profilePic || profile.avatar !== user?.avatar;
      if (kycDone !== user?.isKycVerified || hasPicChanged) {
        dispatch(loginSuccess({ 
          user: { 
            ...user, 
            isKycVerified: kycDone, 
            profilePic: profile.profilePic, 
            avatar: profile.avatar 
          }, 
          token 
        }));
      }
    }
  }, [profile, reset, user, token, dispatch]);

  const onProfileSubmit = (data) => {
    updateProfile(
      {
        name: data.name,
        username: data.username,
        title: data.title,
        bio: data.bio,
        skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        hourlyRate: Number(data.hourlyRate) || 0,
        mobileNumber: data.mobileNumber || undefined,
      },
      {
        onSuccess: (res) => {
          const updatedUser = res?.data?.data ?? res?.data;
          if (updatedUser && token) dispatch(loginSuccess({ user: { ...user, ...updatedUser }, token }));
        },
      }
    );
  };

  const [isSendingMobileOtp, setIsSendingMobileOtp] = useState(false);
  const [isVerifyingMobile, setIsVerifyingMobile] = useState(false);
  const [mobileOtp, setMobileOtp] = useState('');
  const [showMobileOtpInput, setShowMobileOtpInput] = useState(false);

  const handleSendMobileOtp = async () => {
    try {
      setIsSendingMobileOtp(true);
      await api.post('/auth/send-mobile-otp', { email: profile?.email });
      setShowMobileOtpInput(true);
      toast.success('Mobile OTP sent via SMS.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setIsSendingMobileOtp(false);
    }
  };

  const handleVerifyMobile = async () => {
    if (!mobileOtp) return toast.error('Enter OTP');
    try {
      setIsVerifyingMobile(true);
      await api.post('/auth/verify-mobile', { email: profile?.email, otp: mobileOtp });
      toast.success('Mobile Verified Successfully!');
      setShowMobileOtpInput(false);
      if (token) dispatch(loginSuccess({ user: { ...user, isMobileVerified: true }, token }));
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setIsVerifyingMobile(false);
    }
  };

  const toggle2FA = () => {
    const newVal = !twoFactorEnabled;
    setTwoFactorEnabled(newVal);
    updateProfile({ twoFactorEnabled: newVal });
  };

  const handlePhotoChange = async (e) => {
    let file = e.target.files?.[0];
    if (file) {
      try {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
        file = await imageCompression(file, options);
      } catch (err) {
        console.warn('Compression failed, using original file', err);
      }
      const formData = new FormData();
      formData.append('photo', file);
      uploadPhoto(formData);
    }
  };

  const handleRequestPasswordReset = async () => {
    try {
      setResettingPwd(true);
      await api.post('/auth/forgot-password', { email: profile?.email });
      setOtpSent(true);
      toast.success('OTP sent to your email to reset password.');
    } catch {
      toast.error('Failed to request reset. Try logging out and using Forgot Password.');
    } finally {
      setResettingPwd(false);
    }
  };

  // ── Privacy — GET/PUT /settings/privacy, real backend endpoints ──
  const { data: privacyData, isLoading: privacyLoading } = useQuery({
    queryKey: ['privacy-settings'],
    queryFn: () => api.get('/settings/privacy').then((r) => r.data?.data ?? {}),
    enabled: activeSection === 'privacy',
  });

  const updatePrivacyMutation = useMutation({
    mutationFn: (payload) => api.put('/settings/privacy', payload),
    onSuccess: () => {
      toast.success('Privacy settings updated');
      qc.invalidateQueries({ queryKey: ['privacy-settings'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update privacy settings'),
  });

  const togglePrivacyField = (field) => {
    const current = privacyData?.[field] ?? false;
    updatePrivacyMutation.mutate({ [field]: !current });
  };

  // ── Notifications — no backend endpoint exists yet, persist locally ──
  const [notifPrefs, setNotifPrefs] = useState(DEFAULT_NOTIF_PREFS);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(NOTIF_LOCAL_KEY) || 'null');
      if (saved) setNotifPrefs({ ...DEFAULT_NOTIF_PREFS, ...saved });
    } catch { /* ignore corrupt local state */ }
  }, []);
  const toggleNotifPref = (key) => setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  const saveNotifPrefs = () => {
    localStorage.setItem(NOTIF_LOCAL_KEY, JSON.stringify(notifPrefs));
    toast.success('Preferences saved locally');
  };

  // ── Danger zone — DELETE /auth/account, real backend endpoint ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/auth/account');
      toast.success('Account deleted');
      dispatch(logout());
      navigate('/auth');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  const active = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-background transition-colors duration-300">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Account Settings</h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-2xl">Manage your account settings, verify your identity, and set up your security preferences.</p>
        </div>
        <button onClick={() => navigate('/')}
          className="self-start sm:self-center flex items-center gap-2 bg-accent/40 border border-border hover:bg-accent px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
          <Home className="w-4 h-4 text-primary" />
          <span>Home</span>
        </button>
      </div>

      {!kycStatus && activeSection !== 'kyc' && (
        <div onClick={() => setActiveSection('kyc')} className="mb-8 flex items-center gap-4 bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 cursor-pointer rounded-2xl p-5 transition-all shadow-sm">
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-amber-700 dark:text-amber-400">KYC Verification Required</p>
            <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-0.5">Please verify your identity to access full platform features and withdrawals.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-500" />
        </div>
      )}

      <div className="mb-8">
        <AdBanner platform="WEB" className="shadow-lg shadow-black/10" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="sticky top-24 space-y-1">
            {SECTIONS.map((s) => (
              <motion.button
                key={s.id}
                whileHover={{ x: 2 }}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-colors ${
                  activeSection === s.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'
                } ${s.id === 'danger' ? (activeSection === 'danger' ? '' : 'text-red-500/80 hover:bg-red-500/5') : ''}`}
              >
                <s.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{s.label}</span>
                {s.id === 'kyc' && kycStatus === 'verified' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                {s.id === 'kyc' && !kycStatus && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-sm min-h-[500px]">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <active.icon className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{active.label}</h2>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* ACCOUNT */}
                {activeSection === 'account' && (
                  <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-8">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-3xl font-bold overflow-hidden text-white shadow-inner">
                          {profile?.profilePic || profile?.avatar
                            ? <img src={profile.profilePic || profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                            : (profile?.name?.[0]?.toUpperCase() || 'U')}
                        </div>
                        <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white backdrop-blur-sm">
                          {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                          <span className="text-[10px] font-bold mt-1">Upload</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={isUploading} />
                        </label>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="font-extrabold text-xl text-foreground">{profile?.name || 'Your Name'}</p>
                        <p className="text-muted-foreground text-sm font-medium">{profile?.email || ''}</p>
                        {profile?.role && (
                          <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full uppercase mt-2 inline-block tracking-wider">
                            {profile.role} Account
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                        <input {...register('name')} placeholder="John Doe" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Unique Username</label>
                        <input {...register('username')} placeholder="john_doe_99" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                      </div>
                    </div>

                    <div className="p-5 bg-background border border-border rounded-2xl">
                      <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="w-full space-y-1.5">
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Mobile Number</label>
                          <input {...register('mobileNumber')} placeholder="9999999999" maxLength={10} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                        </div>
                        {user?.isMobileVerified ? (
                          <div className="shrink-0 px-4 py-3 bg-emerald-500/10 text-emerald-500 font-bold text-sm rounded-xl border border-emerald-500/20 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Verified
                          </div>
                        ) : (
                          <button type="button" onClick={handleSendMobileOtp} disabled={isSendingMobileOtp} className="shrink-0 px-4 py-3 bg-amber-500 hover:opacity-90 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all">
                            {isSendingMobileOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Mobile'}
                          </button>
                        )}
                      </div>

                      {showMobileOtpInput && (
                        <div className="mt-4 flex gap-3 items-end p-4 bg-muted/50 rounded-xl border border-border">
                          <div className="flex-1 space-y-1.5">
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Enter OTP</label>
                            <input value={mobileOtp} onChange={(e) => setMobileOtp(e.target.value)} placeholder="6-digit OTP" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm tracking-widest font-mono" />
                          </div>
                          <button type="button" onClick={handleVerifyMobile} disabled={isVerifyingMobile} className="px-6 py-3 bg-primary hover:opacity-90 text-white font-bold text-sm rounded-xl">
                            {isVerifyingMobile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                          </button>
                        </div>
                      )}
                    </div>

                    {user?.role !== 'CLIENT' && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Professional Title</label>
                        <input {...register('title')} placeholder="e.g. Senior Frontend Developer" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">About You</label>
                      <textarea {...register('bio')} rows="4" placeholder="Briefly describe your experience or business..." className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary resize-none transition-colors text-sm" />
                    </div>

                    {user?.role !== 'CLIENT' && (
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Skills (Comma-separated)</label>
                          <input {...register('skills')} placeholder="React, Node.js, Design" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Hourly Rate (₹)</label>
                          <input {...register('hourlyRate')} type="number" placeholder="500" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border flex justify-end">
                      <button type="submit" disabled={isUpdating} className="bg-primary hover:opacity-90 text-primary-foreground px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-primary/20">
                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isUpdating ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  </form>
                )}

                {/* PRIVACY — real backend endpoint */}
                {activeSection === 'privacy' && (
                  <div className="max-w-xl">
                    {privacyLoading ? (
                      <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}</div>
                    ) : (
                      <>
                        <Toggle
                          label="Show Email"
                          description="Let other users see your email on your public profile."
                          value={!!privacyData?.showEmail}
                          onChange={() => togglePrivacyField('showEmail')}
                        />
                        <Toggle
                          label="Show Phone Number"
                          description="Let other users see your mobile number on your public profile."
                          value={!!privacyData?.showPhone}
                          onChange={() => togglePrivacyField('showPhone')}
                        />
                        {user?.role !== 'CLIENT' && (
                          <Toggle
                            label="Show Earnings"
                            description="Display your total earnings publicly on your profile."
                            value={!!privacyData?.showEarnings}
                            onChange={() => togglePrivacyField('showEarnings')}
                          />
                        )}

                        <div className="pt-6">
                          <p className="font-medium text-foreground text-sm mb-3">Profile Visibility</p>
                          <div className="space-y-2">
                            {[
                              { val: 'public', label: 'Public', desc: 'Anyone can view your profile' },
                              { val: 'registered', label: 'Registered users only', desc: 'Only logged-in WorkQuora users can view your profile' },
                              { val: 'private', label: 'Private', desc: 'Only you and admins can view your profile' },
                            ].map((opt) => (
                              <label key={opt.val} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/40 cursor-pointer transition-colors">
                                <input
                                  type="radio"
                                  name="profileVisibility"
                                  checked={(privacyData?.profileVisibility || 'public') === opt.val}
                                  onChange={() => updatePrivacyMutation.mutate({ profileVisibility: opt.val })}
                                  className="accent-primary"
                                />
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* KYC */}
                {activeSection === 'kyc' && <KycVerificationCard hideOnComplete={false} onRedirectToAccount={() => setActiveSection('account')} />}

                {/* SECURITY */}
                {activeSection === 'security' && (
                  <div className="space-y-10 max-w-xl">
                    <section>
                      <h3 className="text-lg font-bold text-foreground mb-4 border-b border-border pb-2">Password Management</h3>
                      <p className="text-sm text-muted-foreground mb-6">Need to change your password? Request a secure OTP to your registered email.</p>

                      {otpSent ? (
                        <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl">
                          <p className="text-sm font-medium text-foreground mb-4">We've sent a password reset OTP to your email. Please check your inbox.</p>
                          <button onClick={() => { dispatch(logout()); navigate('/auth'); }}
                            className="bg-primary hover:opacity-90 text-primary-foreground font-bold px-6 py-2.5 rounded-xl text-sm transition-all">
                            Proceed to Login to Reset
                          </button>
                        </div>
                      ) : (
                        <button onClick={handleRequestPasswordReset} disabled={resettingPwd} className="border border-border bg-background hover:bg-muted text-foreground font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all">
                          {resettingPwd ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                          Request Password Reset
                        </button>
                      )}
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-foreground mb-4 border-b border-border pb-2">Two-Factor Authentication (2FA)</h3>
                      <div className="bg-background border border-border rounded-2xl px-5">
                        <Toggle
                          label="Require OTP on Login"
                          description="Add an extra layer of security to your account."
                          value={twoFactorEnabled}
                          onChange={toggle2FA}
                        />
                      </div>
                    </section>
                  </div>
                )}

                {/* NOTIFICATIONS — no backend endpoint yet, persisted locally */}
                {activeSection === 'notifications' && (
                  <div className="max-w-xl">
                    <div className="bg-background border border-border rounded-2xl px-5 mb-4">
                      <Toggle label="Job Matches" description="Alerts when a job matches your skills and location" value={notifPrefs.jobMatches} onChange={() => toggleNotifPref('jobMatches')} />
                      <Toggle label="Application Updates" description="When a client accepts or rejects your proposal" value={notifPrefs.applicationUpdates} onChange={() => toggleNotifPref('applicationUpdates')} />
                      <Toggle label="Wallet & Payments" description="When funds are added or withdrawn" value={notifPrefs.walletPayments} onChange={() => toggleNotifPref('walletPayments')} />
                      <Toggle label="Direct Messages" description="When someone sends you a chat message" value={notifPrefs.directMessages} onChange={() => toggleNotifPref('directMessages')} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">These preferences are saved on this device only — there's no server-side notification delivery filter yet.</p>
                    <button onClick={saveNotifPrefs} className="bg-primary hover:opacity-90 text-primary-foreground px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md">
                      <Save className="w-5 h-5" /> Save Preferences
                    </button>
                  </div>
                )}

                {/* HELP CENTER */}
                {activeSection === 'help' && (
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-lg font-bold text-foreground mb-4">Frequently Asked Questions</h3>
                      <div className="space-y-3 max-w-2xl">
                        {[
                          { q: 'How do I withdraw funds?', a: 'Once a client approves your submitted work, funds move from Escrow to your Wallet. You can then withdraw them to your verified bank account.' },
                          { q: 'Is my KYC data safe?', a: 'Yes. We use industry-standard encryption. Your Aadhaar and PAN are only used for mandatory compliance and never shared with clients.' },
                          { q: 'Can I change my account type?', a: 'Currently, you can act as both a Client and Freelancer by switching modes in your profile if enabled by an admin, or you can register a separate account.' },
                        ].map((faq, i) => (
                          <details key={i} className="group bg-background border border-border rounded-2xl p-5 cursor-pointer open:bg-primary/5 transition-colors">
                            <summary className="font-bold text-sm text-foreground flex justify-between items-center outline-none">
                              {faq.q}
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                            </summary>
                            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                          </details>
                        ))}
                      </div>
                    </section>

                    <section className="bg-muted/30 border border-border rounded-2xl p-6 sm:p-8 max-w-2xl">
                      <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                          <MessageSquare className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-foreground">Still need help?</h3>
                          <p className="text-muted-foreground text-sm mt-1 mb-4">Our support team is available 24/7 to assist you with any issues.</p>
                          <a href="mailto:support@workquora.com" className="bg-foreground text-background font-bold px-6 py-2.5 rounded-xl text-sm transition-all hover:opacity-90 inline-flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Contact Support
                          </a>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* DANGER ZONE — real backend endpoint (DELETE /auth/account) */}
                {activeSection === 'danger' && (
                  <div className="border border-red-200 dark:border-red-900/40 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/20 max-w-xl">
                    <h3 className="text-red-600 dark:text-red-400 font-semibold mb-2">Delete Account</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will permanently anonymize your account data. Active jobs must be completed or cancelled first.
                    </p>

                    {!showDeleteConfirm ? (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
                      >
                        Delete My Account
                      </motion.button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-foreground">Type DELETE to confirm:</p>
                        <input
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-red-300 dark:border-red-900/60 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Type DELETE here"
                        />
                        <div className="flex gap-3">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                            onClick={handleDeleteAccount}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Confirm Delete
                          </motion.button>
                          <button
                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                            className="px-4 py-2 border border-border rounded-lg text-sm text-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
