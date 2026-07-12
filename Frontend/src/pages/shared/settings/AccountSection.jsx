import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { IdCard, Mail, Smartphone, CalendarDays, CheckCircle2, XCircle, Monitor, MapPin, LogOut } from 'lucide-react';
import { authApi } from '../../../api/endpoints';
import { useAuth } from '../../../hooks/useAuth';
import { Card, SectionHeader, Button } from '../../../components/ui';

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
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

      {/* Account details (read-only) */}
      <Card>
        <h3 className="text-sm font-bold text-foreground mb-4">Account Details</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 py-2 border-b border-border/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground truncate">{profile?.email || 'Not set'}</span>
            </div>
            {profile?.isEmailVerified ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground shrink-0"><XCircle className="w-3.5 h-3.5" /> Unverified</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 py-2 border-b border-border/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground truncate">{profile?.mobileNumber || 'Not set'}</span>
            </div>
            {profile?.isMobileVerified ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground shrink-0"><XCircle className="w-3.5 h-3.5" /> Unverified</span>
            )}
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
