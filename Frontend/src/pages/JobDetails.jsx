import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Briefcase, Clock, ShieldCheck, Loader2, ChevronLeft, Users, Calendar,
  CheckCircle2, XCircle, MessageSquare, Phone, User2, IndianRupee, Send, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const formatBudget = (job) => {
  const min = job?.budgetRange?.min;
  const max = job?.budgetRange?.max;
  if (min != null && max != null) return `₹${min.toLocaleString('en-IN')} – ₹${max.toLocaleString('en-IN')}`;
  if (min != null) return `₹${min.toLocaleString('en-IN')}`;
  return 'Budget on request';
};

const timeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { role, isAuthenticated, user } = useSelector((s) => s.auth);

  const [showProposal, setShowProposal] = useState(false);
  const [proposal, setProposal] = useState({ coverLetter: '', bidAmount: '', estimatedDays: '7' });

  const { data: jobData, isLoading, isError } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.get(`/jobs/${id}`).then((r) => r.data?.data ?? r.data),
    enabled: !!id,
  });

  const job = jobData?.job ?? jobData;
  const proposals = jobData?.proposals ?? job?.proposals ?? [];
  const myProposal = jobData?.myProposal ?? job?.myProposal ?? null;
  const isJobOwner = job?.client === user?.id;
  const isFreelancer = role?.toUpperCase() === 'FREELANCER';
  const isClient = role?.toUpperCase() === 'CLIENT';

  // Submit proposal — use /proposals/:jobId (correct endpoint)
  const applyMutation = useMutation({
    mutationFn: (data) => api.post(`/proposals/${id}`, data),
    onSuccess: () => {
      toast.success('Proposal submitted! 🎉');
      setShowProposal(false);
      setProposal({ coverLetter: '', bidAmount: '', estimatedDays: '7' });
      qc.invalidateQueries({ queryKey: ['job', id] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to submit proposal.'),
  });

  // Accept proposal
  const acceptMutation = useMutation({
    mutationFn: (proposalId) => api.put(`/proposals/${proposalId}/accept`),
    onSuccess: () => {
      toast.success('Proposal accepted! Freelancer has been assigned.');
      qc.invalidateQueries({ queryKey: ['job', id] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to accept proposal.'),
  });

  // Reject proposal
  const rejectMutation = useMutation({
    mutationFn: (proposalId) => api.put(`/proposals/${proposalId}/reject`),
    onSuccess: () => {
      toast.success('Proposal rejected.');
      qc.invalidateQueries({ queryKey: ['job', id] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to reject proposal.'),
  });

  // Complete job mutation
  const completeMutation = useMutation({
    mutationFn: () => api.put(`/jobs/${id}/complete`),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Completion request registered! 🎉');
      qc.invalidateQueries({ queryKey: ['job', id] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to complete job.'),
  });

  // Cancel job mutation
  const cancelMutation = useMutation({
    mutationFn: () => api.put(`/jobs/${id}/cancel`),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Cancellation request registered! 🚫');
      qc.invalidateQueries({ queryKey: ['job', id] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to cancel job.'),
  });

  const handleProposal = (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/auth'); return; }
    if (!isFreelancer) { toast.error('Only freelancers can apply.'); return; }
    applyMutation.mutate({
      coverLetter: proposal.coverLetter,
      bidAmount: Number(proposal.bidAmount),
      estimatedDays: Number(proposal.estimatedDays),
    });
  };

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (isError || !job) return (
    <div className="min-h-screen bg-background text-foreground p-10 text-center">
      <Briefcase className="w-16 h-16 mx-auto text-muted-foreground opacity-20 mb-4" />
      <p className="text-muted-foreground text-lg mb-4">Job not found or failed to load.</p>
      <button onClick={() => navigate('/discover')} className="text-primary hover:underline cursor-pointer">← Back to Discover</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-6 lg:p-10 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {/* Hero Card */}
        <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase">{job.category}</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
              job.status === 'open' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
              job.status === 'in-progress' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
              'bg-muted text-muted-foreground'
            }`}>{job.status}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight text-foreground">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-5 text-muted-foreground text-sm font-medium">
            <span className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> {job.category}</span>
            {job.location?.address && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {job.location.address}</span>}
            <span className="flex items-center gap-2" title={new Date(job.createdAt).toLocaleString('en-IN')}>
              <Calendar className="w-4 h-4" />
              {new Date(job.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
              <span className="text-xs text-muted-foreground/70">({timeAgo(job.createdAt)})</span>
            </span>
            {proposals.length > 0 && <span className="flex items-center gap-2"><Users className="w-4 h-4" /> {proposals.length} proposals</span>}
            {job.clientInfo && (
              <span className="flex items-center gap-1">
                <User2 className="w-3.5 h-3.5 text-primary" />
                by
                <button
                  onClick={() => navigate(`/freelancer/${job.client}`)}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  {job.clientInfo.name} (@{job.clientInfo.username || 'client'})
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Contract Status Card */}
        {job.status !== 'open' && (
          <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">
                    {job.status === 'in-progress' ? 'Active Job Agreement' :
                     job.status === 'completed' ? 'Contract Completed' : 'Contract Cancelled'}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Budget in Escrow: <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{job.budget?.toLocaleString('en-IN') || 0}</span>
                </p>
                {job.status === 'in-progress' && (
                  <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-foreground/80">
                      Freelancer: {job.completionRequestedByFreelancer ? (
                        <span className="text-emerald-500 font-bold">Approved ✓</span>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5 text-foreground/80">
                      Client: {job.completionRequestedByClient ? (
                        <span className="text-emerald-500 font-bold">Approved ✓</span>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </span>
                  </div>
                )}
                {(job.cancellationRequestedByClient || job.cancellationRequestedByFreelancer) && job.status === 'in-progress' && (
                  <div className="flex flex-wrap gap-4 pt-1 text-xs font-semibold text-red-500">
                    <span className="flex items-center gap-1">
                      Cancellation Requests — Client: {job.cancellationRequestedByClient ? 'Yes' : 'No'}, Freelancer: {job.cancellationRequestedByFreelancer ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                {job.status === 'in-progress' && (
                  <>
                    {/* Freelancer Actions */}
                    {job.assignedTo === user?.id && (
                      <>
                        {!job.completionRequestedByFreelancer ? (
                          <button
                            onClick={() => completeMutation.mutate()}
                            disabled={completeMutation.isPending}
                            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {job.completionRequestedByClient ? 'Approve Completion' : 'Mark as Completed'}
                          </button>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-4 py-2.5 rounded-xl font-bold text-xs">
                            Awaiting Client Approval
                          </span>
                        )}

                        {!job.cancellationRequestedByFreelancer ? (
                          <button
                            onClick={() => cancelMutation.mutate()}
                            disabled={cancelMutation.isPending}
                            className="flex-1 md:flex-none bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold px-5 py-3 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {job.cancellationRequestedByClient ? 'Approve Cancellation' : 'Request Cancellation'}
                          </button>
                        ) : (
                          <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2.5 rounded-xl font-bold text-xs">
                            Awaiting Client Cancellation
                          </span>
                        )}
                      </>
                    )}

                    {/* Client Actions */}
                    {job.client === user?.id && (
                      <>
                        {!job.completionRequestedByClient ? (
                          <button
                            onClick={() => completeMutation.mutate()}
                            disabled={completeMutation.isPending}
                            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-750 text-white font-bold px-5 py-3 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {job.completionRequestedByFreelancer ? 'Approve Completion & Release Escrow' : 'Request Completion'}
                          </button>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-4 py-2.5 rounded-xl font-bold text-xs">
                            Awaiting Freelancer Approval
                          </span>
                        )}

                        {!job.cancellationRequestedByClient ? (
                          <button
                            onClick={() => cancelMutation.mutate()}
                            disabled={cancelMutation.isPending}
                            className="flex-1 md:flex-none bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold px-5 py-3 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {job.cancellationRequestedByFreelancer ? 'Approve Cancellation & Refund' : 'Request Cancellation'}
                          </button>
                        ) : (
                          <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2.5 rounded-xl font-bold text-xs">
                            Awaiting Freelancer Cancellation
                          </span>
                        )}
                      </>
                    )}
                  </>
                )}

                {job.status === 'completed' && (
                  <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-xl font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" /> Funds Released to Freelancer Wallet
                  </div>
                )}

                {job.status === 'cancelled' && (
                  <div className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2.5 rounded-xl font-bold text-xs">
                    <XCircle className="w-4 h-4" /> Escrow Budget Refunded to Client Wallet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-4 pb-4 border-b border-border text-foreground">Job Description</h2>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            {/* Skills */}
            {job.skillsRequired?.length > 0 && (
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <h2 className="text-xl font-bold mb-4 pb-4 border-b border-border text-foreground">Skills Required</h2>
                <div className="flex flex-wrap gap-2.5">
                  {job.skillsRequired.map((skill) => (
                    <span key={skill} className="bg-background border border-border px-4 py-2 rounded-xl text-sm font-medium text-foreground/80">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Proposals List (Client only — job owner) */}
            {isJobOwner && proposals.length > 0 && (
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <h2 className="text-xl font-bold mb-4 pb-4 border-b border-border text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Proposals Received ({proposals.length})
                </h2>
                <div className="space-y-4">
                  {proposals.map((p) => (
                    <div key={p._id} className="bg-background border border-border rounded-2xl p-5">
                      {/* Freelancer info */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          {p.freelancerInfo?.profilePic ? (
                            <img src={p.freelancerInfo.profilePic} alt="" className="w-10 h-10 rounded-full object-cover border border-border" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                              {p.freelancerInfo?.name?.[0]?.toUpperCase() || 'F'}
                            </div>
                          )}
                          <div>
                            <button onClick={() => navigate(`/freelancer/${p.freelancer}`)}
                              className="font-bold text-foreground hover:text-primary transition-colors text-sm cursor-pointer">
                              {p.freelancerInfo?.name || 'Freelancer'}
                            </button>
                            <p className="text-xs text-muted-foreground">{p.freelancerInfo?.title || p.freelancerInfo?.email || '—'}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                          p.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                          p.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {p.status}
                        </span>
                      </div>

                      {/* Proposal details */}
                      <p className="text-sm text-foreground/80 mb-3 leading-relaxed">{p.coverLetter}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                        <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                          <IndianRupee className="w-4 h-4" /> ₹{p.bidAmount?.toLocaleString('en-IN')}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" /> {p.estimatedDays} days
                        </span>
                        <span className="text-muted-foreground text-xs">
                          Submitted {timeAgo(p.createdAt)}
                        </span>
                      </div>

                      {/* Action buttons (only for pending proposals) */}
                      {p.status === 'pending' && (
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-border/60">
                          <button onClick={() => acceptMutation.mutate(p._id)}
                            disabled={acceptMutation.isPending}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button onClick={() => rejectMutation.mutate(p._id)}
                            disabled={rejectMutation.isPending}
                            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                          <button onClick={() => navigate(`/freelancer/${p.freelancer}`)}
                            className="flex items-center gap-1.5 bg-muted hover:bg-accent text-foreground px-4 py-2 rounded-xl font-medium text-xs transition-colors cursor-pointer">
                            <User2 className="w-3.5 h-3.5" /> View Profile
                          </button>
                        </div>
                      )}
                      {p.status === 'accepted' && (
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-border/60">
                          <button onClick={() => navigate(`/shared/messages?jobId=${job._id}&otherUserId=${p.freelancer}`)}
                            className="flex items-center gap-1.5 bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer">
                            <MessageSquare className="w-3.5 h-3.5" /> Chat
                          </button>
                          {p.freelancerInfo?.phone && (
                            <a href={`tel:${p.freelancerInfo.phone}`}
                              className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl font-bold text-xs transition-colors">
                              <Phone className="w-3.5 h-3.5" /> Call
                            </a>
                          )}
                          <button onClick={() => navigate(`/freelancer/${p.freelancer}`)}
                            className="flex items-center gap-1.5 bg-muted hover:bg-accent text-foreground px-4 py-2 rounded-xl font-medium text-xs transition-colors cursor-pointer">
                            <User2 className="w-3.5 h-3.5" /> Profile
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Budget + Apply Card */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="text-center mb-6 pb-6 border-b border-border">
                <p className="text-muted-foreground text-sm font-medium mb-1">Budget</p>
                <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatBudget(job)}</h3>
              </div>

              {/* Freelancer: Apply or View Submitted Proposal */}
              {(!isJobOwner && (isFreelancer || !isAuthenticated)) && (
                <>
                  {myProposal ? (
                    <div className="space-y-4 text-left">
                      <div className="bg-background rounded-2xl p-5 border border-border">
                        <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Your Proposal</span>
                          <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase border ${
                            myProposal.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                            myProposal.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}>
                            {myProposal.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          <p className="text-foreground/80 leading-relaxed italic">"{myProposal.coverLetter}"</p>
                          <div className="flex justify-between items-center pt-2 text-[10px] font-bold text-muted-foreground">
                            <span>Bid: <strong className="text-emerald-600 dark:text-emerald-400 text-xs">₹{myProposal.bidAmount?.toLocaleString('en-IN')}</strong></span>
                            <span>Delivery: <strong>{myProposal.estimatedDays} days</strong></span>
                          </div>
                        </div>
                      </div>

                      {myProposal.status === 'accepted' && (
                        <button
                          onClick={() => navigate(`/shared/messages?jobId=${job._id}&otherUserId=${job.client}`)}
                          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20 cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" /> Chat with Client
                        </button>
                      )}
                    </div>
                  ) : !showProposal ? (
                    <button onClick={() => isAuthenticated ? setShowProposal(true) : navigate('/auth')}
                      disabled={job.status !== 'open'}
                      className="w-full bg-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground py-4 rounded-xl font-bold transition-all text-base mb-4 cursor-pointer shadow-lg shadow-primary/20">
                      {job.status === 'open' ? 'Submit Proposal' : 'Job Closed'}
                    </button>
                  ) : (
                    <form onSubmit={handleProposal} className="space-y-3 mb-4">
                      <textarea required rows={3} placeholder="Why are you the best fit?"
                        value={proposal.coverLetter} onChange={(e) => setProposal((p) => ({ ...p, coverLetter: e.target.value }))}
                        className="w-full bg-background border border-border focus:border-primary rounded-xl p-3 text-sm outline-none resize-none text-foreground placeholder:text-muted-foreground/60 transition-colors" />
                      <input required type="number" placeholder="Your bid (₹)"
                        value={proposal.bidAmount} onChange={(e) => setProposal((p) => ({ ...p, bidAmount: e.target.value }))}
                        className="w-full bg-background border border-border focus:border-primary rounded-xl p-3 text-sm outline-none text-foreground placeholder:text-muted-foreground/60 transition-colors" />
                      <input required type="number" placeholder="Delivery days"
                        value={proposal.estimatedDays} onChange={(e) => setProposal((p) => ({ ...p, estimatedDays: e.target.value }))}
                        className="w-full bg-background border border-border focus:border-primary rounded-xl p-3 text-sm outline-none text-foreground placeholder:text-muted-foreground/60 transition-colors" />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setShowProposal(false)}
                          className="flex-1 bg-muted hover:bg-accent text-foreground py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer">Cancel</button>
                        <button type="submit" disabled={applyMutation.isPending}
                          className="flex-1 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer">
                          {applyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Send
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* Client: Summary */}
              {isJobOwner && (
                <div className="space-y-3">
                  <div className="bg-background rounded-xl p-4 border border-border/60 text-center">
                    <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Proposals</p>
                    <p className="text-2xl font-extrabold text-foreground">{proposals.length}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-2">
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">{proposals.filter(p => p.status === 'pending').length}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Pending</p>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-2">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{proposals.filter(p => p.status === 'accepted').length}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Accepted</p>
                    </div>
                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-2">
                      <p className="text-xs text-red-500 font-bold">{proposals.filter(p => p.status === 'rejected').length}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Rejected</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Secure Escrow Payment
              </div>
            </div>

            {/* About the Client Card */}
            {(!isJobOwner && job.clientInfo) && (
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">About the Client</h3>
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={job.clientInfo.profilePic}
                    alt={job.clientInfo.name}
                    className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${job.clientInfo.name}`;
                    }}
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-foreground text-sm truncate">{job.clientInfo.name}</h4>
                    <p className="text-xs text-primary truncate">@{job.clientInfo.username || 'client'}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/freelancer/${job.client}`)}
                  className="w-full bg-accent/40 hover:bg-accent border border-border text-foreground font-semibold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <User2 className="w-3.5 h-3.5" /> View Client Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;