import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Briefcase, UserCheck, ArrowRight } from 'lucide-react';
import { authApi } from '../../../api/endpoints';
import { updateRole } from '../../../actions/authSlice';

const SelectRole = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userId } = location.state || {};

  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSubmit = async () => {
    if (!selectedRole) return;
    setIsLoading(true);
    setError('');
    try {
      await authApi.assignRole(selectedRole.toUpperCase());
      dispatch(updateRole(selectedRole.toUpperCase()));
      navigate(selectedRole === 'client' ? '/client/dashboard' : '/freelancer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save role. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6 text-zinc-100">
      <div className="w-full max-w-2xl bg-white/[0.02] border border-white/10 p-8 rounded-3xl backdrop-blur-xl text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Choose Your Role</h2>
        <p className="text-zinc-400 mt-2">This configures your dashboard and permissions.</p>

        {error && <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
          <div
            onClick={() => setSelectedRole('client')}
            className={`p-6 rounded-2xl border cursor-pointer text-left transition-all duration-300 ${
              selectedRole === 'client' ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/10'
            }`}
          >
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-max mb-4"><Briefcase size={24} /></div>
            <h3 className="text-xl font-bold text-white mb-1">I want to Hire</h3>
            <p className="text-sm text-zinc-400">Post local jobs, track nearby freelancers, and manage tasks.</p>
          </div>

          <div
            onClick={() => setSelectedRole('freelancer')}
            className={`p-6 rounded-2xl border cursor-pointer text-left transition-all duration-300 ${
              selectedRole === 'freelancer' ? 'bg-emerald-600/10 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/10'
            }`}
          >
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-max mb-4"><UserCheck size={24} /></div>
            <h3 className="text-xl font-bold text-white mb-1">I'm looking for Work</h3>
            <p className="text-sm text-zinc-400">Find nearby jobs, set your work radius, and track earnings.</p>
          </div>
        </div>

        <button
          onClick={handleRoleSubmit}
          disabled={!selectedRole || isLoading}
          className="bg-white text-black font-semibold px-8 py-3 rounded-xl inline-flex items-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
        >
          {isLoading ? 'Setting up...' : 'Confirm Role'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default SelectRole;