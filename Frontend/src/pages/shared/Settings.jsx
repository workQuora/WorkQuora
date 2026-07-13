import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IdCard, Lock, ShieldCheck, Bell, CreditCard, Eye, Briefcase, AlertTriangle, Loader2, CheckCircle2, ChevronDown,
} from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';

import AccountSection from './settings/AccountSection';
import SecuritySection from './settings/SecuritySection';
import KycSection from './settings/KycSection';
import NotificationsSection from './settings/NotificationsSection';
import PaymentSection from './settings/PaymentSection';
import PrivacySection from './settings/PrivacySection';
import RoleSection from './settings/RoleSection';
import DangerZoneSection from './settings/DangerZoneSection';

const SECTIONS = [
  { id: 'account', label: 'Account', icon: IdCard },
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
  return SECTIONS.some((s) => s.id === hash) ? hash : 'account';
};

const Settings = () => {
  const { user } = useSelector((s) => s.auth);
  const { useGetProfile } = useProfile();
  const { data: profile, isLoading } = useGetProfile();
  const [activeSection, setActiveSection] = useState(getSectionFromHash());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavRef = useRef(null);

  useEffect(() => {
    window.location.hash = activeSection;
  }, [activeSection]);

  useEffect(() => {
    const onHashChange = () => setActiveSection(getSectionFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target)) setMobileNavOpen(false);
    };
    if (mobileNavOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileNavOpen]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const role = (profile?.role || user?.role || '').toUpperCase();

  const renderNavItem = (s) => {
    const isActive = activeSection === s.id;
    const isKycPending = s.id === 'kyc' && !profile?.isKycVerified;
    const isKycVerified = s.id === 'kyc' && profile?.isKycVerified;

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
  const activeSectionMeta = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];
  const activeIsKycPending = activeSectionMeta.id === 'kyc' && !profile?.isKycVerified;
  const activeIsKycVerified = activeSectionMeta.id === 'kyc' && profile?.isKycVerified;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-background transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-2xl">Manage your professional profile and security preferences.</p>
      </div>

      {/* Mobile: dropdown section picker — no horizontal scroll, fits at 380px */}
      <div className="md:hidden mb-6 relative" ref={mobileNavRef}>
        <button
          onClick={() => setMobileNavOpen((p) => !p)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-border bg-card text-sm font-bold text-foreground"
        >
          <span className="flex items-center gap-2 min-w-0">
            <activeSectionMeta.icon className={`w-4 h-4 shrink-0 ${activeSectionMeta.danger ? 'text-danger' : 'text-primary'}`} />
            <span className="truncate">{activeSectionMeta.label}</span>
            {activeIsKycVerified && <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />}
            {activeIsKycPending && <span className="w-2 h-2 rounded-full bg-warning animate-pulse shrink-0" />}
          </span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-20 p-1.5 space-y-0.5 max-h-[60vh] overflow-y-auto"
            >
              {SECTIONS.map((s) => {
                const isActive = activeSection === s.id;
                const isKycPending = s.id === 'kyc' && !profile?.isKycVerified;
                const isKycVerified = s.id === 'kyc' && profile?.isKycVerified;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setActiveSection(s.id); setMobileNavOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary/10 text-primary' : s.danger ? 'text-danger hover:bg-danger/5' : 'text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <s.icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{s.label}</span>
                    {isKycVerified && <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />}
                    {isKycPending && <span className="w-2 h-2 rounded-full bg-warning animate-pulse shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-72 shrink-0">
          <div className="sticky top-24 space-y-1">
            {nonDangerSections.map((s) => renderNavItem(s))}
            <div className="pt-2 mt-2 border-t border-border">
              {renderNavItem(dangerSection)}
            </div>
          </div>
        </div>

        {/* Active section content */}
        <div className="flex-1 min-w-0">
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-8 shadow-sm min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeSection === 'account' && <AccountSection profile={profile} />}
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
