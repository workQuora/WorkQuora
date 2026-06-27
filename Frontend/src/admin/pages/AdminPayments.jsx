import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Eye, RefreshCw, AlertTriangle, ShieldCheck, ArrowUpRight, ArrowDownLeft, X, Wallet as WalletIcon, DollarSign } from 'lucide-react';
import adminApi from '../api/adminApi';

const AdminPayments = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  
  // Transactions tab states
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loadingTxns, setLoadingTxns] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  // Wallets tab states
  const [wallets, setWallets] = useState([]);
  const [walletPagination, setWalletPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loadingWallets, setLoadingWallets] = useState(true);

  // Earnings tab states
  const [earnings, setEarnings] = useState(null);
  const [loadingEarnings, setLoadingEarnings] = useState(true);

  // Fetch Transactions
  const fetchTransactions = useCallback(async (page = 1) => {
    setLoadingTxns(true);
    try {
      const params = { page, limit: 15 };
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.get('/payments', { params });
      setTransactions(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTxns(false);
    }
  }, [typeFilter, statusFilter]);

  // Fetch Wallets
  const fetchWallets = useCallback(async (page = 1) => {
    setLoadingWallets(true);
    try {
      const params = { page, limit: 15 };
      const res = await adminApi.get('/payments/wallets', { params });
      setWallets(res.data.data || []);
      setWalletPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWallets(false);
    }
  }, []);

  // Fetch Earnings
  const fetchEarnings = useCallback(async () => {
    setLoadingEarnings(true);
    try {
      const res = await adminApi.get('/payments/earnings');
      setEarnings(res.data.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEarnings(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    } else if (activeTab === 'wallets') {
      fetchWallets();
    } else if (activeTab === 'earnings') {
      fetchEarnings();
    }
  }, [activeTab, fetchTransactions, fetchWallets, fetchEarnings]);

  const viewTransactionDetail = async (id) => {
    try {
      const res = await adminApi.get(`/payments/${id}`);
      setSelectedTxn(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    if (!selectedTxn) return;
    setRefunding(true);
    try {
      await adminApi.post(`/payments/${selectedTxn._id}/refund`, { reason: refundReason });
      alert('Refund processed successfully.');
      setRefundModalOpen(false);
      setRefundReason('');
      fetchTransactions(pagination.page);
      // Update selected transaction view
      viewTransactionDetail(selectedTxn._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process refund.');
    } finally {
      setRefunding(false);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    completed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    failed: 'bg-red-500/10 text-red-400 border border-red-500/20',
    refunded: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  };

  const typeColors = {
    deposit: 'text-emerald-400',
    escrow: 'text-yellow-400',
    payout: 'text-red-400',
    refund: 'text-indigo-400',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white mb-1">Payment & Escrow Management</h1>
        <p className="text-xs text-gray-500">Monitor transactions, escrow releases, refunds, and wallet balances</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 space-x-6">
        {[
          { id: 'transactions', label: 'Transactions History' },
          { id: 'wallets', label: 'User Wallets' },
          { id: 'earnings', label: 'Earnings Overview' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TRANSACTIONS TAB */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-xs text-gray-300 outline-none cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="escrow">Escrow Hold/Release</option>
              <option value="payout">Payout</option>
              <option value="refund">Refund</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-xs text-gray-300 outline-none cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <button
              onClick={() => fetchTransactions(1)}
              className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Table */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            {loadingTxns ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">No transactions found.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        {['Txn ID', 'User Ref', 'Type', 'Amount', 'Status', 'Date', 'Actions'].map((h) => (
                          <th key={h} className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
                      {transactions.map((t) => (
                        <tr key={t._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 text-xs font-mono text-gray-400 truncate max-w-[120px]" title={t._id}>{t._id}</td>
                          <td className="px-5 py-3 text-xs text-gray-300 truncate max-w-[150px]" title={t.userId || t.from || 'System'}>
                            {t.userId || t.from || 'System'}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-[10px] font-bold capitalize ${typeColors[t.type] || 'text-gray-400'}`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs font-bold text-white">
                            ₹{t.amount ? (t.amount / 100).toLocaleString() : 0}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${statusColors[t.status] || 'text-gray-400'}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[10px] text-gray-500">
                            {new Date(t.createdAt).toLocaleString()}
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => viewTransactionDetail(t._id)}
                              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-indigo-400 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] text-gray-500">{pagination.total} records · Page {pagination.page} of {pagination.pages}</p>
                  <div className="flex gap-1.5">
                    <button onClick={() => fetchTransactions(pagination.page - 1)} disabled={pagination.page <= 1} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => fetchTransactions(pagination.page + 1)} disabled={pagination.page >= pagination.pages} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* WALLETS TAB */}
      {activeTab === 'wallets' && (
        <div className="space-y-4">
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            {loadingWallets ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
            ) : wallets.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">No wallets found.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        {['Wallet ID', 'User Name', 'Email', 'Role', 'Balance', 'Last Updated'].map((h) => (
                          <th key={h} className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
                      {wallets.map((w) => (
                        <tr key={w._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 text-xs font-mono text-gray-400">{w._id}</td>
                          <td className="px-5 py-3">
                            <p className="text-xs font-semibold text-gray-200">{w.userInfo?.name || '—'}</p>
                            <p className="text-[10px] text-gray-500">@{w.userInfo?.username || 'unknown'}</p>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-400">{w.userInfo?.email || '—'}</td>
                          <td className="px-5 py-3">
                            {w.userInfo?.role ? (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                w.userInfo.role === 'CLIENT' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                              }`}>{w.userInfo.role}</span>
                            ) : '—'}
                          </td>
                          <td className="px-5 py-3 text-xs font-extrabold text-white">
                            ₹{(w.balance || 0).toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-[10px] text-gray-500">
                            {new Date(w.updatedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] text-gray-500">{walletPagination.total} wallets · Page {walletPagination.page} of {walletPagination.pages}</p>
                  <div className="flex gap-1.5">
                    <button onClick={() => fetchWallets(walletPagination.page - 1)} disabled={walletPagination.page <= 1} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => fetchWallets(walletPagination.page + 1)} disabled={walletPagination.page >= walletPagination.pages} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* EARNINGS OVERVIEW TAB */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          {loadingEarnings ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
          ) : !earnings ? (
            <div className="text-center py-12 text-gray-500 text-sm">Failed to retrieve earnings overview.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded-full">All-Time</span>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Platform Revenue</h3>
                  <p className="text-3xl font-black text-white mt-1">₹{(earnings.totalEarned || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-2xl border p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full">Jobs Completed</span>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Completed Projects</h3>
                  <p className="text-3xl font-black text-white mt-1">{(earnings.totalCompleted || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-2xl border p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <WalletIcon className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded-full">Freelancers</span>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Active Freelancer Accounts</h3>
                  <p className="text-3xl font-black text-white mt-1">{(earnings.count || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTxn(null)}>
          <div className="w-full max-w-lg rounded-2xl border p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}
            style={{ background: '#12121e', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Transaction Details</h2>
              <button onClick={() => setSelectedTxn(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ['Transaction ID', selectedTxn._id],
                  ['Type', selectedTxn.type],
                  ['Amount', `₹${selectedTxn.amount ? (selectedTxn.amount / 100).toLocaleString() : 0}`],
                  ['Status', selectedTxn.status],
                  ['User ID', selectedTxn.userId || '—'],
                  ['From Address', selectedTxn.from || '—'],
                  ['Created At', new Date(selectedTxn.createdAt).toLocaleString()],
                  ['Updated At', new Date(selectedTxn.updatedAt).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{k}</p>
                    <p className="text-xs font-semibold text-gray-200 mt-0.5 truncate select-all">{v}</p>
                  </div>
                ))}
              </div>

              {/* User detail enrichment if available */}
              {selectedTxn.userInfo && (
                <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Associated User Account</h3>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-gray-200">{selectedTxn.userInfo.name}</p>
                      <p className="text-gray-500 text-[10px]">@{selectedTxn.userInfo.username} · {selectedTxn.userInfo.role}</p>
                    </div>
                    <p className="text-gray-400">{selectedTxn.userInfo.email}</p>
                  </div>
                </div>
              )}

              {/* Refund Action Card */}
              {selectedTxn.status === 'completed' && selectedTxn.type === 'deposit' && (
                <div className="pt-4 border-t border-white/5 flex justify-end">
                  <button
                    onClick={() => setRefundModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    Initiate Refund
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {refundModalOpen && selectedTxn && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRefund} className="w-full max-w-md rounded-2xl border p-6 space-y-4"
            style={{ background: '#181829', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 animate-bounce" />
                Confirm Payment Refund
              </h2>
              <button type="button" onClick={() => setRefundModalOpen(false)} className="p-1 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            
            <p className="text-xs text-gray-400">
              You are about to refund <span className="font-semibold text-white">₹{selectedTxn.amount ? (selectedTxn.amount / 100).toLocaleString() : 0}</span> for transaction <span className="font-mono text-white">{selectedTxn._id}</span>. This action will credit the user's wallet balance.
            </p>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Reason for Refund</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                required
                placeholder="e.g. Project dispute arbitration, accidental double payment..."
                rows="3"
                className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/30"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={refunding}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {refunding ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</> : 'Process Refund'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
