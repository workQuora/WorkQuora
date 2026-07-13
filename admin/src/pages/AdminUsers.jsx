import React, { useEffect, useState, useCallback } from 'react';
import { Search, Loader2, ChevronLeft, ChevronRight, Shield, ShieldX, Eye, Ban, UserCheck, UserX, X } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '../api/adminApi';

const AdminUsers = ({ roleProp }) => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  // roleFilter is now determined by the route (roleProp)
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', username: '', mobileNumber: '', role: '', isAvailable: true, isKycVerified: false, isEmailVerified: false });
  const [editSaving, setEditSaving] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (roleProp) params.role = roleProp;
      const res = await adminApi.get('/users', { params });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [roleProp]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = async () => {
    if (!search.trim()) return fetchUsers();
    setLoading(true);
    try {
      const params = { q: search };
      if (roleProp) params.role = roleProp;
      const res = await adminApi.get('/users/search', { params });
      setUsers(res.data.data);
      setPagination({ page: 1, pages: 1, total: res.data.count });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const viewUser = async (userId) => {
    setDetailLoading(true);
    try {
      const res = await adminApi.get(`/users/${userId}`);
      setSelectedUser(res.data.data);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  const handleAction = async (userId, action) => {
    try {
      await adminApi.put(`/users/${userId}/${action}`);
      fetchUsers(pagination.page);
      if (selectedUser?._id === userId) viewUser(userId);
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const handleKycReview = async (userId, step, decision, reason = '') => {
    try {
      await adminApi.patch(`/kyc/${userId}/review`, { step, decision, reason });
      toast.success(`KYC ${step} ${decision}d successfully!`);
      viewUser(userId);
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'KYC review failed');
    }
  };

  const startEditing = () => {
    setEditForm({
      name: selectedUser.name || '',
      email: selectedUser.email || '',
      username: selectedUser.username || '',
      mobileNumber: selectedUser.mobileNumber || '',
      role: selectedUser.role || 'CLIENT',
      isAvailable: selectedUser.isAvailable !== false,
      isKycVerified:  !!selectedUser.isKycVerified,
      isEmailVerified: !!selectedUser.isEmailVerified
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setEditSaving(true);
    try {
      await adminApi.put(`/users/${selectedUser._id}`, editForm);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      viewUser(selectedUser._id);
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-extrabold text-white mb-1">
        {roleProp === 'CLIENT' ? 'Client Management' : roleProp === 'FREELANCER' ? 'Freelancer Management' : 'User Management'}
      </h1>
      <p className="text-xs text-gray-500 mb-6">Search, view, and manage {roleProp ? roleProp.toLowerCase() + 's' : 'all users'} on the platform</p>

      {/* Search & filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name, email, mobile, username, or ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-primary/30"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>

        <button onClick={handleSearch}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          Search
        </button>
      </div>

      {/* Users table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    {['User', 'Email', 'Role', 'KYC', 'Status', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 cursor-pointer" onClick={() => viewUser(u._id)}>
                        <div className="flex items-center gap-3">
                          <img src={u.profilePic || u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                            className="w-8 h-8 rounded-lg object-cover" style={{ background: 'rgba(99,102,241,0.1)' }} />
                          <div>
                            <p className="text-xs font-semibold text-gray-200">{u.name}</p>
                            <p className="text-[10px] text-gray-500">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400 cursor-pointer" onClick={() => viewUser(u._id)}>{u.email}</td>
                      <td className="px-5 py-3 cursor-pointer" onClick={() => viewUser(u._id)}>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.role === 'CLIENT' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-5 py-3">
                        {u.isKycVerified || u.kyc?.aadhaarVerified
                          ? <Shield className="w-4 h-4 text-emerald-400" />
                          : <ShieldX className="w-4 h-4 text-red-400" />}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.isAvailable !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>{u.isAvailable !== false ? 'Active' : 'Suspended'}</span>
                      </td>
                      <td className="px-5 py-3 text-[10px] text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => viewUser(u._id)} title="View" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-primary"><Eye className="w-3.5 h-3.5" /></button>
                          {u.isAvailable !== false
                            ? <button onClick={() => handleAction(u._id, 'suspend')} title="Suspend" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-yellow-400"><UserX className="w-3.5 h-3.5" /></button>
                            : <button onClick={() => handleAction(u._id, 'activate')} title="Activate" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-emerald-400"><UserCheck className="w-3.5 h-3.5" /></button>}
                          <button onClick={() => handleAction(u._id, 'block')} title="Block" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-400"><Ban className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-gray-500">{pagination.total} users · Page {pagination.page} of {pagination.pages}</p>
              <div className="flex gap-1.5">
                <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#12121e', borderColor: 'rgba(255,255,255,0.08)' }}>
            {detailLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white">User Profile</h2>
                    {!isEditing ? (
                      <button onClick={startEditing} className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-colors">Edit Profile</button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={handleSaveProfile} disabled={editSaving} className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-colors">{editSaving ? 'Saving...' : 'Save'}</button>
                        <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-xs font-bold transition-colors">Cancel</button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setSelectedUser(null); setIsEditing(false); }} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-4 h-4" /></button>
                </div>

                {/* Basic info */}
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex flex-col gap-1 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Name</label>
                      <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="bg-transparent text-xs font-semibold text-gray-200 outline-none border-b border-gray-700 focus:border-primary py-0.5" />
                    </div>
                    <div className="flex flex-col gap-1 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Email</label>
                      <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="bg-transparent text-xs font-semibold text-gray-200 outline-none border-b border-gray-700 focus:border-primary py-0.5" />
                    </div>
                    <div className="flex flex-col gap-1 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Username</label>
                      <input type="text" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="bg-transparent text-xs font-semibold text-gray-200 outline-none border-b border-gray-700 focus:border-primary py-0.5" />
                    </div>
                    <div className="flex flex-col gap-1 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Mobile</label>
                      <input type="text" value={editForm.mobileNumber} onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                        className="bg-transparent text-xs font-semibold text-gray-200 outline-none border-b border-gray-700 focus:border-primary py-0.5" />
                    </div>
                    <div className="flex flex-col gap-1 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Role</label>
                      <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="bg-[#12121e] text-xs font-semibold text-gray-200 outline-none border-b border-gray-700 focus:border-primary py-0.5">
                        <option value="CLIENT">CLIENT</option>
                        <option value="FREELANCER">FREELANCER</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Status</label>
                      <select value={editForm.isAvailable} onChange={(e) => setEditForm({ ...editForm, isAvailable: e.target.value === 'true' })}
                        className="bg-[#12121e] text-xs font-semibold text-gray-200 outline-none border-b border-gray-700 focus:border-primary py-0.5">
                        <option value="true">Active</option>
                        <option value="false">Suspended</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">KYC Verified</label>
                      <select value={editForm.isKycVerified} onChange={(e) => setEditForm({ ...editForm, isKycVerified: e.target.value === 'true', isEmailVerified: e.target.value === 'true' })}
                        className="bg-[#12121e] text-xs font-semibold text-gray-200 outline-none border-b border-gray-700 focus:border-primary py-0.5">
                        <option value="true">Verified</option>
                        <option value="false">Not Verified</option>
                      </select>
                    </div>
                    <div className="px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">Joined</p>
                      <p className="text-xs font-semibold text-gray-400 mt-0.5">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      ['Name', selectedUser.name], ['Email', selectedUser.email],
                      ['Username', selectedUser.username ? `@${selectedUser.username}` : '—'], ['Mobile', selectedUser.mobileNumber || '—'],
                      ['Role', selectedUser.role], ['KYC', selectedUser.isKycVerified ? '✅ Verified' : '❌ Not Verified'],
                      ['Joined', new Date(selectedUser.createdAt).toLocaleDateString()],
                      ['Status', selectedUser.isAvailable !== false ? '🟢 Active' : '🔴 Suspended'],
                    ].map(([k, v]) => (
                      <div key={k} className="px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">{k}</p>
                        <p className="text-xs font-semibold text-gray-200 mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* KYC details */}
                {selectedUser.kyc && (
                  <div className="mb-4 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">KYC Details & Review</h3>
                    <div className="space-y-4 text-xs">
                      
                      {/* Aadhaar */}
                      <div className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-semibold">Aadhaar:</span> 
                          <span className="text-gray-300 font-bold">{selectedUser.kyc.aadhaarVerified ? '✅ Verified' : '❌ Pending'}</span>
                        </div>
                        {selectedUser.kyc.documentUrls?.aadhaarDocUrl && (
                          <div className="mt-2">
                            <a href={selectedUser.kyc.documentUrls.aadhaarDocUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">View Aadhaar Document</a>
                          </div>
                        )}
                        {!selectedUser.kyc.aadhaarVerified && (
                          <div className="flex gap-2">
                            <button onClick={() => handleKycReview(selectedUser._id, 'aadhaar', 'approve')} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30">Approve</button>
                            <button onClick={() => handleKycReview(selectedUser._id, 'aadhaar', 'reject')} className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">Reject</button>
                          </div>
                        )}
                      </div>

                      {/* PAN */}
                      <div className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-semibold">PAN:</span> 
                          <span className="text-gray-300 font-bold">{selectedUser.kyc.panVerified ? '✅ Verified' : '❌ Pending'}</span>
                        </div>
                        {selectedUser.kyc.documentUrls?.panDocUrl && (
                          <div className="mt-2">
                            <a href={selectedUser.kyc.documentUrls.panDocUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">View PAN Document</a>
                          </div>
                        )}
                        {!selectedUser.kyc.panVerified && (
                          <div className="flex gap-2">
                            <button onClick={() => handleKycReview(selectedUser._id, 'pan', 'approve')} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30">Approve</button>
                            <button onClick={() => handleKycReview(selectedUser._id, 'pan', 'reject')} className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">Reject</button>
                          </div>
                        )}
                      </div>

                      {/* Bank */}
                      <div className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-semibold">Bank:</span> 
                          <span className="text-gray-300 font-bold">{selectedUser.kyc.bankVerified ? '✅ Verified' : '❌ Pending'}</span>
                        </div>
                        {selectedUser.kyc.bankAccount && (
                          <div className="text-xs text-gray-400 mb-2">
                            <div>Acc: <span className="text-gray-200">{selectedUser.kyc.bankAccount.accountNumber || 'N/A'}</span></div>
                            <div>IFSC: <span className="text-gray-200">{selectedUser.kyc.bankAccount.ifsc || 'N/A'}</span></div>
                            <div>Name: <span className="text-gray-200">{selectedUser.kyc.bankAccount.holderName || 'N/A'}</span></div>
                          </div>
                        )}
                        {selectedUser.kyc.documentUrls?.bankDocUrl && (
                          <div className="mt-2">
                            <a href={selectedUser.kyc.documentUrls.bankDocUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">View Bank Proof</a>
                          </div>
                        )}
                        {!selectedUser.kyc.bankVerified && (
                          <div className="flex gap-2">
                            <button onClick={() => handleKycReview(selectedUser._id, 'bank', 'approve')} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30">Approve</button>
                            <button onClick={() => handleKycReview(selectedUser._id, 'bank', 'reject')} className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">Reject</button>
                          </div>
                        )}
                      </div>

                      {/* Selfie */}
                      <div className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-semibold">Selfie:</span> 
                          <span className="text-gray-300 font-bold">{selectedUser.kyc.selfieVerified ? '✅ Verified' : '❌ Pending'}</span>
                        </div>
                        {selectedUser.kyc.documentUrls?.selfieUrl && (
                          <div className="mt-2">
                            <a href={selectedUser.kyc.documentUrls.selfieUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-block mb-2">View Selfie Document</a>
                            <img src={selectedUser.kyc.documentUrls.selfieUrl} alt="Selfie" className="w-32 h-32 rounded-lg object-cover border" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                          </div>
                        )}
                        {!selectedUser.kyc.selfieVerified && (
                          <div className="flex gap-2">
                            <button onClick={() => handleKycReview(selectedUser._id, 'selfie', 'approve')} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30">Approve</button>
                            <button onClick={() => handleKycReview(selectedUser._id, 'selfie', 'reject')} className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">Reject</button>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center p-2"><span className="text-gray-500">Overall Status:</span> <span className="text-gray-300 font-bold capitalize">{selectedUser.kyc.status || 'N/A'}</span></div>
                    </div>
                  </div>
                )}

                {/* Wallet/Earnings */}
                {selectedUser.earnings && (
                  <div className="mb-4 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Earnings</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">All Time:</span> <span className="text-emerald-400 font-bold">₹{selectedUser.earnings.allTimeIncome || 0}</span></div>
                      <div><span className="text-gray-500">Completed Jobs:</span> <span className="text-gray-300">{selectedUser.earnings.completedJobs || 0}</span></div>
                    </div>
                  </div>
                )}

                {/* Recent jobs */}
                {selectedUser.jobs?.length > 0 && (
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Recent Jobs ({selectedUser.jobs.length})</h3>
                    <div className="space-y-2">
                      {selectedUser.jobs.slice(0, 5).map((j) => (
                        <div key={j._id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-300 truncate max-w-[60%]">{j.title}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            j.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400'
                            : j.status === 'cancelled' ? 'bg-red-500/10 text-red-400'
                            : 'bg-blue-500/10 text-blue-400'
                          }`}>{j.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
