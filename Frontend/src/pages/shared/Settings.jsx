import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Lock, ShieldCheck, Bell, CreditCard, Eye, Briefcase, AlertTriangle, Loader2, CheckCircle2,
} from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';

import ProfileSection from './settings/ProfileSection';
import SecuritySection from './settings/SecuritySection';
import KycSection from './settings/KycSection';
import NotificationsSection from './settings/NotificationsSection';
import PaymentSection from './settings/PaymentSection';
import PrivacySection from './settings/PrivacySection';
import RoleSection from './settings/RoleSection';
import DangerZoneSection from './settings/DangerZoneSection';

const SECTIONS = [
  { id: 'profile', label: 'Profile & Identity', icon: User },
  { id: 'security', label: 'Account & Security', icon: Lock },
  { id: 'kyc', label: 'KYC Verification', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'payment', label: 'Payment & Bank', icon: CreditCard },
  { id: 'privacy', label: 'Privacy & Preferences', icon: Eye },
  { id: 'role', label: 'Role Settings', icon: Briefcase },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true },
];

const getSectionFromHash = () => {
  const hash = window.location.hash.replace('#', '');
  return SECTIONS.some((s) => s.id === hash) ? hash : 'profile';
};

const Settings = () => {
  const { user } = useSelector((s) => s.auth);
  const { useGetProfile } = useProfile();
  const { data: profile, isLoading } = useGetProfile();
  const [activeSection, setActiveSection] = useState(getSectionFromHash());

  useEffect(() => {
    window.location.hash = activeSection;
  }, [activeSection]);

  useEffect(() => {
    const onHashChange = () => setActiveSection(getSectionFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const role = (profile?.role || user?.role || '').toUpperCase();

  const renderNavItem = (s, { mobile }) => {
    const isActive = activeSection === s.id;
    const isKycPending = s.id === 'kyc' && !profile?.isKycVerified;
    const isKycVerified = s.id === 'kyc' && profile?.isKycVerified;

    if (mobile) {
      return (
        <button
          key={s.id}
          onClick={() => setActiveSection(s.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
            isActive
              ? 'bg-primary/10 text-primary border-primary/30'
              : s.danger ? 'text-danger border-transparent' : 'text-muted-foreground border-transparent'
          }`}
        >
          <s.icon className="w-3.5 h-3.5" />
          {s.label}
          {isKycPending && <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />}
        </button>
      );
    }

    return (
      <motion.button
        key={s.id}
        whileHover={{ x: 2 }}
        onClick={() => setActiveSection(s.id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-colors ${
          isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'
        } ${s.danger ? (isActive ? '' : 'text-danger hover:bg-danger/5') : ''}`}
      >
        <s.icon className="w-4 h-4 shrink-0" />
        <span className="flex-1">{s.label}</span>
        {isKycVerified && <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />}
        {isKycPending && <span className="w-2 h-2 rounded-full bg-warning animate-pulse shrink-0" />}
      </motion.button>
    );
  };

  const nonDangerSections = SECTIONS.filter((s) => !s.danger);
  const dangerSection = SECTIONS.find((s) => s.danger);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-background transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-2xl">Manage your professional profile and security preferences.</p>
      </div>

      {/* Mobile: horizontal scrollable tab strip */}
      <div className="md:hidden mb-6 -mx-4 px-4 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {SECTIONS.map((s) => renderNavItem(s, { mobile: true }))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-72 shrink-0">
          <div className="sticky top-24 space-y-1">
            {nonDangerSections.map((s) => renderNavItem(s, { mobile: false }))}
            <div className="pt-2 mt-2 border-t border-border">
              {renderNavItem(dangerSection, { mobile: false })}
            </div>
          </div>
        </div>

        {/* Active section content */}
        <div className="flex-1 min-w-0">
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeSection === 'profile' && <ProfileSection profile={profile} />}
                {activeSection === 'security' && <SecuritySection profile={profile} />}
                {activeSection === 'kyc' && <KycSection />}
                {activeSection === 'notifications' && <NotificationsSection />}
                {activeSection === 'payment' && <PaymentSection profile={profile} />}
                {activeSection === 'privacy' && <PrivacySection role={role} />}
                {activeSection === 'role' && <RoleSection profile={profile} role={role} />}
                {activeSection === 'danger' && <DangerZoneSection />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
