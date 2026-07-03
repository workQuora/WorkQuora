import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Search, Scale, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import adminApi from '../api/adminApi';

const STATUS_TABS = ['All', 'Open', 'Under Review', 'Resolved', 'Closed'];
const STATUS_MAP = { Open: 'OPEN', 'Under Review': 'UNDER_REVIEW', Resolved: 'RESOLVED', Closed: 'CLOSED' };

const STATUS_STYLE = {
  OPEN: 'bg-amber-500/10 text-amber-400',
  UNDER_REVIEW: 'bg-blue-500/10 text-blue-400',
  CLIENT_RESPONSE: 'bg-blue-500/10 text-blue-400',
  FREELANCER_RESPONSE: 'bg-blue-500/10 text-blue-400',
  RESOLVED: 'bg-emerald-500/10 text-emerald-400',
  CLOSED: 'bg-gray-500/10 text-gray-400',
};

const StatusBadge = ({ status }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_STYLE[status] || 'bg-gray-500/10 text-gray-400'}`}>
    {status?.replace('_', ' ')}
  </span>
);

const money = (n, currency = 'INR') => `${currency === 'INR' ? '₹' : currency + ' '}${Number(n || 0).toLocaleString('en-IN')}`;

const SkeletonRow = () => (
  <tr>
    <td colSpan={7} className="px-5 py-2">
      <div className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
    </td>
  </tr>
);

const disputedAmount = (dispute) => {
  const escrow = dispute?.escrowId;
  if (!escrow) return 0;
  if (dispute.milestoneId && Array.isArray(escrow.milestones)) {
    const m = escrow.milestones.find((ms) => (ms._id || ms.id) === dispute.milestoneId || String(ms._id) === String(dispute.milestoneId));
    if (m) return m.amount;
  }
  return escrow.totalAmount || 0;
};

const ResolvePanel = ({ dispute, onClose, onResolved }) => {
  const amount = disputedAmount(dispute);
  const currency = dispute.escrowId?.currency || 'INR';
  const [mode, setMode] = useState('client'); // client | freelancer | split
  const [splitPercent, setSplitPercent] = useState(50); // client %
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const clientRefund = mode === 'client' ? amount : mode === 'freelancer' ? 0 : Math.round((amount * splitPercent) / 100);
  const freelancerPayout = amount - clientRefund;

  const submit = async () => {
    if (!note.trim()) return toast.error('Resolution note is required');
    setSubmitting(true);
    try {
      await adminApi.post(`/disputes/${dispute._id}/resolve`, { clientRefund, freelancerPayout, note: note.trim() });
      toast.success('Dispute resolved');
      onResolved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border p-4 mt-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <p className="text-xs font-bold text-gray-300 mb-3">Resolve — {money(amount, currency)} in dispute</p>

      <div className="flex gap-2 mb-3">
        {[
          { key: 'client', label: 'Full refund to client' },
          { key: 'freelancer', label: 'Release to freelancer' },
          { key: 'split', label: 'Split' },
        ].map((o) => (
          <button
            key={o.key}
            onClick={() => setMode(o.key)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              mode === o.key ? 'bg-primary/15 text-primary' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {mode === 'split' && (
        <div className="mb-3">
          <input
            type="range"
            min={0}
            max={100}
            value={splitPercent}
            onChange={(e) => setSplitPercent(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>Client: {money(clientRefund, currency)} ({splitPercent}%)</span>
            <span>Freelancer: {money(freelancerPayout, currency)} ({100 - splitPercent}%)</span>
          </div>
        </div>
      )}
      {mode !== 'split' && (
        <p className="text-[11px] text-gray-500 mb-3">
          Client: {money(clientRefund, currency)} · Freelancer: {money(freelancerPayout, currency)}
        </p>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Resolution note (required, shown in dispute timeline)..."
        rows={2}
        className="w-full text-xs text-gray-200 placeholder:text-gray-600 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary/40 mb-3"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      />

      <div className="flex gap-2">
        <button
          disabled={submitting || !note.trim()}
          onClick={submit}
          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-primary hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {submitting ? 'Resolving...' : 'Confirm Resolution'}
        </button>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:bg-white/5 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
};

const DisputeModal = ({ disputeId, onClose, onResolved }) => {
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/disputes/${disputeId}`);
      setDispute(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load dispute');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [disputeId, onClose]);

  useEffect(() => { load(); }, [load]);

  const isResolved = dispute?.status === 'RESOLVED' || dispute?.status === 'CLOSED';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#12121e', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        {loading || !dispute ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{dispute.escrowId?.jobId?.title || 'Untitled job'}</h2>
                <div className="mt-2"><StatusBadge status={dispute.status} /></div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border p-3" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Client</p>
                <p className="text-xs font-semibold text-gray-200">{dispute.escrowId?.clientId?.name || '—'}</p>
              </div>
              <div className="rounded-xl border p-3" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Freelancer</p>
                <p className="text-xs font-semibold text-gray-200">{dispute.escrowId?.freelancerId?.name || '—'}</p>
              </div>
            </div>

            <div className="rounded-xl border p-3 mb-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                Filed by {dispute.openedBy?.name || 'unknown'} ({dispute.openedBy?.role}) against {dispute.againstUser?.name || 'unknown'}
              </p>
              <p className="text-xs text-gray-300 leading-relaxed">{dispute.reason}</p>
            </div>

            {dispute.evidenceUrls?.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1.5">Evidence</p>
                <div className="flex flex-wrap gap-2">
                  {dispute.evidenceUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline">
                      Attachment {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {dispute.timeline?.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1.5">Timeline</p>
                <div className="space-y-2">
                  {dispute.timeline.map((t, i) => (
                    <div key={i} className="text-[11px] text-gray-400 flex gap-2">
                      <span className="text-gray-600 shrink-0">{new Date(t.timestamp).toLocaleDateString('en-IN')}</span>
                      <span><span className="font-semibold text-gray-300">{t.user}</span> — {t.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isResolved ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-300">
                Resolved — Client {money(dispute.resolutionSplit?.clientRefund, dispute.escrowId?.currency)} · Freelancer{' '}
                {money(dispute.resolutionSplit?.freelancerPayout, dispute.escrowId?.currency)}
              </div>
            ) : resolving ? (
              <ResolvePanel dispute={dispute} onClose={() => setResolving(false)} onResolved={() => { onResolved(); onClose(); }} />
            ) : (
              <button
                onClick={() => setResolving(true)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-primary hover:opacity-90 transition-opacity"
              >
                Resolve Dispute
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="py-16 text-center">
    <Scale className="w-10 h-10 mx-auto mb-3 text-gray-700" />
    <p className="font-semibold text-sm text-gray-300">No disputes found</p>
  </div>
);

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const fetchDisputes = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (tab !== 'All') params.status = STATUS_MAP[tab];
      const res = await adminApi.get('/disputes', { params });
      setDisputes(res.data.data || []);
      setPagination({ page: res.data.page, pages: res.data.totalPages || 1, total: res.data.total || 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchDisputes(1); }, [fetchDisputes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return disputes;
    const q = search.trim().toLowerCase();
    return disputes.filter(
      (d) =>
        d.escrowId?.jobId?.title?.toLowerCase().includes(q) ||
        d.escrowId?.clientId?.name?.toLowerCase().includes(q) ||
        d.escrowId?.freelancerId?.name?.toLowerCase().includes(q)
    );
  }, [disputes, search]);

  return (
    <div>
      <h1 className="text-xl font-extrabold text-white mb-1">Disputes</h1>
      <p className="text-xs text-gray-500 mb-6">Review and resolve escrow disputes between clients and freelancers</p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title or user name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-primary/30"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1 flex-wrap" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                tab === t ? 'bg-primary/15 text-primary' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
        {loading ? (
          <table className="w-full"><tbody>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</tbody></table>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    {['Job', 'Client', 'Freelancer', 'Reason', 'Amount', 'Status', 'Filed', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {filtered.map((d) => (
                    <tr key={d._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-xs font-semibold text-gray-200 max-w-[160px] truncate">{d.escrowId?.jobId?.title || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{d.escrowId?.clientId?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{d.escrowId?.freelancerId?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-[180px] truncate" title={d.reason}>{d.reason}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-200 whitespace-nowrap">{money(disputedAmount(d), d.escrowId?.currency)}</td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3 text-[10px] text-gray-500 whitespace-nowrap">{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedId(d._id)}
                          className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                        >
                          {d.status === 'RESOLVED' || d.status === 'CLOSED' ? 'View' : 'Resolve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-gray-500">{pagination.total} disputes · Page {pagination.page} of {pagination.pages}</p>
              <div className="flex gap-1.5">
                <button onClick={() => fetchDisputes(pagination.page - 1)} disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => fetchDisputes(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedId && (
        <DisputeModal disputeId={selectedId} onClose={() => setSelectedId(null)} onResolved={() => fetchDisputes(pagination.page)} />
      )}
    </div>
  );
};

export default AdminDisputes;
