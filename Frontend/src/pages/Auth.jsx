import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Briefcase, User, Loader2, ShieldCheck, Zap, Globe, Check, CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import api from '../services/api';
import { slideInRight } from '../utils/animations';

/* ---- Schemas ---- */
const loginSchema = z.object({
  email:    z.string().min(3, 'Username or Email is too short').refine((val) => {
    const isEmail = z.string().email().safeParse(val).success;
    const isUsername = /^[a-zA-Z0-9_]{3,}$/.test(val);
    return isEmail || isUsername;
  }, { message: 'Must be a valid email or username' }),
  password: z.string().min(6, 'Min 6 characters'),
});
const registerSchema = z.object({
  name:     z.string().min(2, 'Name required'),
  email:    z.string().email('Invalid email'),
  mobileNumber: z.string().regex(/^\d{10}$/, 'Must be exactly 10 digits'),
  username: z.string().min(3, 'Min 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and underscores only'),
  password: z.string().min(6, 'Min 6 characters'),
  gender:   z.enum(['MALE', 'FEMALE', 'OTHER'], { required_error: 'Gender is required' }),
});

/* ---- Live-feedback regexes (additive UI layer on top of the zod schemas above) ---- */
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^[6-9]\d{9}$/;
const nameRegex = /^[a-zA-Z\s]{2,50}$/;

/* ---- Google SDK loader ---- */
const loadGoogleSDK = () =>
  new Promise((resolve) => {
    if (window.google) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = resolve;
    document.body.appendChild(s);
  });

