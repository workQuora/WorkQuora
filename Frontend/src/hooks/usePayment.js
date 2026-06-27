import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { walletApi, transactionsApi } from '../api/endpoints';

const usePayment = () => {
  const qc = useQueryClient();

  const useWalletBalance = () => useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.balance().then((r) => r.data?.data ?? r.data),
  });

  const useTransactions = (params = {}) => useQuery({
    queryKey: ['transactions', params],
    queryFn: () => walletApi.transactions(params).then((r) => r.data?.data ?? r.data),
  });

  const { mutate: withdraw, isPending: isWithdrawing } = useMutation({
    mutationFn: walletApi.withdraw,
    onSuccess: () => { toast.success('Withdrawal initiated!'); qc.invalidateQueries({ queryKey: ['wallet'] }); qc.invalidateQueries({ queryKey: ['transactions'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Withdrawal failed.'),
  });

  const { mutate: depositEscrow } = useMutation({
    mutationFn: (jobId) => transactionsApi.deposit(jobId),
    onSuccess: () => { toast.success('Escrow funded!'); qc.invalidateQueries({ queryKey: ['wallet'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Escrow deposit failed.'),
  });

  const { mutate: releasePayment } = useMutation({
    mutationFn: (jobId) => transactionsApi.release(jobId),
    onSuccess: () => { toast.success('Payment released!'); qc.invalidateQueries({ queryKey: ['wallet'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Release failed.'),
  });

  return { useWalletBalance, useTransactions, withdraw, isWithdrawing, depositEscrow, releasePayment };
};

export default usePayment;