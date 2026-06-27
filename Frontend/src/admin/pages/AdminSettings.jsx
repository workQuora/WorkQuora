import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Loader2, Shield, Lock, Users, Plus, ShieldCheck, Eye, Trash2, Ban, Play, UserCheck, X, Activity } from 'lucide-react';
import adminApi from '../api/adminApi';

const permissionsList = [
  'view_users',
  'suspend_users',
  'block_users',
  'modify_kyc',
  'view_tasks',
  'cancel_tasks',
  'view_payments',
  'process_refund',
  'view_analytics',
  'view_audit_logs',
];

const AdminSettings = () => {
  const { admin } = useSelector((s) => s.adminAuth);
  const isSuperAdmin = admin?.role === 'SUPER_ADMIN' || admin?.isSuperAdmin;

  const [activeTab, setActiveTab] = useState('profile');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // SuperAdmin: Admins list state
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  
  // SuperAdmin: Create Admin form state
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createMobile, setCreateMobile] = useState('');
  const [createPerms, setCreatePerms] = useState([]);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // SuperAdmin: Admin Activity Trail state
  const [selectedAdminLogs, setSelectedAdminLogs] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const requestOtp = async () => {
    setSendingOtp(true);
    try {
      await adminApi.post('/auth/request-change-password-otp');
      setOtpSent(true);
      alert('Verification OTP sent. Check server logs in development.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      await adminApi.post('/auth/change-password', { currentPassword, newPassword, otp });
      alert('Password updated successfully. Please log in again.');
      setCurrentPassword('');
      setNewPassword('');
      setOtp('');
      setOtpSent(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const fetchAdmins = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoadingAdmins(true);
    try {
      const res = await adminApi.get('/super/admins');
      setAdmins(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdmins(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (activeTab === 'admins') {
      fetchAdmins();
    }
  }, [activeTab, fetchAdmins]);

  const toggleCreatePerm = (perm) => {
    setCreatePerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreatingAdmin(true);
    try {
      await adminApi.post('/super/create-admin', {
        name: createName,
        email: createEmail,
        password: createPassword,
        mobileNumber: createMobile,
        permissions: createPerms,
      });
      alert('Admin account created successfully.');
      setCreateOpen(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreateMobile('');
      setCreatePerms([]);
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create admin.');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const suspendAdmin = async (id) => {
    const reason = prompt('Enter suspension reason:');
    if (reason === null) return; // cancelled
    try {
      await adminApi.put(`/super/admins/${id}/suspend`, { reason });
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Suspension failed');
    }
  };

  const activateAdmin = async (id) => {
    if (!confirm('Are you sure you want to activate this admin?')) return;
    try {
      await adminApi.put(`/super/admins/${id}/activate`);
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Activation failed');
    }
  };

  const deleteAdmin = async (id) => {
    if (!confirm('Are you sure you want to delete this admin account permanently?')) return;
    try {
      await adminApi.delete(`/super/admins/${id}`);
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed');
    }
  };

  const viewAdminActivity = async (id) => {
    setLoadingLogs(true);
    try {
      const res = await adminApi.get(`/super/admins/${id}/activity`);
      setSelectedAdminLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white mb-1">System Settings</h1>
        <p className="text-xs text-gray-500">Configure profile, change security keys, and manage internal roles</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 space-x-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          My Profile & Security
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('admins')}
            className={`pb-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
              activeTab === 'admins'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Admin Management
          </button>
        )}
      </div>

      {/* PROFILE & SECURITY TAB */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Profile Details */}
          <div className="p-6 rounded-2xl border space-y-6" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {admin?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white">{admin?.name}</h2>
                <p className="text-xs text-indigo-400 font-semibold">{isSuperAdmin ? '🔰 Super Administrator' : '🛡️ Standard Admin'}</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                ['Email Address', admin?.email],
                ['Account ID', admin?.id || admin?._id],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b pb-3 text-xs" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-gray-500 font-semibold">{k}</span>
                  <span className="text-gray-300 font-mono select-all">{v}</span>
                </div>
              ))}
            </div>

            {/* Allowed permissions list */}
            <div>
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">My Permissions</h3>
              <div className="flex flex-wrap gap-1.5">
                {isSuperAdmin ? (
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                    All Access (*)
                  </span>
                ) : (
                  admin?.permissions?.map((p) => (
                    <span key={p} className="text-[9px] font-semibold px-2 py-0.5 rounded bg-white/5 text-gray-400 uppercase">
                      {p.replace('_', ' ')}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Change Account Password</h2>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl text-xs text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/30"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl text-xs text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/30"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Verification OTP</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    disabled={!otpSent}
                    placeholder="Enter OTP code"
                    className="flex-1 px-3 py-2.5 rounded-xl text-xs text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-40"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <button
                    type="button"
                    onClick={requestOtp}
                    disabled={sendingOtp || currentPassword.length === 0}
                    className="px-4 text-xs font-bold text-white rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 transition-colors"
                  >
                    {sendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send OTP'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPassword || !otpSent}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {changingPassword ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...</> : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADMINS MANAGEMENT TAB */}
      {activeTab === 'admins' && isSuperAdmin && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white">System Administrators</h2>
            <button
              onClick={() => setCreateOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Admin Account
            </button>
          </div>

          {/* List Admins */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            {loadingAdmins ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
            ) : admins.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">No administrators found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      {['Admin Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                        <th key={h} className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
                    {admins.map((adm) => (
                      <tr key={adm._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 font-semibold text-gray-200">{adm.name}</td>
                        <td className="px-5 py-3 text-gray-400">{adm.email}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            adm.isSuperAdmin ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'
                          }`}>
                            {adm.role}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            adm.isSuspended ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {adm.isSuspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[10px] text-gray-500">
                          {adm.lastLogin ? new Date(adm.lastLogin).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => viewAdminActivity(adm._id)}
                              title="Audit Trail"
                              className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-indigo-400 transition-colors"
                            >
                              <Activity className="w-3.5 h-3.5" />
                            </button>
                            {!adm.isSuperAdmin && (
                              <>
                                {adm.isSuspended ? (
                                  <button
                                    onClick={() => activateAdmin(adm._id)}
                                    title="Activate"
                                    className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-emerald-400 transition-colors"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => suspendAdmin(adm._id)}
                                    title="Suspend"
                                    className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-yellow-400 transition-colors"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteAdmin(adm._id)}
                                  title="Delete"
                                  className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Admin Account */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateAdmin} className="w-full max-w-lg rounded-2xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ background: '#12121e', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                Create Administrator
              </h2>
              <button type="button" onClick={() => setCreateOpen(false)} className="p-1 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder:text-gray-600 outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  required
                  placeholder="admin@workquora.com"
                  className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder:text-gray-600 outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Password</label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  required
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder:text-gray-600 outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={createMobile}
                  onChange={(e) => setCreateMobile(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder:text-gray-600 outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>

            {/* Permissions Checkbox Grid */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Role Permissions</label>
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.04)' }}>
                {permissionsList.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 cursor-pointer text-xs text-gray-400 hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={createPerms.includes(perm)}
                      onChange={() => toggleCreatePerm(perm)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="capitalize">{perm.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingAdmin}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {creatingAdmin ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...</> : 'Create Admin'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Activity Logs of Single Admin */}
      {selectedAdminLogs && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAdminLogs(null)}>
          <div className="w-full max-w-2xl rounded-2xl border p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}
            style={{ background: '#12121e', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Admin Activity Trail</h2>
              <button onClick={() => setSelectedAdminLogs(null)} className="p-1 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-2">
              {loadingLogs ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
              ) : selectedAdminLogs.length === 0 ? (
                <p className="text-center text-xs text-gray-500 py-6">No logs recorded for this administrator.</p>
              ) : (
                <div className="space-y-2.5">
                  {selectedAdminLogs.map((log) => (
                    <div key={log._id} className="p-3 rounded-xl border flex justify-between items-start text-xs hover:bg-white/[0.02] transition-colors"
                      style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.04)' }}>
                      <div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/5 text-gray-400 mr-2">{log.actionType}</span>
                        <span className="text-[9px] text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                        <p className="text-gray-300 font-semibold mt-1">{log.description}</p>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono select-all">IP: {log.ipAddress || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
