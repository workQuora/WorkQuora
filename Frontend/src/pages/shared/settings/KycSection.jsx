import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShieldCheck, Upload, RotateCcw, CheckCircle2, Clock } from 'lucide-react';
import { kycApi } from '../../../api/endpoints';
import { Card, SectionHeader, Button, Badge } from '../../../components/ui';

const STATUS_VARIANT = {
  verified: 'success',
  rejected: 'danger',
  pending: 'warning',
};

const DocUpload = ({ label, verified, mutationFn, queryKeyToInvalidate }) => {
  const qc = useQueryClient();
  const [file, setFile] = useState(null);

  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(`${label} submitted`);
      setFile(null);
      qc.invalidateQueries({ queryKey: queryKeyToInvalidate });
    },
    onError: (err) => toast.error(err.response?.data?.message || `Failed to submit ${label}`),
  });

  const handleSubmit = () => {
    if (!file) return toast.error('Please select a file first');
    const fd = new FormData();
    fd.append('file', file);
    mutation.mutate(fd);
  };

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">{label}</span>
        <Badge variant={verified ? 'success' : 'warning'}>
          {verified ? <><CheckCircle2 className="w-3 h-3" /> Verified</> : <><Clock className="w-3 h-3" /> Pending</>}
        </Badge>
      </div>

      <label className="flex flex-col items-center justify-center gap-1.5 border border-dashed border-border rounded-xl py-4 px-3 text-center cursor-pointer hover:border-primary/40 transition-colors">
        <Upload className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground truncate max-w-full">
          {file ? file.name : 'Click to select image or PDF'}
        </span>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
      </label>

      <Button
        variant="primary"
        size="sm"
        className="w-full"
        onClick={handleSubmit}
        disabled={!file || mutation.isPending}
        isLoading={mutation.isPending}
      >
        {!mutation.isPending && 'Submit'}
      </Button>
    </Card>
  );
};

const KycSection = () => {
  const qc = useQueryClient();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { data: kyc, isLoading } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => kycApi.getStatus().then((r) => r.data?.data ?? null),
  });

  const resetMutation = useMutation({
    mutationFn: kycApi.reset,
    onSuccess: () => {
      toast.success('KYC reset');
      setShowResetConfirm(false);
      qc.invalidateQueries({ queryKey: ['kyc-status'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reset KYC'),
  });

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)}</div>;
  }

  const status = kyc?.status || 'pending';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader icon={ShieldCheck} title="KYC verification" subtitle="Verify your identity to unlock payments" />
        <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <DocUpload label="Aadhaar" verified={!!kyc?.aadhaarVerified} mutationFn={kycApi.submitAadhaar} queryKeyToInvalidate={['kyc-status']} />
        <DocUpload label="PAN Card" verified={!!kyc?.panVerified} mutationFn={kycApi.addPan} queryKeyToInvalidate={['kyc-status']} />
        <DocUpload label="Selfie" verified={!!kyc?.selfieVerified} mutationFn={kycApi.submitSelfie} queryKeyToInvalidate={['kyc-status']} />
      </div>

      <p className="text-xs text-muted-foreground/80 font-medium">
        Your identity documents are encrypted and stored securely according to our Privacy Policy.
      </p>

      <Card className="border-danger/20 bg-danger/5">
        <h3 className="text-danger font-bold text-sm mb-2">Reset KYC</h3>
        <p className="text-xs text-muted-foreground mb-4">This clears all submitted documents and verification status. You'll need to resubmit.</p>
        {!showResetConfirm ? (
          <Button variant="danger" size="sm" onClick={() => setShowResetConfirm(true)}>
            <RotateCcw className="w-3.5 h-3.5" /> Reset KYC
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="danger" size="sm" onClick={() => resetMutation.mutate()} isLoading={resetMutation.isPending}>
              {!resetMutation.isPending && 'Confirm Reset'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default KycSection;
