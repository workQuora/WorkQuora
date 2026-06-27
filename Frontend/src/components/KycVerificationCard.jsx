import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ArrowRight, Smartphone, KeyRound, CheckCircle2, Loader2, Landmark, Lock, FileText, Upload, AlertTriangle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { termsAndConditions } from '../data/termsAndConditions';

const KycVerificationCard = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  // Terms & Conditions States
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const termsContainerRef = useRef(null);

  const handleTermsScroll = () => {
    const el = termsContainerRef.current;
    if (el) {
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 15;
      if (isAtBottom) {
        setHasReadTerms(true);
      }
    }
  };

  useEffect(() => {
    if (showTermsModal) {
      setHasReadTerms(false);
      setTermsAccepted(false);
      const timer = setTimeout(() => {
        const el = termsContainerRef.current;
        if (el && el.scrollHeight <= el.clientHeight) {
          setHasReadTerms(true);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showTermsModal]);

  // Form states
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharFile, setAadharFile] = useState(null);
  const [otp, setOtp] = useState('');
  
  const [panCard, setPanCard] = useState('');
  const [panFile, setPanFile] = useState(null);

  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const { data: wallet, isLoading: dataLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => api.get('/dashboard/wallet').then((r) => r.data?.data ?? r.data),
    staleTime: 30000,
  });

  useEffect(() => {
    if (wallet) {
      if (wallet.kycVerified && wallet.bankAccounts?.length > 0 && wallet.hasWithdrawalPin) {
        setStep('done');
      } else if (!wallet.aadharVerified) {
        setStep(1);
      } else if (wallet.aadharVerified && !wallet.panVerified) {
        setStep(3);
      } else if (wallet.kycVerified && (!wallet.bankAccounts?.length || !wallet.hasWithdrawalPin)) {
        setStep(4);
      }
    }
  }, [wallet]);

  const handleAadharSubmit = async (e) => {
    e.preventDefault();
    if (aadharNumber.length !== 12) return setError('Aadhaar number must be exactly 12 digits');
    if (!aadharFile) return setError('Aadhaar document image is required');
    
    setLoading(true);
    setUploadProgress(0);
    setError('');

    let fileToUpload = aadharFile;
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
      fileToUpload = await imageCompression(aadharFile, options);
    } catch (error) {
      console.warn("Compression failed, using original file", error);
    }

    const formData = new FormData();
    formData.append('aadhaarNumber', aadharNumber);
    formData.append('file', fileToUpload);

    try {
      await api.post('/kyc/aadhaar/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      toast.success('Aadhaar details submitted successfully!');
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit Aadhaar. Please check fields.');
    } finally {
      setLoading(false);
    }
  };


  const handlePanSubmit = async (e) => {
    e.preventDefault();
    if (panCard.length !== 10) return setError('PAN card must be exactly 10 characters');
    setLoading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('panCard', panCard);
    if (panFile) {
      try {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        const compressedFile = await imageCompression(panFile, options);
        formData.append('file', compressedFile);
      } catch (error) {
        formData.append('file', panFile);
      }
    }

    try {
      await api.post('/kyc/pan/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      toast.success('PAN card details submitted successfully!');
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify PAN. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    if (!bankName || !accountNo || !ifscCode) return setError('All bank details are required');
    if (!pin || pin.length !== 4 || /\D/.test(pin)) return setError('Withdrawal PIN must be exactly 4 digits');
    if (pin !== confirmPin) return setError('Withdrawal PINs do not match');
    
    setLoading(true);
    setError('');

    try {
      await api.post('/kyc/bank', {
        bankName,
        accountNo,
        ifscCode,
        pin,
        confirmPin
      });
      toast.success('Bank details linked and Withdrawal PIN configured!');
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to link bank account.');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) return null;
  if (step === 'done') return null;

  if (user && !user.isMobileVerified) {
    return (
      <div className="w-full bg-card border border-border rounded-3xl p-6 relative overflow-hidden mb-6 shadow-xl text-center">
        <ShieldCheck size={48} className="mx-auto text-amber-500 mb-3 opacity-80" />
        <h3 className="text-base font-bold text-foreground">Mobile Verification Required</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed mb-4">
          You must verify your mobile number before you can proceed with KYC verification.
        </p>
        <button
          onClick={() => navigate('/settings')}
          className="px-6 py-2.5 bg-amber-500 hover:opacity-90 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
        >
          Go to Settings
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-card border border-border rounded-3xl p-6 relative overflow-hidden mb-6 shadow-xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start gap-4 mb-6 relative z-10">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20 shrink-0">
          <ShieldCheck size={24} className="animate-pulse" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Verify Your Identity (KYC)</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Verify your Aadhaar, PAN card, link your bank details, and set up a withdrawal PIN to unlock financial operations.
          </p>
          {error && <p className="text-xs text-destructive font-medium mt-2 bg-destructive/10 border border-destructive/20 px-3 py-1.5 rounded-lg inline-block">{error}</p>}
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { label: 'Aadhaar', active: step === 1, done: step > 1 || step === 'done' },
          { label: 'PAN Card', active: step === 3, done: step > 3 || step === 'done' },
          { label: 'Bank & PIN', active: step === 4, done: step === 'done' }
        ].map((s, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <div className={`h-1.5 rounded-full transition-all ${
              s.done ? 'bg-emerald-500' : s.active ? 'bg-primary' : 'bg-muted'
            }`} />
            <span className={`text-[10px] text-center font-bold uppercase tracking-wider ${
              s.active ? 'text-primary' : s.done ? 'text-emerald-500' : 'text-muted-foreground'
            }`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Forms Content */}
      <div className="bg-background/40 border border-border/60 rounded-2xl p-5 relative z-10">
        {step === 1 && !termsAgreed && (
          <div className="text-center py-6">
            <Landmark size={48} className="mx-auto text-primary mb-3 opacity-80" />
            <h4 className="text-sm font-bold text-foreground mb-1">Identity Verification Setup</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5 leading-relaxed">
              To enable wallet deposits, withdrawals, and task assignments, you must verify your Aadhaar and PAN details.
            </p>
            <button
              onClick={() => setShowTermsModal(true)}
              className="px-6 py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Begin KYC Verification</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {step === 1 && termsAgreed && (
          <form onSubmit={handleAadharSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Aadhaar Number (12 Digits)</label>
                <div className="flex bg-accent/40 border border-border rounded-xl px-3.5 py-3 items-center focus-within:border-primary/40 transition-all">
                  <Smartphone size={16} className="text-muted-foreground mr-2" />
                  <input 
                    type="text" 
                    maxLength="12" 
                    placeholder="Enter Aadhaar Number"
                    value={aadharNumber} 
                    onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, ''))}
                    className="bg-transparent border-none outline-none w-full text-sm font-semibold text-foreground placeholder:text-muted-foreground" 
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Aadhaar Photo / Document (Required)</label>
                <div className="relative flex bg-accent/40 border border-border border-dashed rounded-xl px-3.5 py-2.5 items-center hover:border-primary/40 transition-all cursor-pointer">
                  <Upload size={16} className="text-muted-foreground mr-2" />
                  <span className="text-xs font-semibold text-muted-foreground truncate">
                    {aadharFile ? aadharFile.name : 'Choose file...'}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setAadharFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={aadharNumber.length !== 12 || !aadharFile || loading}
              className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Uploading {uploadProgress}%</span>
                </>
              ) : <>Submit Aadhaar <ArrowRight size={14} /></>}
            </button>
          </form>
        )}


        {step === 3 && (
          <form onSubmit={handlePanSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">PAN Card Number (10 Alphanumeric)</label>
                <div className="flex bg-accent/40 border border-border rounded-xl px-3.5 py-3 items-center focus-within:border-primary/40 transition-all">
                  <FileText size={16} className="text-muted-foreground mr-2" />
                  <input 
                    type="text" 
                    maxLength="10" 
                    placeholder="e.g. ABCDE1234F"
                    value={panCard} 
                    onChange={(e) => setPanCard(e.target.value.toUpperCase())}
                    className="bg-transparent border-none outline-none w-full text-sm font-semibold text-foreground placeholder:text-muted-foreground uppercase" 
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">PAN Photo / Document (Optional)</label>
                <div className="relative flex bg-accent/40 border border-border border-dashed rounded-xl px-3.5 py-2.5 items-center hover:border-primary/40 transition-all cursor-pointer">
                  <Upload size={16} className="text-muted-foreground mr-2" />
                  <span className="text-xs font-semibold text-muted-foreground truncate">
                    {panFile ? panFile.name : 'Choose file...'}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setPanFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={panCard.length !== 10 || loading}
              className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Uploading {uploadProgress}%</span>
                </>
              ) : <>Submit PAN <ArrowRight size={14} /></>}
            </button>
          </form>
        )}

        {step === 4 && (
          <form onSubmit={handleBankSubmit} className="space-y-4">
            <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
              <Landmark size={14} className="text-primary" /> Link Bank Account & Generate Withdrawal PIN
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Bank Name</label>
                <div className="flex bg-accent/40 border border-border rounded-xl px-3.5 py-2.5 items-center focus-within:border-primary/40 transition-all">
                  <input 
                    type="text" 
                    placeholder="e.g. State Bank of India"
                    value={bankName} 
                    onChange={(e) => setBankName(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-xs font-semibold text-foreground placeholder:text-muted-foreground" 
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Account Number</label>
                <div className="flex bg-accent/40 border border-border rounded-xl px-3.5 py-2.5 items-center focus-within:border-primary/40 transition-all">
                  <input 
                    type="text" 
                    placeholder="Enter Account No"
                    value={accountNo} 
                    onChange={(e) => setAccountNo(e.target.value.replace(/\D/g, ''))}
                    className="bg-transparent border-none outline-none w-full text-xs font-semibold text-foreground placeholder:text-muted-foreground" 
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">IFSC Code</label>
                <div className="flex bg-accent/40 border border-border rounded-xl px-3.5 py-2.5 items-center focus-within:border-primary/40 transition-all">
                  <input 
                    type="text" 
                    maxLength="11" 
                    placeholder="e.g. SBIN0001234"
                    value={ifscCode} 
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="bg-transparent border-none outline-none w-full text-xs font-semibold text-foreground placeholder:text-muted-foreground uppercase" 
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border/60 my-4 pt-4">
              <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                <Lock size={14} className="text-primary" /> Create 4-Digit Withdrawal PIN
              </h4>
              <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
                This PIN will be requested for verifying all future withdrawals and checking wallet balances.
              </p>
              <div className="grid md:grid-cols-2 gap-4 max-w-md">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Create PIN (4 digits)</label>
                  <div className="flex bg-accent/40 border border-border rounded-xl px-3.5 py-2.5 items-center focus-within:border-primary/40 transition-all">
                    <input 
                      type="password" 
                      maxLength="4" 
                      placeholder="4 Digits"
                      value={pin} 
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="bg-transparent border-none outline-none w-full text-xs font-semibold text-foreground tracking-widest placeholder:tracking-normal font-mono" 
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Confirm PIN</label>
                  <div className="flex bg-accent/40 border border-border rounded-xl px-3.5 py-2.5 items-center focus-within:border-primary/40 transition-all">
                    <input 
                      type="password" 
                      maxLength="4" 
                      placeholder="Repeat PIN"
                      value={confirmPin} 
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      className="bg-transparent border-none outline-none w-full text-xs font-semibold text-foreground tracking-widest placeholder:tracking-normal font-mono" 
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <>Link Bank & Set PIN <CheckCircle2 size={14} /></>}
            </button>
          </form>
        )}
      </div>

      {/* Terms & Conditions Enforcement Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-foreground mb-1">Marketplace Verification Agreement</h3>
            <p className="text-xs text-muted-foreground mb-4">Please read the terms below completely to enable the consent tick.</p>

            {/* Scrollable Terms Text Container */}
            <div 
              ref={termsContainerRef}
              onScroll={handleTermsScroll}
              className="flex-1 overflow-y-auto bg-background/50 border border-border p-4 rounded-xl text-xs text-muted-foreground/90 whitespace-pre-line leading-relaxed scrollbar-thin scrollbar-thumb-muted"
            >
              {termsAndConditions}
            </div>

            {/* Checkbox Agreement */}
            <label className={`flex items-start gap-2.5 mt-5 p-3 rounded-xl border transition-all ${
              hasReadTerms 
                ? 'bg-primary/5 border-primary/20 text-foreground cursor-pointer' 
                : 'bg-muted/10 border-border/40 text-muted-foreground/60 cursor-not-allowed'
            }`}>
              <input
                type="checkbox"
                disabled={!hasReadTerms}
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="text-[11px] font-semibold select-none leading-relaxed">
                I agree to the Terms & Conditions of WorkQuora. I verify that all documents submitted belong to me.
                {!hasReadTerms && <span className="block text-[9px] text-amber-500 font-bold mt-1 uppercase tracking-wider">(Scroll to the bottom of the terms to unlock)</span>}
              </div>
            </label>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTermsModal(false);
                  setTermsAccepted(false);
                }}
                className="flex-1 py-3 border border-border rounded-xl text-muted-foreground hover:border-muted-foreground font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!termsAccepted}
                onClick={() => {
                  setTermsAgreed(true);
                  setShowTermsModal(false);
                }}
                className="flex-1 py-3 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-primary/10"
              >
                Accept & Begin Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KycVerificationCard;