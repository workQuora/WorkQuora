/**
 * pages/auth/SelectRole.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXES applied from code review:
 * 1. Uses useAuth().assignRole → dispatches to Redux (no AuthContext)
 * 2. Sends 'CLIENT' | 'FREELANCER' (uppercase) to match backend + Redux
 * 3. Correct response handling via hook (no raw response.success check)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { Briefcase, UserCheck, Check, MapPin } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const SelectRole = () => {
  const { assignRole, isAssigningRole } = useAuth();
  const [selected, setSelected] = useState(''); // 'CLIENT' | 'FREELANCER'

  const handleConfirm = () => {
    if (!selected) return;
    assignRole(selected); // hook handles dispatch + navigate
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">WorkQuora</span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">How will you use WorkQuora?</h2>
          <p className="text-gray-400 text-sm mt-2 mb-8">
            You can always switch roles from your profile settings later.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* CLIENT */}
            <button
              onClick={() => setSelected('CLIENT')}
              className={`p-6 rounded-2xl border text-left transition-all duration-200 relative group ${
                selected === 'CLIENT'
                  ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/10'
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
              }`}
            >
              {selected === 'CLIENT' && (
                <div className="absolute top-4 right-4 bg-indigo-500 text-white p-1 rounded-full">
                  <Check size={12} />
                </div>
              )}
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl w-max mb-4">
                <Briefcase size={22} />
              </div>
              <h3 className="text-lg font-bold mb-1">I'm a Client</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Post jobs, find local talent nearby, and manage projects with escrow protection.
              </p>
              <ul className="mt-4 space-y-1 text-xs text-gray-500">
                <li className="flex items-center gap-1.5"><Check size={10} className="text-indigo-400" /> Post jobs with location radius</li>
                <li className="flex items-center gap-1.5"><Check size={10} className="text-indigo-400" /> View freelancers on live map</li>
                <li className="flex items-center gap-1.5"><Check size={10} className="text-indigo-400" /> Secure escrow payments</li>
              </ul>
            </button>

            {/* FREELANCER */}
            <button
              onClick={() => setSelected('FREELANCER')}
              className={`p-6 rounded-2xl border text-left transition-all duration-200 relative group ${
                selected === 'FREELANCER'
                  ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10'
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
              }`}
            >
              {selected === 'FREELANCER' && (
                <div className="absolute top-4 right-4 bg-emerald-500 text-white p-1 rounded-full">
                  <Check size={12} />
                </div>
              )}
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl w-max mb-4">
                <UserCheck size={22} />
              </div>
              <h3 className="text-lg font-bold mb-1">I'm a Freelancer</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Find nearby gigs matching your skills, set your working radius, and get paid fast.
              </p>
              <ul className="mt-4 space-y-1 text-xs text-gray-500">
                <li className="flex items-center gap-1.5"><Check size={10} className="text-emerald-400" /> AI-powered job feed</li>
                <li className="flex items-center gap-1.5"><Check size={10} className="text-emerald-400" /> Set custom working radius</li>
                <li className="flex items-center gap-1.5"><Check size={10} className="text-emerald-400" /> Instant wallet payouts</li>
              </ul>
            </button>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selected || isAssigningRole}
            className="bg-white text-gray-950 font-bold px-10 py-3.5 rounded-xl disabled:opacity-40 hover:bg-gray-100 transition-colors text-sm shadow-lg"
          >
            {isAssigningRole ? 'Setting up your account…' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
