import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye } from 'lucide-react';
import { settingsApi } from '../../../api/endpoints';
import { useTheme } from '../../../context/ThemeContext';
import { Card, SectionHeader, Toggle } from '../../../components/ui';

const VISIBILITY_OPTIONS = [
  { val: 'public', label: 'Public', desc: 'Anyone can view your profile' },
  { val: 'registered', label: 'Registered users only', desc: 'Only logged-in WorkQuora users can view your profile' },
  { val: 'private', label: 'Private', desc: 'Only you and admins can view your profile' },
];

const PrivacySection = ({ role }) => {
  const qc = useQueryClient();
  const { theme, toggleTheme } = useTheme();

  const { data: privacy, isLoading } = useQuery({
    queryKey: ['privacy-settings'],
    queryFn: () => settingsApi.getPrivacy().then((r) => r.data?.data ?? {}),
  });

  const updateMutation = useMutation({
    mutationFn: settingsApi.updatePrivacy,
    onSuccess: () => {
      toast.success('Privacy settings updated');
      qc.invalidateQueries({ queryKey: ['privacy-settings'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update privacy settings'),
  });

  const toggleField = (field) => {
    updateMutation.mutate({ [field]: !privacy?.[field] });
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <SectionHeader icon={Eye} title="Privacy & preferences" subtitle="Control who sees your info" />

      <Card>
        <Toggle label="Show Email" description="Let other users see your email on your public profile." value={!!privacy?.showEmail} onChange={() => toggleField('showEmail')} />
        <Toggle label="Show Phone Number" description="Let other users see your mobile number on your public profile." value={!!privacy?.showPhone} onChange={() => toggleField('showPhone')} />
        {role !== 'CLIENT' && (
          <Toggle label="Show Earnings" description="Display your total earnings publicly on your profile." value={!!privacy?.showEarnings} onChange={() => toggleField('showEarnings')} />
        )}

        <div className="pt-6">
          <p className="font-medium text-foreground text-sm mb-3">Profile Visibility</p>
          <div className="space-y-2">
            {VISIBILITY_OPTIONS.map((opt) => {
              const selected = (privacy?.profileVisibility || 'public') === opt.val;
              return (
                <label
                  key={opt.val}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="profileVisibility"
                    checked={selected}
                    onChange={() => updateMutation.mutate({ profileVisibility: opt.val })}
                    className="accent-primary"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-bold text-foreground mb-2">Preferences</h3>
        <Toggle
          label={theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          description="Switch between light and dark appearance."
          value={theme === 'dark'}
          onChange={toggleTheme}
        />
      </Card>
    </div>
  );
};

export default PrivacySection;
