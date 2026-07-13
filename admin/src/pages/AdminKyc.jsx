import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search, ShieldCheck, X, Smartphone, CreditCard, FileText, Landmark, Camera,
  Check, XCircle, ExternalLink,
} from 'lucide-react';
import adminApi from '../api/adminApi';

const STEP_META = {
  aadhaar: { label: 'Aadhaar', icon: FileText, docKey: 'aadhaarDoc' },
  pan: { label: 'PAN', icon: CreditCard, docKey: 'panDoc' },
  bank: { label: 'Bank', icon: Landmark, docKey: null },
  selfie: { label: 'Selfie', icon: Camera, docKey: 'selfie' },
};

const TABS = ['All', 'Pending', 'Verified', 'Rejected'];

const useDebouncedValue = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const useAdminKyc = () =>
  useQuery({
    queryKey: ['admin-kyc'],
    queryFn: () => adminApi.get('/kyc/pending').then((r) => r.data?.data ?? []),
  });

const StatusBadge = ({ status }) => {
  const style =
    status === 'verified'
      ? 'bg-emerald-500/10 text-emerald-400'
      : status === 'rejected'
      ? 'bg-red-500/10 text-red-400'
      : 'bg-amber-500/10 text-amber-400';
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${style}`}>{status}</span>;
};

const StepDot = ({ verified, label, Icon }) => (
  <div title={`${label}: ${verified ? 'Verified' : 'Not verified'}`} className="flex flex-col items-center gap-0.5">
    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${verified ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-gray-600'}`}>
      <Icon className="w-3 h-3" />
    </div>
  </div>
);

const SkeletonRow = () => (
  <tr>
    <td colSpan={7} className="px-5 py-2">
      <div className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
    </td>
  </tr>
);

const EmptyState = ({ label, hint }) => (
  <div className="py-16 text-center">
    <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-gray-700" />
    <p className="font-semibold text-sm text-gray-300">{label}</p>
    {hint && <p className="text-xs text-gray-600 mt-1.5 max-w-sm mx-auto">{hint}</p>}
  </div>
);

const StepReview = ({ kyc, stepKey, onDone }) => {
  const meta = STEP_META[stepKey];
  const verified = !!kyc[`${stepKey === 'aadhaar' ? 'aadhaar' : stepKey}Verified`];
  const doc = meta.docKey ? kyc.documentUrls?.[meta.docKey] : null;
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: ({ decision, reason: r }) =>
      adminApi.patch(`/kyc/${kyc.userId._id || kyc.userId}/review`, { step: stepKey, decision, reason: r }),
    onSuccess: (_, { decision }) => {
      toast.success(`${meta.label} ${decision}d`);
      setRejecting(false);
      setReason('');
      onDone();
    },
    onError: (err) => toast.error(err.response?.data?.message || `Failed to review ${meta.label}`),
  });

  return (
    <div className="rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <meta.icon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-200">{meta.label}</span>
        </div>
        {verified ? (
          <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
            <Check className="w-3.5 h-3.5" /> Verified
          </span>
        ) : (
          <span className="text-xs font-bold text-gray-500">Not verified</span>
        )}
      </div>

      {doc?.url && (
        <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 mb-3 group">
          <img src={doc.url} alt={`${meta.label} document`} className="w-16 h-16 rounded-lg object-cover border" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
          <span className="text-[11px] text-gray-500 group-hover:text-primary flex items-center gap-1">
            View full document <ExternalLink className="w-3 h-3" />
          </span>
        </a>
      )}

      {!verified && (
        rejecting ? (
          <div className="space-y-2">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Rejection reason (required)..."
              rows={2}
              className="w-full text-xs text-gray-200 placeholder:text-gray-600 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-red-500/40"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <div className="flex gap-2">
              <button
                disabled={!reason.trim() || mutation.isPending}
                onClick={() => mutation.mutate({ decision: 'reject', reason: reason.trim() })}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 transition-colors"
              >
                Confirm Reject
              </button>
              <button onClick={() => { setRejecting(false); setReason(''); }} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:bg-white/5 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ decision: 'approve' })}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              disabled={mutation.isPending}
              onClick={() => setRejecting(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        )
      )}
    </div>
  );
};

