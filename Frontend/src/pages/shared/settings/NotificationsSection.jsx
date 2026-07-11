import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2, Check, Bell } from 'lucide-react';
import { settingsApi } from '../../../api/endpoints';
import { Card, SectionHeader } from '../../../components/ui';

const CHANNELS = [
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
  { key: 'push', label: 'Push' },
  { key: 'inApp', label: 'In-App' },
];

const GROUPS = [
  { title: 'Essential', categories: [
    { key: 'security', label: 'Security Alerts' },
    { key: 'wallet', label: 'Wallet' },
    { key: 'payments', label: 'Payments' },
    { key: 'escrow', label: 'Escrow' },
  ]},
  { title: 'Activity', categories: [
    { key: 'messages', label: 'Messages' },
    { key: 'chat', label: 'Chat' },
    { key: 'jobs', label: 'Job Alerts' },
    { key: 'proposals', label: 'Proposals' },
  ]},
  { title: 'Other', categories: [
    { key: 'marketing', label: 'Marketing' },
    { key: 'promotions', label: 'Promotions' },
    { key: 'aiSuggestions', label: 'AI Suggestions' },
    { key: 'systemUpdates', label: 'System Updates' },
  ]},
];

const Cell = ({ checked, onClick, saving }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={saving}
    className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors shrink-0 disabled:opacity-50 ${
      checked ? 'bg-primary border-primary text-white' : 'bg-background border-border text-transparent hover:border-primary/40'
    }`}
  >
    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
  </button>
);

const NotificationsSection = () => {
  const [prefs, setPrefs] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [savedRow, setSavedRow] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: () => settingsApi.getNotifications().then((r) => r.data?.data ?? {}),
  });

  useEffect(() => {
    if (data) setPrefs(data);
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: settingsApi.updateNotifications,
  });

  const toggleChannel = (categoryKey, channelKey) => {
    if (!prefs) return;
    const current = prefs[categoryKey] || {};
    const updatedCategory = { ...current, [channelKey]: !current[channelKey] };
    const previous = prefs;

    setPrefs((p) => ({ ...p, [categoryKey]: updatedCategory }));
    setSavingKey(`${categoryKey}.${channelKey}`);

    updateMutation.mutate(
      { [categoryKey]: updatedCategory },
      {
        onSuccess: () => {
          setSavingKey(null);
          setSavedRow(categoryKey);
          setTimeout(() => setSavedRow((k) => (k === categoryKey ? null : k)), 1200);
        },
        onError: (err) => {
          setPrefs(previous);
          setSavingKey(null);
          toast.error(err.response?.data?.message || 'Failed to save preference');
        },
      }
    );
  };

  if (isLoading || !prefs) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <SectionHeader icon={Bell} title="Notifications" subtitle="Choose how you get notified" />

      {GROUPS.map((group) => (
        <Card key={group.title}>
          <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-4">{group.title}</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3 pr-4">Category</th>
                  {CHANNELS.map((c) => <th key={c.key} className="pb-3 px-3 text-center">{c.label}</th>)}
                  <th className="pb-3 pl-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {group.categories.map((cat) => (
                  <tr key={cat.key} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4 font-semibold text-foreground">{cat.label}</td>
                    {CHANNELS.map((ch) => (
                      <td key={ch.key} className="py-3 px-3">
                        <div className="flex justify-center">
                          <Cell
                            checked={!!prefs[cat.key]?.[ch.key]}
                            saving={savingKey === `${cat.key}.${ch.key}`}
                            onClick={() => toggleChannel(cat.key, ch.key)}
                          />
                        </div>
                      </td>
                    ))}
                    <td className="py-3 pl-3">
                      <span className={`text-[10px] font-bold text-success transition-opacity duration-300 ${savedRow === cat.key ? 'opacity-100' : 'opacity-0'}`}>
                        Saved
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default NotificationsSection;
