import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, User, Lock, Bell, Loader2, Camera, ShieldCheck,
  AlertTriangle, CheckCircle2, ChevronRight, HelpCircle,
  Mail, MessageSquare, Home, Shield, CreditCard, Plus,
  Trash2, Edit2, X, CheckCircle, MapPin, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useProfile } from '../../hooks/useProfile';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess, logout } from '../../actions/authSlice';
import api from '../../services/api';
import imageCompression from 'browser-image-compression';
import AdBanner from '../../components/shared/AdBanner';

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
  const navbarCity = useSelector((s) => s.client?.details?.currentLocation?.city);
  const [activeSection, setActiveSection] = useState('account');

  // Modals / Edit states
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isAadhaarModalOpen, setIsAadhaarModalOpen] = useState(false);
  const [isPanModalOpen, setIsPanModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);

  const [inputEmail, setInputEmail] = useState('');
  const [inputMobile, setInputMobile] = useState('');
  const [inputAadhaar, setInputAadhaar] = useState('');
  const [inputPan, setInputPan] = useState('');
  const [inputSkill, setInputSkill] = useState('');

  const [newBank, setNewBank] = useState({ bankName: '', accountNumber: '', ifscCode: '', isPrimary: false });

  const { useGetProfile, updateProfile, isUpdating, uploadPhoto, isUploading } = useProfile();
  const { data: profile, isLoading, refetch } = useGetProfile();

  const { register, handleSubmit, reset } = useForm();
  const [otpSent, setOtpSent] = useState(false);
  const [resettingPwd, setResettingPwd] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const kycStatus = profile?.kyc?.status;

  // Fetch Wallet bank accounts
  const { data: walletData, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet-details'],
    queryFn: () => api.get('/wallet/balance').then((r) => r.data?.data ?? {}),
  });

  const bankAccounts = walletData?.bankAccounts || [];

  useEffect(() => {
    const source = profile || user;
    if (source) {
      reset({
        name: source.name || '',
        username: source.username || '',
        title: source.title || '',
        bio: source.bio || '',
        skills: Array.isArray(source.skills) ? source.skills.join(', ') : (source.skills || ''),
        hourlyRate: source.hourlyRate || '',
        locationCity: source.location?.city || '',
        locationAddress: source.location?.address || '',
      });
      setTwoFactorEnabled(source.twoFactorEnabled || false);

      // Sync fresh profile state to Redux only when profile API returns
      if (profile) {
        const kycDone = !!(profile.isKycVerified || profile.kycVerified || (profile.kyc?.aadhaarVerified && profile.kyc?.panVerified));
        const hasPicChanged = profile.profilePic !== user?.profilePic || profile.avatar !== user?.avatar;
        if (kycDone !== user?.isKycVerified || hasPicChanged || profile.email !== user?.email || profile.mobileNumber !== user?.mobileNumber) {
          dispatch(loginSuccess({ 
            user: { 
              ...user, 
              isKycVerified: kycDone, 
              profilePic: profile.profilePic, 
              avatar: profile.avatar,
              email: profile.email,
              mobileNumber: profile.mobileNumber,
              title: profile.title,
            }, 
            token 
          }));
        }
      }
    }
  }, [profile, user?.id]); // eslint-disable-line

  const onProfileSubmit = (data) => {
    updateProfile(
      {
        name: data.name,
        username: data.username,
        title: data.title,
        bio: data.bio,
        skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        hourlyRate: Number(data.hourlyRate) || 0,
        city: data.locationCity || undefined,
        address: data.locationAddress || undefined,
      },
      {
        onSuccess: (res) => {
          const updatedUser = res?.data?.data ?? res?.data;
          if (updatedUser && token) dispatch(loginSuccess({ user: { ...user, ...updatedUser }, token }));
          refetch();
          toast.success('Basic profile updated!');
        },
      }
    );
  };

  const handleUpdateEmail = async () => {
    if (!inputEmail || !inputEmail.includes('@')) return toast.error('Enter a valid email address');
    try {
      await api.put('/profile/update', { email: inputEmail });
      toast.success('Email updated successfully!');
      setIsEmailModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update email.');
    }
  };

  const handleUpdateMobile = async () => {
    if (!inputMobile || inputMobile.length < 10) return toast.error('Enter a valid 10-digit mobile number');
    try {
      await api.put('/profile/update', { mobileNumber: inputMobile });
      toast.success('Mobile number updated successfully!');
      setIsMobileModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update mobile number.');
    }
  };

  const handleUpdateAadhaar = async () => {
    if (!inputAadhaar || !/^\d{12}$/.test(inputAadhaar)) return toast.error('Enter a valid 12-digit Aadhaar number');
    try {
      await api.post('/kyc/aadhaar/submit', { aadhaarNumber: inputAadhaar });
      toast.success('Aadhaar submitted & auto-verified!');
      setIsAadhaarModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update Aadhaar.');
    }
  };

  const handleUpdatePan = async () => {
    const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!inputPan || !regex.test(inputPan.toUpperCase())) return toast.error('Enter a valid 10-character PAN card number');
    try {
      await api.post('/kyc/pan/submit', { panNumber: inputPan.toUpperCase() });
      toast.success('PAN card submitted & auto-verified!');
      setIsPanModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update PAN.');
    }
  };

  const handleAddBankAccount = async () => {
    const { bankName, accountNumber, ifscCode, isPrimary } = newBank;
    if (!bankName || !accountNumber || !ifscCode) return toast.error('Please fill in all bank details');
    try {
      await api.post('/wallet/bank-account', { bankName, accountNumber, ifscCode, isPrimary });
      toast.success('Bank account linked successfully!');
      setIsBankModalOpen(false);
      setNewBank({ bankName: '', accountNumber: '', ifscCode: '', isPrimary: false });
      refetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add bank account.');
    }
  };

  const handleRemoveBankAccount = async (bankId) => {
    if (!window.confirm('Are you sure you want to remove this bank account?')) return;
    try {
      await api.delete(`/wallet/bank-account/${bankId}`);
      toast.success('Bank account removed successfully!');
      refetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove bank account.');
    }
  };

  const handleAddSkill = () => {
    if (!inputSkill) return;
    const currentSkills = profile?.skills || user?.skills || [];
    if (currentSkills.includes(inputSkill.trim())) {
      toast.error('Skill already exists!');
      return;
    }
    const updatedSkills = [...currentSkills, inputSkill.trim()];
    updateProfile(
      { skills: updatedSkills },
      {
        onSuccess: () => {
          setInputSkill('');
          setIsSkillModalOpen(false);
          refetch();
        }
      }
    );
  };

  const handleRemoveSkill = (skillToRemove) => {
    const currentSkills = profile?.skills || user?.skills || [];
    const updatedSkills = currentSkills.filter(s => s !== skillToRemove);
    updateProfile(
      { skills: updatedSkills },
      { onSuccess: () => refetch() }
    );
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
      await api.post('/auth/forgot-password', { email: profile?.email || user?.email });
      setOtpSent(true);
      toast.success('OTP sent to your email to reset password.');
    } catch {
      toast.error('Failed to request reset. Try logging out and using Forgot Password.');
    } finally {
      setResettingPwd(false);
    }
  };

  // ── Privacy — GET/PUT /settings/privacy ──
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

  // ── Notifications — persisted locally ──
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

  // ── Danger zone — DELETE /auth/account ──
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
  const activeUser = profile || user;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-background transition-colors duration-300">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Account Settings</h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-2xl">Manage your professional profile and security preferences.</p>
        </div>
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
                {s.id === 'kyc' && activeUser?.isKycVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                {s.id === 'kyc' && !activeUser?.isKycVerified && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
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
                {/* ACCOUNT SECTION OVERHAUL */}
                {activeSection === 'account' && (
                  <div className="space-y-8">
                    
                    {/* Card 1: Personal Details */}
                    <div className="bg-slate-900/30 dark:bg-[#07070c] border border-border rounded-3xl p-6 sm:p-8 space-y-6">
                      <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-3">
                        <User className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-foreground">Personal Details</h3>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
                        {/* Left: Profile Pic & Info */}
                        <div className="flex items-center gap-4">
                          <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-3xl font-bold overflow-hidden text-white shadow-inner border-2 border-primary">
                              {activeUser?.profilePic || activeUser?.avatar ? (
                                <img src={activeUser.profilePic || activeUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                activeUser?.name?.[0]?.toUpperCase() || 'U'
                              )}
                            </div>
                            <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white backdrop-blur-sm">
                              {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Edit2 className="w-5 h-5" />}
                              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={isUploading} />
                            </label>
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xl text-foreground">{activeUser?.name || 'Your Name'}</h4>
                            <p className="text-primary font-semibold text-sm mt-0.5">{activeUser?.title || 'Expert Developer'}</p>
                            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1.5 font-medium">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{navbarCity || activeUser?.location?.city || activeUser?.location?.address || 'Bhopal, MP'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Email & Phone */}
                        <div className="w-full md:w-auto flex-1 max-w-md space-y-4">
                          {/* Email Box */}
                          <div className="border border-border/80 bg-background/50 rounded-2xl p-4 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</span>
                              <p className="text-sm font-semibold text-foreground truncate mt-0.5">{activeUser?.email || 'Not verified'}</p>
                            </div>
                            <button
                              onClick={() => { setInputEmail(activeUser?.email || ''); setIsEmailModalOpen(true); }}
                              className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition-all border-none cursor-pointer"
                            >
                              Update
                            </button>
                          </div>

                          {/* Mobile Box */}
                          <div className="border border-border/80 bg-background/50 rounded-2xl p-4 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mobile Number</span>
                              <p className="text-sm font-semibold text-foreground truncate mt-0.5">{activeUser?.mobileNumber ? `+91 ${activeUser.mobileNumber}` : 'Not set'}</p>
                            </div>
                            <button
                              onClick={() => { setInputMobile(activeUser?.mobileNumber || ''); setIsMobileModalOpen(true); }}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                                activeUser?.isMobileVerified
                                  ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                                  : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white'
                              }`}
                            >
                              {activeUser?.isMobileVerified ? 'Verified' : 'Verify'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Skills section */}
                      {activeUser?.role !== 'CLIENT' && (
                        <div className="pt-4 border-t border-border/40">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">Expertise & Skills</span>
                            <button
                              onClick={() => { setInputSkill(''); setIsSkillModalOpen(true); }}
                              className="flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer border-none bg-transparent"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Skill
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {(activeUser?.skills || []).map((skill) => (
                              <div
                                key={skill}
                                onClick={() => handleRemoveSkill(skill)}
                                className="group flex items-center gap-1.5 px-3 py-1.5 bg-accent/40 border border-border hover:border-red-500/30 hover:bg-red-500/10 rounded-full text-xs font-semibold text-foreground hover:text-red-500 transition-all cursor-pointer"
                                title="Click to remove skill"
                              >
                                <span>{skill}</span>
                                <X className="w-3 h-3 text-muted-foreground group-hover:text-red-500 transition-colors" />
                              </div>
                            ))}
                            {(activeUser?.skills || []).length === 0 && (
                              <p className="text-xs text-muted-foreground">No skills added yet.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card 2: Identity Verification */}
                    <div className="bg-slate-900/30 dark:bg-[#07070c] border border-border rounded-3xl p-6 sm:p-8 space-y-6">
                      <div className="flex items-center justify-between border-b border-border/40 pb-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-bold text-foreground">Identity Verification</h3>
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          activeUser?.isKycVerified
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {activeUser?.isKycVerified ? 'Verified Profile' : 'Pending Verification'}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6">
                        {/* Aadhaar card */}
                        <div className="bg-background/50 border border-border/80 rounded-2xl p-5 flex items-start gap-4">
                          <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Aadhaar Number</span>
                            <p className="text-sm font-bold text-foreground mt-0.5 truncate">{activeUser?.maskedAadhaar || '**** **** ****'}</p>
                            <button
                              onClick={() => { setInputAadhaar(''); setIsAadhaarModalOpen(true); }}
                              className="mt-3 text-xs text-primary font-bold hover:underline cursor-pointer border-none bg-transparent"
                            >
                              Update
                            </button>
                          </div>
                        </div>

                        {/* PAN card */}
                        <div className="bg-background/50 border border-border/80 rounded-2xl p-5 flex items-start gap-4">
                          <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PAN Card</span>
                            <p className="text-sm font-bold text-foreground mt-0.5 truncate">{activeUser?.maskedPan || '**********'}</p>
                            <button
                              onClick={() => { setInputPan(''); setIsPanModalOpen(true); }}
                              className="mt-3 text-xs text-primary font-bold hover:underline cursor-pointer border-none bg-transparent"
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80 font-medium pt-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Your identity details are encrypted and stored securely according to our Privacy Policy.</span>
                      </div>
                    </div>

                    {/* Card 3: Linked Bank Accounts */}
                    <div className="bg-slate-900/30 dark:bg-[#07070c] border border-border rounded-3xl p-6 sm:p-8 space-y-6">
                      <div className="flex items-center justify-between border-b border-border/40 pb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-bold text-foreground">Linked Bank Accounts</h3>
                        </div>
                        <button
                          onClick={() => { setIsBankModalOpen(true); }}
                          className="flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer border-none bg-transparent"
                        >
                          <Plus className="w-3.5 h-3.5" /> Link Bank Account
                        </button>
                      </div>

                      <div className="space-y-4">
                        {bankAccounts.map((account) => (
                          <div key={account._id} className="bg-background/50 border border-border/80 rounded-2xl p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
                                <CreditCard className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-foreground">{account.bankName}</h4>
                                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                    account.isPrimary ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {account.isPrimary ? 'Primary' : 'Secondary'}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Account: <span className="text-foreground font-semibold">{account.accountEnding}</span> • IFSC: <span className="text-foreground font-semibold">{account.ifscCode || 'N/A'}</span>
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemoveBankAccount(account._id)}
                              className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border-none cursor-pointer shrink-0"
                              title="Remove Bank Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        {bankAccounts.length === 0 && (
                          <div className="text-center py-8">
                            <CreditCard className="w-8 h-8 text-muted-foreground opacity-30 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground font-medium">No bank accounts linked yet.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Standard Profile Fields Update Form (Below) */}
                    <div className="bg-slate-900/30 dark:bg-[#07070c] border border-border rounded-3xl p-6 sm:p-8 space-y-6">
                      <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-3">
                        <Edit2 className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-foreground">General Info</h3>
                      </div>

                      <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-6">
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

                        {activeUser?.role !== 'CLIENT' && (
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Professional Title</label>
                            <input {...register('title')} placeholder="e.g. Senior Frontend Developer" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                          </div>
                        )}

                        <div className="grid sm:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">City</label>
                            <input {...register('locationCity')} placeholder="Bangalore" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Hourly Rate (₹)</label>
                            <input {...register('hourlyRate')} type="number" placeholder="500" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">About You</label>
                          <textarea {...register('bio')} rows="4" placeholder="Briefly describe your experience or business..." className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary resize-none transition-colors text-sm" />
                        </div>

                        <div className="flex justify-end pt-4">
                          <button type="submit" disabled={isUpdating} className="bg-primary hover:opacity-90 text-primary-foreground px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 cursor-pointer border-none">
                            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {isUpdating ? 'Saving...' : 'Save Profile'}
                          </button>
                        </div>
                      </form>
                    </div>

                  </div>
                )}

                {/* PRIVACY */}
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

                {/* KYC (Standard card fallback) */}
                {activeSection === 'kyc' && (
                  <div className="bg-slate-900/10 dark:bg-[#0d0d15] border border-border rounded-2xl p-6">
                    <p className="text-sm text-muted-foreground">Verification state linked in Account section. Proceed to verify details there.</p>
                  </div>
                )}

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
                            className="bg-primary hover:opacity-90 text-primary-foreground font-bold px-6 py-2.5 rounded-xl text-sm transition-all border-none cursor-pointer">
                            Proceed to Login to Reset
                          </button>
                        </div>
                      ) : (
                        <button onClick={handleRequestPasswordReset} disabled={resettingPwd} className="border border-border bg-background hover:bg-muted text-foreground font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer">
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
                          onChange={() => {
                            const newVal = !twoFactorEnabled;
                            setTwoFactorEnabled(newVal);
                            updateProfile({ twoFactorEnabled: newVal });
                          }}
                        />
                      </div>
                    </section>
                  </div>
                )}

                {/* NOTIFICATIONS */}
                {activeSection === 'notifications' && (
                  <div className="max-w-xl">
                    <div className="bg-background border border-border rounded-2xl px-5 mb-4">
                      <Toggle label="Job Matches" description="Alerts when a job matches your skills and location" value={notifPrefs.jobMatches} onChange={() => toggleNotifPref('jobMatches')} />
                      <Toggle label="Application Updates" description="When a client accepts or rejects your proposal" value={notifPrefs.applicationUpdates} onChange={() => toggleNotifPref('applicationUpdates')} />
                      <Toggle label="Wallet & Payments" description="When funds are added or withdrawn" value={notifPrefs.walletPayments} onChange={() => toggleNotifPref('walletPayments')} />
                      <Toggle label="Direct Messages" description="When someone sends you a chat message" value={notifPrefs.directMessages} onChange={() => toggleNotifPref('directMessages')} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">These preferences are saved on this device only — there's no server-side notification delivery filter yet.</p>
                    <button onClick={saveNotifPrefs} className="bg-primary hover:opacity-90 text-primary-foreground px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border-none cursor-pointer shadow-md">
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
                          <a href="mailto:support@workquora.com" className="bg-foreground text-background font-bold px-6 py-2.5 rounded-xl text-sm transition-all hover:opacity-90 inline-flex items-center gap-2 no-underline">
                            <Mail className="w-4 h-4" /> Contact Support
                          </a>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* DANGER ZONE */}
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
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium border-none cursor-pointer"
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
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed border-none cursor-pointer"
                          >
                            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Confirm Delete
                          </motion.button>
                          <button
                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                            className="px-4 py-2 border border-border rounded-lg text-sm text-foreground bg-transparent cursor-pointer"
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

      {/* ── MODALS CONTAINER ── */}

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsEmailModalOpen(false)} className="absolute top-4 right-4 p-1.5 hover:bg-muted rounded-full border-none bg-transparent cursor-pointer">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            <h3 className="text-lg font-bold text-foreground mb-1">Update Email Address</h3>
            <p className="text-xs text-muted-foreground mb-4">Enter your new email address. Changes will sync immediately.</p>
            <input
              type="email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="e.g. name@example.com"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsEmailModalOpen(false)} className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold bg-transparent cursor-pointer">Cancel</button>
              <button onClick={handleUpdateEmail} className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold border-none cursor-pointer">Save Email</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Modal */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsMobileModalOpen(false)} className="absolute top-4 right-4 p-1.5 hover:bg-muted rounded-full border-none bg-transparent cursor-pointer">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            <h3 className="text-lg font-bold text-foreground mb-1">Update Mobile Number</h3>
            <p className="text-xs text-muted-foreground mb-4">Enter your new 10-digit mobile number.</p>
            <div className="flex gap-2 mb-4">
              <span className="flex items-center px-3.5 bg-muted border border-border rounded-xl text-sm font-semibold text-muted-foreground">+91</span>
              <input
                type="tel"
                maxLength={10}
                value={inputMobile}
                onChange={(e) => setInputMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="99999 99999"
                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsMobileModalOpen(false)} className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold bg-transparent cursor-pointer">Cancel</button>
              <button onClick={handleUpdateMobile} className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold border-none cursor-pointer">Save Number</button>
            </div>
          </div>
        </div>
      )}

      {/* Aadhaar Modal */}
      {isAadhaarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsAadhaarModalOpen(false)} className="absolute top-4 right-4 p-1.5 hover:bg-muted rounded-full border-none bg-transparent cursor-pointer">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            <h3 className="text-lg font-bold text-foreground mb-1">Link Aadhaar Number</h3>
            <p className="text-xs text-muted-foreground mb-4">Enter your 12-digit Aadhaar card number. Verified instantly.</p>
            <input
              type="text"
              maxLength={12}
              value={inputAadhaar}
              onChange={(e) => setInputAadhaar(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 123456789012"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsAadhaarModalOpen(false)} className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold bg-transparent cursor-pointer">Cancel</button>
              <button onClick={handleUpdateAadhaar} className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold border-none cursor-pointer">Verify Aadhaar</button>
            </div>
          </div>
        </div>
      )}

      {/* PAN Modal */}
      {isPanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsPanModalOpen(false)} className="absolute top-4 right-4 p-1.5 hover:bg-muted rounded-full border-none bg-transparent cursor-pointer">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            <h3 className="text-lg font-bold text-foreground mb-1">Link PAN Card</h3>
            <p className="text-xs text-muted-foreground mb-4">Enter your 10-character alphanumeric PAN Card number.</p>
            <input
              type="text"
              maxLength={10}
              value={inputPan}
              onChange={(e) => setInputPan(e.target.value.toUpperCase())}
              placeholder="e.g. ABCDE1234F"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary mb-4 tracking-widest font-mono uppercase"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsPanModalOpen(false)} className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold bg-transparent cursor-pointer">Cancel</button>
              <button onClick={handleUpdatePan} className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold border-none cursor-pointer">Verify PAN</button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Add Modal */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsSkillModalOpen(false)} className="absolute top-4 right-4 p-1.5 hover:bg-muted rounded-full border-none bg-transparent cursor-pointer">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            <h3 className="text-lg font-bold text-foreground mb-1">Add New Skill</h3>
            <p className="text-xs text-muted-foreground mb-4">Add a professional skill tag to showcase on your profile.</p>
            <input
              type="text"
              value={inputSkill}
              onChange={(e) => setInputSkill(e.target.value)}
              placeholder="e.g. React Native, Go, Python"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsSkillModalOpen(false)} className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold bg-transparent cursor-pointer">Cancel</button>
              <button onClick={handleAddSkill} className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold border-none cursor-pointer">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Link Bank Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsBankModalOpen(false)} className="absolute top-4 right-4 p-1.5 hover:bg-muted rounded-full border-none bg-transparent cursor-pointer">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            <h3 className="text-lg font-bold text-foreground mb-1">Link Bank Account</h3>
            <p className="text-xs text-muted-foreground mb-6">Enter bank details to verify and connect to your payouts.</p>
            
            <div className="space-y-4 mb-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Bank Name</label>
                <input
                  type="text"
                  value={newBank.bankName}
                  onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                  placeholder="e.g. State Bank of India"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Account Number</label>
                <input
                  type="text"
                  value={newBank.accountNumber}
                  onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 501002345678"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">IFSC Code</label>
                <input
                  type="text"
                  maxLength={11}
                  value={newBank.ifscCode}
                  onChange={(e) => setNewBank({ ...newBank, ifscCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. SBIN0001234"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary uppercase font-mono"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={newBank.isPrimary}
                  onChange={(e) => setNewBank({ ...newBank, isPrimary: e.target.checked })}
                  className="accent-primary"
                />
                <span className="text-xs font-semibold text-foreground">Make this account primary</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setIsBankModalOpen(false)} className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold bg-transparent cursor-pointer">Cancel</button>
              <button onClick={handleAddBankAccount} className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold border-none cursor-pointer">Link Account</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
