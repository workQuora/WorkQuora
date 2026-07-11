import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, X, Briefcase } from 'lucide-react';
import { useProfile } from '../../../hooks/useProfile';
import { Card, SectionHeader, Button, Input, Toggle } from '../../../components/ui';

const RoleSection = ({ profile, role }) => {
  const { updateProfile, isUpdating } = useProfile();
  const [skillInput, setSkillInput] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (profile) {
      setHourlyRate(profile.hourlyRate ?? '');
      setIsAvailable(profile.isAvailable ?? true);
    }
  }, [profile]);

  if (role === 'CLIENT') {
    return (
      <div className="space-y-4">
        <SectionHeader icon={Briefcase} title="Role settings" subtitle="Settings for your account type" />
        <Card className="text-center py-8">
          <Briefcase className="w-8 h-8 text-muted-foreground opacity-30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No additional settings for client accounts yet.</p>
        </Card>
      </div>
    );
  }

  const skills = profile?.skills || [];

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      toast.error('Skill already exists!');
      return;
    }
    updateProfile({ skills: [...skills, trimmed] }, { onSuccess: () => setSkillInput('') });
  };

  const handleRemoveSkill = (skill) => {
    updateProfile({ skills: skills.filter((s) => s !== skill) });
  };

  const handleSaveRate = (e) => {
    e.preventDefault();
    updateProfile({ hourlyRate: Number(hourlyRate) || 0 });
  };

  const handleToggleAvailability = () => {
    const next = !isAvailable;
    setIsAvailable(next);
    updateProfile({ isAvailable: next });
  };

  return (
    <div className="space-y-4">
      <SectionHeader icon={Briefcase} title="Role settings" subtitle="Settings for your account type" />

      <Card>
        <h3 className="text-sm font-bold text-foreground mb-3">Skills</h3>
        <div className="flex gap-2 mb-4">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
            placeholder="e.g. React Native, Plumbing, Electrical"
            className="flex-1 px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-zinc-800/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
          <Button variant="secondary" onClick={handleAddSkill} disabled={isUpdating} className="shrink-0">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <div key={skill} onClick={() => handleRemoveSkill(skill)}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border hover:border-danger/30 hover:bg-danger/10 rounded-full text-xs font-semibold text-foreground hover:text-danger transition-all cursor-pointer"
              title="Click to remove skill">
              <span>{skill}</span>
              <X className="w-3 h-3 text-muted-foreground group-hover:text-danger transition-colors" />
            </div>
          ))}
          {skills.length === 0 && <p className="text-xs text-muted-foreground">No skills added yet.</p>}
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSaveRate} className="space-y-1">
          <h3 className="text-sm font-bold text-foreground mb-3">Hourly Rate</h3>
          <Input
            label="Rate (₹ per hour)"
            type="number"
            min="0"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="500"
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" isLoading={isUpdating}>
              {!isUpdating && 'Save Rate'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="text-sm font-bold text-foreground mb-2">Availability</h3>
        <Toggle
          label="Currently Available for Work"
          description="Clients can only send you new job invites while this is on."
          value={isAvailable}
          onChange={handleToggleAvailability}
        />
      </Card>
    </div>
  );
};

export default RoleSection;
