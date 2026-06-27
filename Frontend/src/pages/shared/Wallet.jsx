import React, { useState, useEffect } from 'react';
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ShieldCheck,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Home,
  Landmark,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../../services/api';
import RazorpayButton from '../../components/RazorpayButton';

const useWalletData = () =>
  useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => api.get('/dashboard/wallet').then((r) => r.data?.data ?? r.data),
    staleTime: 30_000,
  });

const useTransactions = (params = {}) =>
  useQuery({
    queryKey: ['transactions', params],
    queryFn: () =>
      api.get('/payments/transactions', { params }).then((r) => r.data?.data ?? r.data),
  });

const getTransactionBadge = (description) => {
  const desc = description ? description.toLowerCase() : '';
  if (desc.includes('escrow deposit') || desc.includes('locked')) {
    return {
      label: 'Escrow Lock',
      classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };
  }
  if (desc.includes('payment received') || desc.includes('release') || desc.includes('income')) {
    return {
      label: 'Income',
      classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
  }
  if (desc.includes('withdrawal')) {
    return {
      label: 'Withdrawal',
      classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
  }
  if (desc.includes('added to wallet') || desc.includes('deposit')) {
    return {
      label: 'Top-Up',
      classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };
  }
  return {
    label: 'Transaction',
    classes: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
};

const Wallet = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const qc = useQueryClient();
  const { data: wallet, isLoading: walletLoading } = useWalletData();
  const { data: txData, isLoading: txLoading } = useTransactions({ limit: 15 });
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [withdrawalPin, setWithdrawalPin] = useState('');
  
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAmount, setAddAmount] = useState('500');

  // PIN Unlock State
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Set default bank account once wallet data loads
  useEffect(() => {
    if (wallet?.bankAccounts?.length > 0 && !selectedBankId) {
      setSelectedBankId(wallet.bankAccounts[0]._id);
    }
  }, [wallet, selectedBankId]);

  const { mutate: withdraw, isPending: isWithdrawing } = useMutation({
    mutationFn: (data) => api.post('/wallet/withdraw', data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Withdrawal initiated successfully.');
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawalPin('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Withdrawal failed.'),
  });

  const handleUnlockSubmit = async (e) => {
    e.preventDefault();
    if (pinInput.length !== 4) {
      toast.error('PIN must be exactly 4 digits.');
      return;
    }
    setIsUnlocking(true);
    try {
      await api.post('/wallet/verify-pin', { pin: pinInput });
      setIsUnlocked(true);
      toast.success('Wallet unlocked successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect PIN.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleAddClick = () => {
    if (!wallet?.bankAccounts || wallet.bankAccounts.length === 0) {
      toast.error('You must link a bank account before adding money to your wallet.');
      return;
    }
    setShowAddModal(true);
  };

  const handleWithdrawClick = () => {
    // Check general KYC state
    const isKycComplete = wallet?.kycVerified && wallet?.hasWithdrawalPin && wallet?.bankAccounts?.length > 0;
    if (!isKycComplete) {
      toast.error('Withdrawals require completed KYC, a linked bank account, and a Withdrawal PIN. Please complete these on your Dashboard first.');
      return;
    }
    
    // Check linked bank account existence
    if (!wallet?.bankAccounts || wallet.bankAccounts.length === 0) {
      toast.error('You must link a bank account before making withdrawals.');
      return;
    }
    setShowWithdrawModal(true);
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    if (amount > balance) {
      toast.error('Insufficient balance in wallet.');
      return;
    }
    if (!selectedBankId) {
      toast.error('Please select a target bank account.');
      return;
    }
    if (withdrawalPin.length !== 4 || /\D/.test(withdrawalPin)) {
      toast.error('Withdrawal PIN must be exactly 4 digits.');
      return;
    }

    withdraw({
      amount,
      bankAccountId: selectedBankId,
      pin: withdrawalPin,
    });
  };

  if (walletLoading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  const balance = wallet?.balance ?? 0;
  const escrow = wallet?.escrowBalance ?? 0;
  const transactions = txData?.transactions ?? txData ?? [];
  const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

  const isKycComplete = wallet?.kycVerified && wallet?.hasWithdrawalPin && wallet?.bankAccounts?.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 lg:p-10 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Wallet & Payments</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage escrow funds, withdrawals, and top-ups.</p>
          </div>
          <button
            onClick={() => navigate('/')} 
            className="self-start sm:self-center flex items-center gap-2 bg-accent/40 border border-border hover:bg-accent px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          >
            <Home className="w-4 h-4 text-primary" />
            <span>Home</span>
          </button>
        </div>

        {/* Lock Screen Conditions */}
        {!wallet?.hasWithdrawalPin ? (
          /* 1. KEY LOCK SETUP REQUIRED (No PIN created during KYC) */
          <div className="max-w-md mx-auto bg-card border border-border/80 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden mt-12">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20 text-amber-500">
              <AlertTriangle className="w-8 h-8 animate-bounce text-amber-500" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">KYC & PIN Setup Required</h2>
            <p className="text-muted-foreground text-xs leading-relaxed mb-6">
              To protect your financial security, wallet operations are locked. You must complete KYC verification (Aadhaar & PAN) and configure a 4-digit Withdrawal PIN first.
            </p>

            <button
              onClick={() => navigate(user?.role?.toLowerCase() === 'client' ? '/client/dashboard' : '/freelancer/dashboard')}
              className="w-full py-3 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-primary/20 flex items-center justify-center gap-2"
            >
              Verify KYC & Setup PIN
            </button>
          </div>
        ) : !isUnlocked ? (
          /* 2. PIN SECURE UNLOCK CARD (Locked by default) */
          <div className="max-w-md mx-auto bg-card border border-border/80 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden mt-12">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20 text-primary">
              <Lock className="w-8 h-8 animate-pulse text-primary" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">Secure Financial Console</h2>
            <p className="text-muted-foreground text-xs leading-relaxed mb-6">
              Enter the 4-digit security PIN created during bank linking/KYC to view your wallet balance and perform transactions.
            </p>

            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <input
                type="password"
                maxLength="4"
                pattern="\d*"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground tracking-widest text-center focus:outline-none focus:border-primary text-2xl font-bold transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                required
              />

              <button
                type="submit"
                disabled={isUnlocking || pinInput.length !== 4}
                className="w-full py-3 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-primary/15 flex items-center justify-center gap-2"
              >
                {isUnlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unlock Wallet'}
              </button>
            </form>
          </div>
        ) : (
          /* 3. FULLY UNLOCKED FINANCES VIEW */
          <>
            {/* KYC Verification Reminder Banner */}
            {!isKycComplete && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-amber-500 font-bold text-sm">KYC Verification Required</h4>
                    <p className="text-muted-foreground text-xs mt-1 max-w-2xl leading-relaxed">
                      {!wallet?.kycVerified 
                        ? 'Please verify your identity using Aadhaar and PAN cards to enable wallet withdrawals.' 
                        : !wallet?.bankAccounts?.length 
                          ? 'Please link a bank account to receive your funds.' 
                          : 'Please set up your 4-digit Withdrawal PIN for secure transactions.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(user?.role?.toLowerCase() === 'client' ? '/client/dashboard' : '/freelancer/dashboard')}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  Verify KYC & Setup PIN
                </button>
              </div>
            )}

            {/* Financial Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              
              {/* Main Balance Card */}
              <div className="bg-gradient-to-br from-primary via-indigo-600 to-purple-700 rounded-3xl p-6 shadow-xl shadow-primary/10 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                <WalletIcon className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 pointer-events-none" />
                <div>
                  <p className="text-indigo-100/80 text-xs font-semibold uppercase tracking-wider mb-1">Available Balance</p>
                  <h2 className="text-4xl font-extrabold text-white tracking-tight">
                    ₹{balance.toLocaleString('en-IN')}
                  </h2>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleWithdrawClick}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-sm border border-white/10 text-sm"
                  >
                    <ArrowDownLeft className="w-4 h-4" /> Withdraw
                  </button>
                  <button
                    onClick={handleAddClick}
                    className="flex-1 bg-white text-primary font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all cursor-pointer shadow-lg text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Money
                  </button>
                </div>
              </div>

              {/* Escrow Card */}
              <div className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Escrow Funds</h3>
                  </div>
                  <h2 className="text-3xl font-extrabold text-emerald-500">
                    ₹{escrow.toLocaleString('en-IN')}
                  </h2>
                  <p className="text-muted-foreground text-xs mt-2 leading-relaxed">
                    Escrow funds are safely secured and released upon successful project milestones.
                  </p>
                </div>

                {wallet?.todayIncome > 0 && (
                  <div className="pt-3 border-t border-border flex justify-between items-center mt-4">
                    <span className="text-xs text-muted-foreground">Today's Income</span>
                    <span className="text-sm font-bold text-emerald-500">+₹{wallet.todayIncome.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Linked Bank Accounts */}
              <div className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-primary" />
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Linked Banks</h3>
                    </div>
                    {wallet?.bankAccounts && wallet.bankAccounts.length > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {wallet.bankAccounts.length} Connected
                      </span>
                    )}
                  </div>
                  
                  {wallet?.bankAccounts && wallet.bankAccounts.length > 0 ? (
                    <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1">
                      {wallet.bankAccounts.map((bank) => (
                        <div key={bank._id} className="flex items-center justify-between bg-background/50 border border-border/50 rounded-xl p-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] uppercase">
                              {bank.bankName.slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground truncate max-w-[120px]">{bank.bankName}</p>
                              <p className="text-[9px] text-muted-foreground">IFSC: {bank.ifscCode}</p>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-muted-foreground">•••• {bank.accountNo.slice(-4)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <Landmark className="w-6 h-6 text-muted-foreground/30 mb-1" />
                      <p className="text-muted-foreground text-xs">No banks connected</p>
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground text-[9px] mt-2 leading-relaxed">
                  Link additional accounts or configure your security PIN from your Dashboard.
                </p>
              </div>

            </div>

            {/* Transaction Ledger */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-lg">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-foreground">Transaction History</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Real-time ledger of top-ups, escrows, and withdrawals.</p>
                </div>
                {txLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
              </div>

              {transactions.length === 0 && !txLoading ? (
                <div className="p-16 text-center text-muted-foreground">
                  <WalletIcon className="w-12 h-12 mx-auto mb-4 opacity-20 text-muted-foreground" />
                  <p className="font-semibold text-base text-foreground/80">No transactions recorded</p>
                  <p className="text-xs mt-1">Start adding funds or accepting milestones to populate ledger logs.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {transactions.map((tx) => {
                    const badge = getTransactionBadge(tx.description || '');
                    return (
                      <div
                        key={tx._id || tx.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-muted/30 transition-all border-b border-border/50 last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl shrink-0 ${tx.type === 'CREDIT' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                            {tx.type === 'CREDIT' ? (
                              <ArrowDownRight className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5 text-red-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm text-foreground">
                                {tx.description}
                              </p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badge.classes}`}>
                                {badge.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {tx.createdAt
                                ? new Date(tx.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0">
                          <span
                            className={`font-extrabold text-base ${tx.type === 'CREDIT' ? 'text-emerald-500' : 'text-red-400'}`}
                          >
                            {tx.type === 'CREDIT' ? '+' : '-'}₹{(tx.amount || 0).toLocaleString('en-IN')}
                          </span>
                          {tx.status && (
                            <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${
                              tx.status === 'completed' ? 'text-emerald-500/80' : 'text-yellow-500/80'
                            }`}>
                              {tx.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Money Modal (Razorpay) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <h3 className="text-xl font-bold text-foreground mb-2">Add Money to Wallet</h3>
            <p className="text-muted-foreground text-sm mb-6">Money is added instantly via Razorpay.</p>

            {/* Quick amount pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAddAmount(String(amt))}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                    addAmount === String(amt)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Custom Amount (₹)</label>
              <input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                min="1"
                placeholder="Enter amount"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary text-lg font-bold"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 border border-border rounded-xl text-muted-foreground hover:border-muted-foreground font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <RazorpayButton
                amount={Number(addAmount) || 500}
                label={`Pay ₹${(Number(addAmount) || 500).toLocaleString('en-IN')}`}
                onSuccess={() => setShowAddModal(false)}
                className="flex-1 bg-primary hover:opacity-90 text-primary-foreground py-3 rounded-xl shadow-md shadow-primary/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal with Bank Dropdown & Secure PIN verification */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <h3 className="text-xl font-bold text-foreground mb-2">Secure Withdrawal</h3>
            <p className="text-muted-foreground text-sm mb-6">Funds will be deposited into your selected bank account.</p>
            
            <form onSubmit={handleWithdraw} className="space-y-4">
              
              {/* Target Bank Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Target Bank Account</label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary text-sm font-semibold transition-all"
                  required
                >
                  {wallet?.bankAccounts?.map((bank) => (
                    <option key={bank._id} value={bank._id}>
                      {bank.bankName} (•••• {bank.accountNo.slice(-4)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  max={balance}
                  placeholder={`Max ₹${balance.toLocaleString('en-IN')}`}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary text-lg font-bold transition-all"
                  required
                />
              </div>

              {/* Password PIN input */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Withdrawal PIN</span>
                </label>
                <input
                  type="password"
                  maxLength="4"
                  pattern="\d*"
                  value={withdrawalPin}
                  onChange={(e) => setWithdrawalPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground tracking-widest text-center focus:outline-none focus:border-primary text-xl font-bold transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawalPin('');
                  }}
                  className="flex-1 py-3 border border-border rounded-xl text-muted-foreground hover:border-muted-foreground font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) > balance || withdrawalPin.length !== 4}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 rounded-xl font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Withdrawal'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;