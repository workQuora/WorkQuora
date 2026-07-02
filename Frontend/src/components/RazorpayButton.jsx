import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * RazorpayButton — a reusable "Add Money" button that:
 * 1. Creates a Razorpay order via backend POST /payments/razorpay/create-order
 * 2. Opens the Razorpay checkout modal
 * 3. Verifies payment via backend POST /payments/razorpay/verify
 * 4. Invalidates wallet queries on success
 *
 * Props:
 *  - amount: number (INR, default 500)
 *  - label: string (button label)
 *  - onSuccess: callback after verified payment
 *  - className: extra button styles
 */
const RazorpayButton = ({
  amount = 500,
  label = 'Add Money',
  onSuccess,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });

  const handlePayment = async () => {
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Payment service unavailable. Check internet connection.');
        setLoading(false);
        return;
      }

      // 1. Create order on backend
      const { data } = await api.post('/wallet/add-money/create-order', { amount });
      const { orderId, keyId, amount: orderAmount, currency } = data.data || data;

      if (!orderId) {
        toast.error('Could not create payment order. Configure Razorpay keys in backend .env');
        setLoading(false);
        return;
      }

      // 2. Open Razorpay checkout
      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder', // Fallback
        amount: orderAmount,
        currency: currency || 'INR',
        name: 'WorkQuora',
        description: 'Add Money to Wallet',
        order_id: orderId,
        theme: { color: '#1E00A9' },
        handler: async (response) => {
          try {
            // 3. Verify payment on backend
            const verifyRes = await api.post('/wallet/add-money/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              amount: orderAmount / 100, // Pass amount in INR
            });

            toast.success(verifyRes.data?.message || `₹${amount} added to wallet! 🎉`);
            qc.invalidateQueries({ queryKey: ['wallet'] });
            qc.invalidateQueries({ queryKey: ['wallet-balance'] });
            qc.invalidateQueries({ queryKey: ['transactions'] });
            onSuccess?.();
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled.', { icon: '🚫' });
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        toast.error(`Payment failed: ${resp.error?.description || 'Unknown error'}`);
        setLoading(false);
      });
      rzp.open();
      setLoading(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Try again.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={`flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50 cursor-pointer ${className}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {loading ? 'Processing…' : label}
    </button>
  );
};

export default RazorpayButton;