const KycModal = ({ kyc, onClose }) => {
  const queryClient = useQueryClient();
  const refetchAndStay = () => queryClient.invalidateQueries({ queryKey: ['admin-kyc'] });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#12121e', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{kyc.userId?.name || 'Unknown user'}</h2>
            <p className="text-xs text-gray-500">{kyc.userId?.email}</p>
            <div className="mt-2">
              <StatusBadge status={kyc.status} />
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        {kyc.rejectionReason && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
            <span className="font-bold">Last rejection note: </span>
            {kyc.rejectionReason}
          </div>
        )}

        <div className="rounded-xl border p-4 mb-3 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-200">Mobile</span>
          </div>
          {kyc.isMobileVerified ? (
            <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold"><Check className="w-3.5 h-3.5" /> Verified</span>
          ) : (
            <span className="text-xs font-bold text-gray-500">Not verified — self-service, not admin-reviewable</span>
          )}
        </div>

        <div className="space-y-3">
          {Object.keys(STEP_META).map((stepKey) => (
            <StepReview key={stepKey} kyc={kyc} stepKey={stepKey} onDone={refetchAndStay} />
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminKyc = () => {
  const { data: kycs = [], isLoading } = useAdminKyc();
  const [tab, setTab] = useState('Pending');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const [reviewing, setReviewing] = useState(null);

  const filtered = useMemo(() => {
    let list = kycs;
    if (tab !== 'All') list = list.filter((k) => k.status === tab.toLowerCase());
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((k) => k.userId?.name?.toLowerCase().includes(q) || k.userId?.email?.toLowerCase().includes(q));
    }
    return list;
  }, [kycs, tab, search]);

  // Keep the modal's data fresh after a mutation invalidates the query
  const reviewingKyc = reviewing ? kycs.find((k) => (k.userId?._id || k.userId) === reviewing) || null : null;
  useEffect(() => {
    if (reviewing && !reviewingKyc) setReviewing(null); // closed if it fell out of the pending queue (fully reviewed)
  }, [reviewing, reviewingKyc]);

  const nonPendingTabSelected = tab === 'Verified' || tab === 'Rejected';

  return (
    <div>
      <h1 className="text-xl font-extrabold text-white mb-1">KYC Queue</h1>
      <p className="text-xs text-gray-500 mb-6">Review Aadhaar, PAN, bank, and selfie submissions awaiting approval</p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-primary/30"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {TABS.map((t) => (
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
        {isLoading ? (
          <table className="w-full"><tbody>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</tbody></table>
        ) : nonPendingTabSelected && filtered.length === 0 ? (
          <EmptyState
            label={`No ${tab.toLowerCase()} submissions to show`}
            hint="The KYC endpoint only returns pending submissions today — there's no backend route yet to list already-verified or rejected records."
          />
        ) : filtered.length === 0 ? (
          <EmptyState label="No KYC submissions found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {['User', 'Role', 'Mobile', 'PAN', 'Aadhaar', 'Bank', 'Selfie', 'Status', 'Submitted', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {filtered.map((k) => (
                  <tr key={k._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-primary shrink-0">
                          {k.userId?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-200 truncate">{k.userId?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-gray-500 truncate">{k.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${k.userId?.role === 'CLIENT' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {k.userId?.role || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StepDot verified={k.isMobileVerified} label="Mobile" Icon={Smartphone} /></td>
                    <td className="px-4 py-3"><StepDot verified={k.panVerified} label="PAN" Icon={CreditCard} /></td>
                    <td className="px-4 py-3"><StepDot verified={k.aadhaarVerified} label="Aadhaar" Icon={FileText} /></td>
                    <td className="px-4 py-3"><StepDot verified={k.bankVerified} label="Bank" Icon={Landmark} /></td>
                    <td className="px-4 py-3"><StepDot verified={k.selfieVerified} label="Selfie" Icon={Camera} /></td>
                    <td className="px-4 py-3"><StatusBadge status={k.status} /></td>
                    <td className="px-4 py-3 text-[10px] text-gray-500 whitespace-nowrap">{new Date(k.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setReviewing(k.userId?._id || k.userId)}
                        className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reviewingKyc && <KycModal kyc={reviewingKyc} onClose={() => setReviewing(null)} />}
    </div>
  );
};

export default AdminKyc;
