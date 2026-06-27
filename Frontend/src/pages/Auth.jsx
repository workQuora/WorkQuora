import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Toaster } from 'react-hot-toast';
import { Briefcase, User, MapPin, Loader2, ShieldCheck, Zap, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import api from '../services/api';

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
  const [isMobileOtpSent, setIsMobileOtpSent] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  
  const [regOtp, setRegOtp] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');

  const { login, isLoggingIn, register, isRegistering, verifyRegistration, isVerifyingRegistration, verifyMobile, isVerifyingMobile, socialLogin, isSocialLoading } = useAuth();

  const { register: formReg, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
    defaultValues: { gender: 'MALE' }
  });

  const usernameValue = watch('username');
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking', 'available', 'taken', 'invalid', null
  const [selectedGender, setSelectedGender] = useState('MALE');

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

  useEffect(() => { loadGoogleSDK(); loadFacebookSDK(); }, []);

  const onSubmit = (data) => {
    if (isLogin) {
      login({ email: data.email, password: data.password });
    } else {
      if (usernameStatus === 'taken') {
        toast.error('Please choose a unique username');
        return;
      }
      setRegistrationEmail(data.email);
      register({ name: data.name, email: data.email, mobileNumber: data.mobileNumber, username: data.username, password: data.password, role: selectedRole, gender: data.gender }, {
        onSuccess: () => setIsRegistrationOtpSent(true)
      });
    }
  };

  const handleVerifyRegistration = (e) => {
    e.preventDefault();
    verifyRegistration({ email: registrationEmail, otp: regOtp }, {
      onSuccess: () => {
        setIsRegistrationOtpSent(false);
        setIsMobileOtpSent(true);
      }
    });
  };

  const handleVerifyMobile = (e) => {
    e.preventDefault();
    verifyMobile({ email: registrationEmail, otp: mobileOtp });
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

  /* Google One-Tap */
  const handleGoogleLogin = () => {
    if (!window.google) return;
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'email profile',
      callback: async (tokenResponse) => {
        const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const info = await infoRes.json();
        socialLogin({ provider: 'google', email: info.email, name: info.name, avatar: info.picture });
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
    setIsMobileOtpSent(false);
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="max-w-md w-full bg-card p-8 sm:p-10 rounded-3xl border border-border shadow-xl relative z-10">
          
          {/* Mobile Logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2 font-extrabold text-2xl text-foreground">
              <div className="bg-primary p-2 rounded-xl"><MapPin className="w-6 h-6 text-primary-foreground fill-current" /></div>
              WorkQuora
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
              <button type="submit" disabled={isVerifyingRegistration}
                className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20">
                {isVerifyingRegistration ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Create Account'}
              </button>
              <button type="button" onClick={() => setIsRegistrationOtpSent(false)}
                className="w-full text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mt-2">
                Back to Registration
              </button>
            </form>
          ) : isMobileOtpSent ? (
            <form onSubmit={handleVerifyMobile} className="space-y-5">
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground bg-primary/10 border border-primary/20 rounded-xl p-4">
                  We've sent a 6-digit OTP to your <span className="font-bold">Mobile Number</span>. It will expire in 10 minutes.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Enter Mobile OTP</label>
                <input type="text" value={mobileOtp} onChange={e => setMobileOtp(e.target.value)} placeholder="6-digit Mobile OTP"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors tracking-widest font-mono" required />
              </div>
              <button type="submit" disabled={isVerifyingMobile}
                className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20">
                {isVerifyingMobile ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Mobile & Login'}
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                  <input {...formReg('name')} placeholder="John Doe"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors" />
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
                  <input type="tel" {...formReg('mobileNumber')} placeholder="9999999999" maxLength={10}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors" />
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
              <input type="text" {...formReg('email')} placeholder="you@example.com or username"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors" />
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                {isLogin && <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-primary font-bold hover:underline">Forgot?</button>}
              </div>
              <input type="password" {...formReg('password')} placeholder="••••••••"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors" />
              {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoggingIn || isRegistering}
              className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20">
              {isLoggingIn || isRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Social Auth */}
          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-4 text-muted-foreground font-bold uppercase tracking-wider">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={handleGoogleLogin} disabled={isSocialLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-background border border-border rounded-xl hover:bg-muted transition-colors font-semibold text-sm cursor-pointer disabled:opacity-50 text-foreground">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z" />
                <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z" />
                <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558l3.793 2.987z" />
                <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z" />
              </svg>
              Google
            </button>
            <button type="button" onClick={handleFacebookLogin} disabled={isSocialLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#1877F2]/10 border border-[#1877F2]/20 text-[#1877F2] rounded-xl hover:bg-[#1877F2]/20 transition-colors font-semibold text-sm cursor-pointer disabled:opacity-50">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;