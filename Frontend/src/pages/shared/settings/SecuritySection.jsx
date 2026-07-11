import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Lock, Monitor, LogOut } from 'lucide-react';
import { authApi } from '../../../api/endpoints';
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

const SecuritySection = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });

  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password'),
  });

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (form.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    if (form.newPassword !== form.confirmNewPassword) return toast.error('Passwords do not match');
    changePasswordMutation.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

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

      {/* Block A — Change Password */}
      <Card>
        <form onSubmit={handleChangePassword} className="space-y-1">
          <h3 className="text-sm font-bold text-foreground mb-3">Change password</h3>

          <Input
            label="Current Password"
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          />
          <div className="grid sm:grid-cols-2 gap-x-6">
            <Input
              label="New Password"
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={form.confirmNewPassword}
              onChange={(e) => setForm({ ...form, confirmNewPassword: e.target.value })}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" isLoading={changePasswordMutation.isPending}>
              {!changePasswordMutation.isPending && 'Change Password'}
            </Button>
          </div>
        </form>
      </Card>

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
