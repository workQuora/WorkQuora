import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import {
  IdCard, Mail, Smartphone, CalendarDays, CheckCircle2, XCircle, Monitor, MapPin, LogOut, Loader2,
} from 'lucide-react';
import { authApi } from '../../../api/endpoints';
import { useAuth } from '../../../hooks/useAuth';
import { loginSuccess } from '../../../actions/authSlice';
import { getLockInfo } from '../../../utils/updateLock';
import { Card, SectionHeader, Button, Input } from '../../../components/ui';

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const formatCountdown = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// Inline "Change Email" / "Change Mobile" flow — enter new value, OTP is
// sent to that NEW destination to prove ownership, then it's applied. Same
// 2-minute-timer pattern as the password OTP flow in Security settings.
const ChangeContactFlow = ({ kind, currentValue, lastChangeAt }) => {
  const qc = useQueryClient();
  const dispatch = useDispatch();
  const { user, token } = useAuth();
  const isEmail = kind === 'email';
  const lock = getLockInfo(lastChangeAt);

  const [step, setStep] = useState('idle'); // 'idle' | 'enter' | 'otp'
  const [value, setValue] = useState('');
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return;
    timerRef.current = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [step, secondsLeft]);

  const requestMutation = useMutation({
    mutationFn: (d) => (isEmail ? authApi.requestEmailChangeOtp(d) : authApi.requestMobileChangeOtp(d)),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'OTP sent');
      setOtp('');
      setSecondsLeft(res.data?.expiresInSeconds || 120);
      setStep('otp');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send OTP'),
  });

  const verifyMutation = useMutation({
    mutationFn: (d) => (isEmail ? authApi.verifyEmailChange(d) : authApi.verifyMobileChange(d)),
    onSuccess: (res) => {
      toast.success(isEmail ? 'Email updated' : 'Mobile number updated');
      qc.invalidateQueries({ queryKey: ['profile'] });
      if (token) {
        dispatch(loginSuccess({
          user: isEmail
            ? { ...user, email: res.data?.email, isEmailVerified: true }
            : { ...user, mobileNumber: res.data?.mobileNumber, isMobileVerified: true },
          token,
        }));
      }
      setStep('idle');
      setValue('');
      setOtp('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Invalid or expired OTP'),
  });

  const handleSendOtp = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (isEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return toast.error('Enter a valid email address');
      requestMutation.mutate({ newEmail: trimmed });
    } else {
      if (!/^[6-9]\d{9}$/.test(trimmed)) return toast.error('Enter a valid 10-digit mobile number');
      requestMutation.mutate({ newMobile: trimmed });
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    verifyMutation.mutate(isEmail ? { otp, newEmail: value.trim() } : { otp, newMobile: value.trim() });
  };

  if (lock) {
    return (
      <span className="text-xs text-muted-foreground shrink-0 text-right">
        You recently updated this.<br className="hidden sm:block" /> Next update available on {lock.formatted}.
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setStep(step === 'idle' ? 'enter' : 'idle')}
        className="text-xs font-bold text-primary hover:underline shrink-0"
      >
        {step === 'idle' ? (currentValue ? 'Change' : 'Add Mobile') : 'Cancel'}
      </button>

      {step !== 'idle' && (
        <div className="w-full basis-full mt-3 p-3.5 rounded-xl border border-border bg-background">
          {step === 'enter' && (
            <form onSubmit={handleSendOtp} className="space-y-2.5">
              <Input
                label={isEmail ? 'New email address' : 'New mobile number'}
                type={isEmail ? 'email' : 'tel'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={isEmail ? 'you@example.com' : '9999999999'}
                className="mb-0"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button type="submit" variant="primary" size="sm" isLoading={requestMutation.isPending}>
                  {!requestMutation.isPending && 'Send OTP'}
                </Button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerify} className="space-y-2.5">
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to <span className="font-semibold text-foreground">{value.trim()}</span>.
              </p>
              <Input
                label="OTP Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                inputMode="numeric"
                className="mb-0"
              />
              <p className="text-xs font-semibold text-muted-foreground">
                {secondsLeft > 0 ? `OTP expires in ${formatCountdown(secondsLeft)}` : 'OTP expired'}
              </p>
              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={secondsLeft > 0 || requestMutation.isPending}
                  onClick={() => requestMutation.mutate(isEmail ? { newEmail: value.trim() } : { newMobile: value.trim() })}
                >
                  {requestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resend OTP'}
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={verifyMutation.isPending} disabled={secondsLeft <= 0}>
                  {!verifyMutation.isPending && 'Verify'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
};

const AccountSection = ({ profile }) => {
  const qc = useQueryClient();
  const { logout } = useAuth();

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => authApi.sessions().then((r) => r.data?.data ?? []),
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => authApi.revokeSession(id),
    onSuccess: (_res, id) => {
      const revoked = sessions.find((s) => s.sessionId === id);
      toast.success('Device logged out');
      qc.invalidateQueries({ queryKey: ['sessions'] });
      if (revoked?.isCurrent) logout();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to log out device'),
  });

  const logoutAllMutation = useMutation({
    mutationFn: authApi.logoutAllSessions,
    onSuccess: () => {
      toast.success('Logged out of all devices');
      logout();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to log out all devices'),
  });

  return (
    <div className="space-y-4">
      <SectionHeader icon={IdCard} title="Account" subtitle="Your account details and login sessions" />

      {/* Account details */}
      <Card>
        <h3 className="text-sm font-bold text-foreground mb-4">Account Details</h3>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3 py-2 border-b border-border/60 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground truncate">{profile?.email || 'Not set'}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {profile?.isEmailVerified ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground"><XCircle className="w-3.5 h-3.5" /> Unverified</span>
              )}
            </div>
            <ChangeContactFlow kind="email" currentValue={profile?.email} lastChangeAt={profile?.lastEmailChangeAt} />
          </div>

          <div className="flex items-center justify-between gap-3 py-2 border-b border-border/60 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground truncate">{profile?.mobileNumber || 'Not set'}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {profile?.mobileNumber && (
                profile?.isMobileVerified ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground"><XCircle className="w-3.5 h-3.5" /> Unverified</span>
                )
              )}
            </div>
            <ChangeContactFlow kind="mobile" currentValue={profile?.mobileNumber} lastChangeAt={profile?.lastMobileChangeAt} />
          </div>

          <div className="flex items-center gap-2.5 py-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground">Account created {formatDateTime(profile?.createdAt)}</span>
          </div>
        </div>
      </Card>

      {/* Login Sessions / Devices */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Login Sessions</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutAllMutation.mutate()}
            isLoading={logoutAllMutation.isPending}
            className="text-danger hover:bg-danger/10"
          >
            {!logoutAllMutation.isPending && (<><LogOut className="w-3.5 h-3.5" /> Log out all devices</>)}
          </Button>
        </div>

        {sessionsLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No active sessions found.</p>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map((s) => (
              <div key={s.sessionId} className="py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {s.browser || 'Unknown'} on {s.operatingSystem || 'Unknown'}
                    </p>
                    {s.isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                        Current device
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {s.city && s.city !== 'Unknown' ? `${s.city}${s.country && s.country !== 'Unknown' ? `, ${s.country}` : ''}` : 'Unknown location'}
                    <span className="mx-1">•</span>
                    Logged in {formatDateTime(s.createdAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeMutation.mutate(s.sessionId)}
                  isLoading={revokeMutation.isPending && revokeMutation.variables === s.sessionId}
                  className="text-danger hover:bg-danger/10 shrink-0"
                >
                  {!(revokeMutation.isPending && revokeMutation.variables === s.sessionId) && 'Log out'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AccountSection;
