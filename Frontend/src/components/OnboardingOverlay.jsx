import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, UserCheck, Check, Loader2, ArrowRight, Shield } from 'lucide-react';
import api from '../services/api';
import { loginSuccess } from '../actions/authSlice';

const OnboardingOverlay = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, token, user, onboarding } = useSelector((s) => s.auth);

  const [selectedRole, setSelectedRole] = useState('');
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState('');

  const [termsData, setTermsData] = useState(null);
  const [isTermsLoading, setIsTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [checkboxAccepted, setCheckboxAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  // Sync user and onboarding state helper
  const syncState = async () => {
    try {
      const res = await api.get('/auth/me');
      const freshUser = res.data?.data ?? res.data?.user;
      const freshOnboarding = res.data?.onboarding;
      if (freshUser) {
        dispatch(loginSuccess({ user: freshUser, token, onboarding: freshOnboarding }));
      }
    } catch (err) {
      console.error('Failed to sync onboarding state:', err);
    }
  };

  // Fetch current terms when role is completed but terms are pending
  useEffect(() => {
    if (isAuthenticated && onboarding && onboarding.roleSelected && !onboarding.termsAccepted) {
      setIsTermsLoading(true);
      setTermsError('');
      api.get('/terms/current')
        .then((res) => {
          if (res.data?.success) {
            setTermsData(res.data.terms);
          }
        })
        .catch((err) => {
          setTermsError('Failed to load terms from server.');
        })
        .finally(() => {
          setIsTermsLoading(false);
        });
    }
  }, [isAuthenticated, onboarding?.roleSelected, onboarding?.termsAccepted]);

  // Attach key blocker
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Redirect to the role-appropriate dashboard once onboarding is fully complete
  useEffect(() => {
    if (isAuthenticated && onboarding?.onboardingComplete && user?.role) {
      const target = user.role.toLowerCase() === 'client'
        ? '/client/dashboard'
        : '/freelancer/dashboard';
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, onboarding?.onboardingComplete, user?.role]);

  if (!isAuthenticated || !onboarding || onboarding.onboardingComplete) {
    return null;
  }

  const handleRoleSubmit = async () => {
    if (!selectedRole) return;
    setIsRoleLoading(true);
    setRoleError('');
    try {
      const dbRole = selectedRole === 'client' ? 'CLIENT' : 'FREELANCER';
      await api.put('/auth/user/assign-role', { role: dbRole });
      await syncState();
    } catch (err) {
      setRoleError(err.response?.data?.message || 'Failed to save role. Please try again.');
    } finally {
      setIsRoleLoading(false);
    }
  };

  const handleTermsSubmit = async () => {
    if (!checkboxAccepted || isAccepting) return;
    setIsAccepting(true);
    setTermsError('');
    try {
      await api.post('/terms/accept');
      await syncState();
    } catch (err) {
      setTermsError(err.response?.data?.message || 'Terms acceptance failed. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#09090B]/98 z-[9999] flex items-center justify-center p-6 backdrop-blur-md overflow-y-auto select-none">
      <AnimatePresence mode="wait">
        {!onboarding.roleSelected ? (
          <motion.div
            key="role-selection"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center shadow-2xl my-auto text-zinc-100"
          >
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Choose Your Role</h2>
            <p className="text-zinc-400 mt-2">Before continuing, please choose how you want to use WorkQuora.</p>

            {roleError && (
              <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                {roleError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-10">
              <motion.div
                onClick={() => setSelectedRole('client')}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-2xl border cursor-pointer text-left transition-all duration-300 ${
                  selectedRole === 'client'
                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 bg-indigo-600/10'
                    : 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700 opacity-70'
                }`}
              >
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-max mb-4">
                  <Briefcase size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">I want to hire</h3>
                <p className="text-sm text-zinc-400">Post local jobs, track nearby freelancers, and manage tasks.</p>
              </motion.div>

              <motion.div
                onClick={() => setSelectedRole('worker')}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-2xl border cursor-pointer text-left transition-all duration-300 ${
                  selectedRole === 'worker'
                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 bg-emerald-600/10'
                    : 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700 opacity-70'
                }`}
              >
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-max mb-4">
                  <UserCheck size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">I want to work</h3>
                <p className="text-sm text-zinc-400">Find nearby jobs, set your work radius, and track earnings.</p>
              </motion.div>
            </div>

            <button
              onClick={handleRoleSubmit}
              disabled={!selectedRole || isRoleLoading}
              className="bg-white text-black font-semibold px-8 py-3 rounded-xl inline-flex items-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isRoleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  Confirm Role <ArrowRight size={16} />
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="terms-conditions"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl my-auto text-zinc-100 flex flex-col max-h-[90vh]"
          >
            <div className="text-center mb-6">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full w-max mx-auto mb-3">
                <Shield size={28} />
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Terms &amp; Conditions</h2>
              <p className="text-zinc-400 text-sm mt-1">Please review and accept our updated terms to continue.</p>
            </div>

            {termsError && (
              <p className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-center">
                {termsError}
              </p>
            )}

            {isTermsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                <span className="text-zinc-400 text-sm">Loading terms content...</span>
              </div>
            ) : termsData ? (
              <>
                <div className="flex-1 overflow-y-auto bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-6 mb-6 text-sm text-zinc-300 leading-relaxed text-left max-h-[300px]">
                  <div className="font-bold text-white mb-2 text-base">{termsData.name}</div>
                  <div className="text-zinc-500 text-xs mb-6">
                    Version {termsData.version} &bull; Effective Date: {termsData.effectiveDate}
                  </div>

                  {termsData.content.map((sec, idx) => (
                    <div key={idx} className="mb-6 last:mb-0">
                      <h4 className="font-semibold text-white mb-1.5">{sec.title}</h4>
                      <p className="text-zinc-400">{sec.text}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-6 bg-amber-500/5 border border-amber-500/15 p-4 rounded-xl text-xs text-amber-400 text-left leading-relaxed">
                  ⚠️ Your WorkQuora account, login credentials, and user data are processed and stored according to these platform terms and standard operations.
                </div>

                <label className="flex items-start gap-3 cursor-pointer text-sm text-zinc-300 hover:text-white transition-colors mb-6 text-left">
                  <input
                    type="checkbox"
                    checked={checkboxAccepted}
                    onChange={(e) => setCheckboxAccepted(e.target.checked)}
                    className="mt-0.5 w-4.5 h-4.5 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>I have read and agree to the WorkQuora Terms &amp; Conditions.</span>
                </label>

                <div className="text-center">
                  <button
                    onClick={handleTermsSubmit}
                    disabled={!checkboxAccepted || isAccepting}
                    className="bg-white text-black font-semibold px-8 py-3 rounded-xl inline-flex items-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Accepting...
                      </>
                    ) : (
                      <>
                        Accept &amp; Continue <Check size={16} />
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-zinc-400 text-sm">
                Could not fetch Terms content. Please check your internet connection and try again.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingOverlay;
