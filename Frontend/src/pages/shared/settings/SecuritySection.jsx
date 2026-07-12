import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Lock, Monitor, LogOut, Mail, Smartphone, Loader2, ShieldCheck } from 'lucide-react';
import { authApi } from '../../../api/endpoints';
import { useAuth } from '../../../hooks/useAuth';
import { Card, SectionHeader, Button, Input } from '../../../components/ui';

const timeAgo = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const maskEmail = (email) => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.length <= 2 ? local[0] : `${local[0]}${local[local.length - 1]}`;
  return `${visible[0]}${'*'.repeat(Math.max(3, local.length - 2))}${visible.slice(1)}@${domain}`;
};

const maskPhone = (mobileNumber) => {
  if (!mobileNumber) return '';
  const digits = mobileNumber.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  return `+91 ${'X'.repeat(Math.max(0, digits.length - 4))}${last4}`;
};

const formatCountdown = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// OTP-gated password Set/Change flow (Bug 3) — same flow for both cases:
// social-login users setting their first real password (hasPassword=false),
// and existing users changing theirs (hasPassword=true).
const PasswordOtpFlow = ({ profile }) => {
  const { logout } = useAuth();
  const hasPassword = profile?.hasPassword !== false;

  const [step, setStep] = useState('choose'); // 'choose' | 'otp' | 'set'
  const [method, setMethod] = useState(profile?.email ? 'email' : 'phone');
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [pwd, setPwd] = useState({ newPassword: '', confirmPassword: '' });
  const timerRef = useRef(null);

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return;
    timerRef.current = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [step, secondsLeft]);

  const requestOtpMutation = useMutation({
    mutationFn: authApi.requestPasswordOtp,
    onSuccess: (res) => {
      toast.success(res.data?.message || 'OTP sent');
      setOtp('');
      setSecondsLeft(res.data?.expiresInSeconds || 120);
      setStep('otp');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send OTP'),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: authApi.verifyPasswordOtp,
    onSuccess: () => {
      toast.success('OTP verified');
      setStep('set');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Invalid or expired OTP'),
  });

  const setPasswordMutation = useMutation({
    mutationFn: authApi.setPassword,
    onSuccess: () => {
      toast.success(hasPassword ? 'Password changed. Please log in again.' : 'Password set. Please log in again.');
      setTimeout(() => logout(), 1200);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to set password'),
  });

  const handleSendOtp = (e) => {
    e.preventDefault();
    requestOtpMutation.mutate({ method });
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    verifyOtpMutation.mutate({ otp });
  };

  const handleSetPassword = (e) => {
    e.preventDefault();
    if (pwd.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    if (pwd.newPassword !== pwd.confirmPassword) return toast.error('Passwords do not match');
    setPasswordMutation.mutate(pwd);
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">{hasPassword ? 'Change password' : 'Set password'}</h3>
      </div>

      {step === 'choose' && (
        <form onSubmit={handleSendOtp} className="space-y-3">
          <p className="text-sm text-muted-foreground mb-1">
            {hasPassword
              ? "We'll send a one-time code to verify it's you before changing your password."
              : "You signed up with a social account. We'll send a one-time code to verify it's you before setting a password."}
          </p>

          <div className="space-y-2">
            {profile?.email && (
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  method === 'email' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                }`}
              >
                <input type="radio" name="otp-method" className="accent-primary" checked={method === 'email'} onChange={() => setMethod('email')} />
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">Send OTP to my email ({maskEmail(profile.email)})</span>
              </label>
            )}
            {profile?.mobileNumber && (
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  method === 'phone' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                }`}
              >
                <input type="radio" name="otp-method" className="accent-primary" checked={method === 'phone'} onChange={() => setMethod('phone')} />
                <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">Send OTP to my phone ({maskPhone(profile.mobileNumber)})</span>
              </label>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" variant="primary" isLoading={requestOtpMutation.isPending}>
              {!requestOtpMutation.isPending && 'Send OTP'}
            </Button>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to your {method === 'email' ? 'email' : 'phone'}.
          </p>
          <Input
            label="OTP Code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
          />
          <p className="text-xs font-semibold text-muted-foreground -mt-3">
            {secondsLeft > 0 ? `OTP expires in ${formatCountdown(secondsLeft)}` : 'OTP expired'}
          </p>
          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={secondsLeft > 0 || requestOtpMutation.isPending}
              onClick={() => requestOtpMutation.mutate({ method })}
            >
              {requestOtpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resend OTP'}
            </Button>
            <Button type="submit" variant="primary" isLoading={verifyOtpMutation.isPending} disabled={secondsLeft <= 0}>
              {!verifyOtpMutation.isPending && 'Verify OTP'}
            </Button>
          </div>
        </form>
      )}

      {step === 'set' && (
        <form onSubmit={handleSetPassword} className="space-y-1">
          <div className="grid sm:grid-cols-2 gap-x-6">
            <Input
              label="New Password"
              type="password"
              value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={pwd.confirmPassword}
              onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" isLoading={setPasswordMutation.isPending}>
              {!setPasswordMutation.isPending && (hasPassword ? 'Change Password' : 'Set Password')}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};

const SecuritySection = ({ profile }) => {
  const qc = useQueryClient();

  const { data: sessions = [], isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => authApi.sessions().then((r) => r.data?.data ?? []),
  });

  const logoutAllMutation = useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: () => {
      toast.success('Logged out of all other devices');
      qc.invalidateQueries({ queryKey: ['sessions'] });
      refetchSessions();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to logout other devices'),
  });

  return (
    <div className="space-y-4">
      <SectionHeader icon={Lock} title="Account & security" subtitle="Password and active sessions" />

      {/* Block A — Set/Change Password (OTP-gated) */}
      <PasswordOtpFlow profile={profile} />

      {/* Block B — Active Sessions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Active Sessions</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutAllMutation.mutate()}
            isLoading={logoutAllMutation.isPending}
            className="text-danger hover:bg-danger/10"
          >
            {!logoutAllMutation.isPending && (<><LogOut className="w-3.5 h-3.5" /> Logout All Other Devices</>)}
          </Button>
        </div>

        {sessionsLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No active sessions found.</p>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map((s) => (
              <div key={s.sessionId || s._id} className="py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{s.deviceName || 'Unknown device'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.ipAddress || 'Unknown IP'} • Active {timeAgo(s.lastUsedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SecuritySection;