/* ---- Facebook SDK loader ---- */
const loadFacebookSDK = () =>
  new Promise((resolve) => {
    if (window.FB) { resolve(); return; }
    window.fbAsyncInit = () => {
      window.FB.init({ appId: import.meta.env.VITE_FACEBOOK_APP_ID, cookie: true, xfbml: true, version: 'v20.0' });
      resolve();
    };
    const s = document.createElement('script');
    s.src = 'https://connect.facebook.net/en_US/sdk.js';
    document.body.appendChild(s);
  });

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [selectedRole, setSelectedRole] = useState('FREELANCER');
  
  // Registration Flow State
  const [isRegistrationOtpSent, setIsRegistrationOtpSent] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');

  const [regOtp, setRegOtp] = useState('');
  const [shake, setShake] = useState(false);

  // Consent — must be explicitly checked by the user, never pre-checked.
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const {
    login, isLoggingIn, isLoginSuccess,
    register, registerAsync, isRegistering,
    verifyRegistration, isVerifyingRegistration, isVerifyRegistrationSuccess,
    socialLogin, isSocialLoading,
  } = useAuth();

  // Registration completes here (email OTP verified) — celebrate once.
  useEffect(() => {
    if (!isVerifyRegistrationSuccess) return;
    confetti({ particleCount: 60, spread: 70, colors: ['#1E00A9', '#6366F1', '#10B981'], origin: { y: 0.6 } });
  }, [isVerifyRegistrationSuccess]);

  const { register: formReg, handleSubmit, reset, watch, setValue, formState: { errors, touchedFields } } = useForm({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
    defaultValues: { gender: 'MALE' }
  });

  const usernameValue = watch('username');
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking', 'available', 'taken', 'invalid', null
  const [selectedGender, setSelectedGender] = useState('MALE');
  const [showPassword, setShowPassword] = useState(false);

  // Live-feedback validity — layered on top of the zod schemas, doesn't change submit-time validation.
  const emailValue = watch('email');
  const nameValue = watch('name');
  const mobileValue = watch('mobileNumber');
  const passwordValue = watch('password');

  // The shared "email" field doubles as email-or-username on Login, so its live-valid
  // check must accept both there — a strict email-only regex would wrongly red-X a valid username.
  const emailValid = isLogin
    ? (z.string().email().safeParse(emailValue || '').success || /^[a-zA-Z0-9_]{3,}$/.test(emailValue || ''))
    : emailRegex.test(emailValue || '');
  const emailTouched = !!touchedFields.email;

  const nameValid = nameRegex.test(nameValue || '');
  const nameTouched = !!touchedFields.name;

  const phoneValid = phoneRegex.test(mobileValue || '');
  const phoneTouched = !!touchedFields.mobileNumber;

  const isSubmitBlocked = !isLogin && (!emailValid || (passwordValue || '').length < 6 || !phoneValid || !agreedToTerms || !agreedToPrivacy);

  useEffect(() => {
    if (isLogin || !usernameValue || usernameValue.length < 3) {
      setUsernameStatus(null);
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(usernameValue)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await api.get('/auth/check-username', { params: { username: usernameValue } });
        if (res.data?.available) {
          setUsernameStatus('available');
        } else {
          setUsernameStatus('taken');
        }
      } catch {
        setUsernameStatus(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [usernameValue, isLogin]);

  useEffect(() => {
    if (!isLogin) {
      setValue('gender', 'MALE');
    }
  }, [isLogin, setValue]);

  useEffect(() => {
    loadGoogleSDK();
    loadFacebookSDK();
  }, []);

  const onValidationError = () => setShake(true);

  const onSubmit = async (data) => {
    if (isLogin) {
      login({ email: data.email, password: data.password });
    } else {
      if (usernameStatus === 'taken') {
        toast.error('Please choose a unique username');
        return;
      }
      if (!agreedToTerms || !agreedToPrivacy) {
        toast.error('Please agree to the Terms of Service and Privacy Policy');
        return;
      }
      try {
        const response = await registerAsync({ name: data.name, email: data.email, mobileNumber: data.mobileNumber, username: data.username, password: data.password, role: selectedRole, gender: data.gender, agreedToTerms, agreedToPrivacy });
        if (response?.data?.success === true && response?.data?.emailSent === true) {
          setRegistrationEmail(data.email);
          setIsRegistrationOtpSent(true);
        }
      } catch (error) {
        // Mutation level onError inside useAuth.js handles toast notification.
        // Catch here to prevent uncaught promise rejection warning in console.
      }
    }
  };

  const handleVerifyRegistration = (e) => {
    e.preventDefault();
    verifyRegistration({ email: registrationEmail, otp: regOtp });
  };

  const handleResendRegistrationOtp = async () => {
    try {
      const res = await api.post('/auth/resend-otp', { email: registrationEmail });
      if (res.data?.success) {
        toast.success('A new OTP has been sent to your email.');
      } else {
        toast.error(res.data?.message || 'Failed to resend OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsResetting(true);
    try {
      if (!otpSent) {
        await api.post('/auth/forgot-password', { email: forgotEmail });
        setOtpSent(true);
        toast.success('OTP sent to your email!');
      } else {
        await api.post('/auth/reset-password', { email: forgotEmail, otp, newPassword });
        toast.success('Password reset successfully!');
        setIsForgotPassword(false);
        setOtpSent(false);
        setForgotEmail('');
        setOtp('');
        setNewPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsResetting(false);
    }
  };



  /* Google Login */
  const handleGoogleLogin = () => {
    if (!window.google) {
      toast.error('Google SDK not loaded. Please refresh.');
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          toast.error('Google sign-in failed. Please try again.');
          return;
        }
        try {
          const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          const info = await infoRes.json();
          if (!info.email) {
            toast.error('Could not retrieve Google account info.');
            return;
          }
          socialLogin({
            provider: 'google',
            token: tokenResponse.access_token,
            tokenType: 'access_token',
            email: info.email,
            name: info.name,
            avatar: info.picture,
          });
        } catch {
          toast.error('Google sign-in error. Please try again.');
        }
      },
    });
    client.requestAccessToken();
  };

  /* Facebook Login */
  const handleFacebookLogin = () => {
    if (!window.FB) return;
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          window.FB.api('/me', { fields: 'name,email,picture' }, (data) => {
            socialLogin({ provider: 'facebook', email: data.email, name: data.name, avatar: data.picture?.data?.url });
          });
        }
      },
      { scope: 'email' }
    );
  };

  const switchTab = (toLogin) => {
    setIsLogin(toLogin);
    setIsForgotPassword(false);
    setIsRegistrationOtpSent(false);
    setAgreedToTerms(false);
    setAgreedToPrivacy(false);
    reset();
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      
      {/* LEFT SIDE: Brand & Trust Building (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 flex-col justify-between p-12 relative overflow-hidden border-r border-border">
        {/* Decorative Blurs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 font-extrabold text-3xl tracking-tight text-foreground hover:opacity-90 transition-opacity">
            <Logo className="w-10 h-10" textClassName="text-3xl" />
          </Link>
          <h1 className="mt-12 text-5xl font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            Connecting Talent with Opportunity.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
            Join thousands of professionals finding meaningful work, hiring top local talent, and building successful collaborations every single day.
          </p>

          <div className="mt-12 space-y-6">
            {[
              { icon: ShieldCheck, title: "100% Secure & Verified", desc: "All users are identity and payment verified to ensure a trustworthy environment." },
              { icon: Zap, title: "Lightning Fast Matching", desc: "Our AI-driven engine connects clients with the best local freelancers instantly." },
              { icon: Globe, title: "Local & Global Reach", desc: "Find opportunities right in your neighborhood or work with clients worldwide." }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="p-3 bg-card border border-border rounded-xl shadow-sm text-primary">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} WorkQuora Inc. All rights reserved.</p>
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 relative">
        <motion.div
          variants={slideInRight}
          initial="hidden"
          animate="visible"
          className="max-w-md w-full bg-card p-6 sm:p-8 md:p-10 rounded-3xl border border-border shadow-xl relative z-10"
        >

          {/* Mobile Logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight">
              {isLogin ? 'Welcome Back!' : 'Create an Account'}
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              {isLogin ? 'Sign in to your WorkQuora account.' : 'Join our vibrant professional network today.'}
            </p>
          </div>

          {/* Tab Toggle */}
          {!isForgotPassword && (
            <div className="flex bg-muted p-1 rounded-xl mb-8 border border-border">
              {[['Log In', true], ['Sign Up', false]].map(([label, val]) => (
                <button key={label} onClick={() => switchTab(val)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isLogin === val ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address</label>
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="you@example.com" disabled={otpSent}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50" required />
              </div>

              {otpSent && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Enter OTP</label>
                    <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit OTP"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors" required minLength={6} />
                  </div>
                </>
              )}

              <button type="submit" disabled={isResetting}
                className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20">
                {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : (otpSent ? 'Reset Password' : 'Send OTP')}
              </button>
              <button type="button" onClick={() => { setIsForgotPassword(false); setOtpSent(false); }}
                className="w-full text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mt-2">
                Back to Login
              </button>
            </form>
          ) : isRegistrationOtpSent ? (
            <form onSubmit={handleVerifyRegistration} className="space-y-5">
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground bg-primary/10 border border-primary/20 rounded-xl p-4">
                  We've sent a 6-digit OTP to <span className="font-bold">{registrationEmail}</span>. It will expire in 10 minutes.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Enter Registration OTP</label>
                <input type="text" value={regOtp} onChange={e => setRegOtp(e.target.value)} placeholder="6-digit OTP"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors tracking-widest font-mono" required />
              </div>
              <button type="submit" disabled={isVerifyingRegistration || isVerifyRegistrationSuccess}
                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isVerifyRegistrationSuccess ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground shadow-primary/20'
                }`}>
                {isVerifyRegistrationSuccess ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} className="flex items-center gap-2">
                    <Check className="w-5 h-5" /> Welcome to WorkQuora!
                  </motion.span>
                ) : isVerifyingRegistration ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Verify & Create Account'
                )}
              </button>
              <div className="flex flex-col gap-2.5 mt-2">
                <button type="button" onClick={handleResendRegistrationOtp}
                  className="w-full text-sm font-bold text-primary hover:underline transition-all">
                  Resend OTP
                </button>
                <button type="button" onClick={() => setIsRegistrationOtpSent(false)}
                  className="w-full text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                  Back to Registration
                </button>
              </div>
            </form>
          ) : (
            <>
              <motion.form
                onSubmit={handleSubmit(onSubmit, onValidationError)}
                animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                onAnimationComplete={() => setShake(false)}
                className="space-y-5">
              {/* Role Selector (register only) */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Join as</label>
                <div className="flex gap-4">
                  {[
                    { role:'CLIENT',     Icon: Briefcase, label:'Client',     sub:'I want to hire',  color:'primary' },
                    { role:'FREELANCER', Icon: User,      label:'Freelancer', sub:'I want work',     color:'emerald' },
                  ].map(({ role, Icon, label, sub, color }) => (
                    <button key={role} type="button" onClick={() => setSelectedRole(role)}
                      className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all ${
                        selectedRole === role
                          ? color === 'primary' ? 'border-primary bg-primary/10 text-primary' : 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                      }`}>
                      <Icon className="w-6 h-6 mb-2" />
                      <span className="font-bold text-sm">{label}</span>
                      <span className="text-[10px] opacity-70 mt-0.5">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <input {...formReg('name')} placeholder="John Doe"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-10 text-foreground text-sm focus:outline-none focus:border-primary transition-colors" />
                    <AnimatePresence>
                      {nameTouched && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {nameValid
                            ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                            : <XCircle className="w-4 h-4 text-red-500" />
                          }
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {nameTouched && !nameValid && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> Letters and spaces only, min 2 characters
                    </p>
                  )}
                  {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name.message}</p>}
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Username</label>
                  <div className="relative">
                    <input {...formReg('username')} placeholder="johndoe123"
                      className={`w-full bg-background border rounded-xl px-4 py-3 pr-10 text-foreground text-sm focus:outline-none focus:border-primary transition-colors ${
                        usernameStatus === 'available' ? 'border-emerald-500/50' : usernameStatus === 'taken' ? 'border-red-500/50' : 'border-border'
                      }`} />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                      {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                      {usernameStatus === 'available' && <span className="text-emerald-500 font-bold text-base">✓</span>}
                      {usernameStatus === 'taken' && <span className="text-red-500 font-bold text-base">✗</span>}
                    </div>
                  </div>
                  {usernameStatus === 'available' && <p className="text-emerald-500 text-[10px] mt-1 font-semibold">Username is available</p>}
                  {usernameStatus === 'taken' && <p className="text-red-500 text-[10px] mt-1 font-semibold">Username is already taken</p>}
                  {usernameStatus === 'invalid' && <p className="text-amber-500 text-[10px] mt-1 font-semibold">Only letters, numbers, and underscores allowed</p>}
                  {errors.username && <p className="text-red-500 text-xs mt-1 font-medium">{errors.username.message}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <input type="tel" {...formReg('mobileNumber')} placeholder="9999999999" maxLength={10}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-10 text-foreground text-sm focus:outline-none focus:border-primary transition-colors" />
                    <AnimatePresence>
                      {phoneTouched && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {phoneValid
                            ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                            : <XCircle className="w-4 h-4 text-red-500" />
                          }
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {phoneTouched && !phoneValid && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> Must be a valid 10-digit Indian mobile number
                    </p>
                  )}
                  {errors.mobileNumber && <p className="text-red-500 text-xs mt-1 font-medium">{errors.mobileNumber.message}</p>}
                </div>

                {/* Gender Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Gender</label>
                  <div className="flex gap-3">
                    {[
                      { val: 'MALE', label: 'Male' },
                      { val: 'FEMALE', label: 'Female' },
                      { val: 'OTHER', label: 'Other' },
                    ].map((g) => (
                      <button
                        key={g.val}
                        type="button"
                        onClick={() => {
                          setSelectedGender(g.val);
                          setValue('gender', g.val);
                        }}
                        className={`flex-1 py-3 px-2 rounded-xl border-2 font-bold text-sm transition-all ${
                          selectedGender === g.val
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email or Username</label>
              <div className="relative">
                <input type="text" {...formReg('email')} placeholder="you@example.com or username"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-10 text-foreground text-sm focus:outline-none focus:border-primary transition-colors" />
                <AnimatePresence>
                  {emailTouched && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {emailValid
                        ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                        : <XCircle className="w-4 h-4 text-red-500" />
                      }
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence>
                {emailTouched && !emailValid && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-red-500 mt-1 flex items-center gap-1 overflow-hidden"
                  >
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {isLogin ? 'Please enter a valid email or username' : 'Please enter a valid email address'}
                  </motion.p>
                )}
                {emailTouched && emailValid && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-emerald-500 mt-1 overflow-hidden"
                  >
                    ✓ Looks good!
                  </motion.p>
                )}
              </AnimatePresence>
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                {isLogin && <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-primary font-bold hover:underline">Forgot?</button>}
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} {...formReg('password')} placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-10 text-foreground text-sm focus:outline-none focus:border-primary transition-colors" />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>

            {!isLogin && (
              <div className="space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 shrink-0 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground leading-snug">
                    I have read and agree to the{' '}
                    <a href="https://workquora.com/terms" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">
                      Terms of Service
                    </a>
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToPrivacy}
                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 shrink-0 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground leading-snug">
                    I have read and agree to the{' '}
                    <a href="https://workquora.com/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
              </div>
            )}

            <motion.button type="submit" disabled={isLoggingIn || isRegistering || isLoginSuccess || isSubmitBlocked}
              whileHover={!isSubmitBlocked ? { scale: 1.02 } : {}}
              className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                isLoginSuccess ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-primary hover:opacity-90 text-primary-foreground shadow-primary/20'
              } ${isSubmitBlocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              {isLoginSuccess ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} className="flex items-center gap-2">
                  <Check className="w-5 h-5" /> Welcome back!
                </motion.span>
              ) : isLoggingIn || isRegistering ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account →'
              )}
            </motion.button>
          </motion.form>

          {/* Social Auth */}
          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-4 text-muted-foreground font-bold uppercase tracking-wider">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button type="button" onClick={handleGoogleLogin} disabled={isSocialLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#EA4335]/10 border border-[#EA4335]/20 text-[#EA4335] rounded-xl hover:bg-[#EA4335]/20 transition-colors font-semibold text-sm cursor-pointer disabled:opacity-50">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z" />
                <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z" />
                <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558l3.793 2.987z" />
                <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z" />
              </svg>
              Sign in with Google
            </button>
            <button type="button" onClick={handleFacebookLogin} disabled={isSocialLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#1877F2]/10 border border-[#1877F2]/20 text-[#1877F2] rounded-xl hover:bg-[#1877F2]/20 transition-colors font-semibold text-sm cursor-pointer disabled:opacity-50">
              <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>
          </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;