import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2, Wallet, Landmark } from 'lucide-react';
import { profileApi, walletApi } from '../../../api/endpoints';
import { Card, SectionHeader, Button, Input } from '../../../components/ui';

const PaymentSection = ({ profile }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({ bankName: '', accountNo: '', ifscCode: '' });

  useEffect(() => {
    if (profile?.bankDetails) {
      setForm({
        bankName: profile.bankDetails.bankName || '',
        accountNo: profile.bankDetails.accountNo || '',
        ifscCode: profile.bankDetails.ifscCode || '',
      });
    }
  }, [profile]);

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletApi.balance().then((r) => r.data?.data ?? {}),
  });

  const saveBankMutation = useMutation({
    mutationFn: profileApi.updateBank,
    onSuccess: () => {
      toast.success('Bank details saved');
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save bank details'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.bankName || !form.accountNo || !form.ifscCode) {
      toast.error('Please fill in all bank details');
      return;
    }
    saveBankMutation.mutate({
      bankName: form.bankName,
      accountNo: form.accountNo,
      ifscCode: form.ifscCode.toUpperCase(),
    });
  };

  return (
    <div className="space-y-4">
      <SectionHeader icon={Landmark} title="Payment & bank" subtitle="Bank account and wallet" />

      {/* Wallet balance */}
      <Card className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 text-primary rounded-xl">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Wallet Balance</span>
          <p className="text-2xl font-extrabold text-foreground">
            {walletLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `₹${(walletData?.formattedBalance ?? 0).toLocaleString('en-IN')}`}
          </p>
        </div>
      </Card>

      {/* Bank details form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-1">
          <h3 className="text-sm font-bold text-foreground mb-3">Bank Account</h3>

          <Input
            label="Bank Name"
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            placeholder="e.g. State Bank of India"
          />
          <Input
            label="Account Number"
            value={form.accountNo}
            onChange={(e) => setForm({ ...form, accountNo: e.target.value.replace(/\D/g, '') })}
            placeholder="e.g. 501002345678"
          />
          <Input
            label="IFSC Code"
            value={form.ifscCode}
            onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
            maxLength={11}
            placeholder="e.g. SBIN0001234"
            className="uppercase font-mono"
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" isLoading={saveBankMutation.isPending}>
              {!saveBankMutation.isPending && 'Save Bank Details'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default PaymentSection;
