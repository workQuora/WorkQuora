import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Phone, ArrowRight,  Lock, ShieldCheck } from 'lucide-react';
import { authApi } from '../../../api/endpoints';
import { loginSuccess } from '../../../actions/authSlice';
import { getAuthPayload } from '../../../api/axiosClient';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [authStep, setAuthStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [uiLoading, setUiLoading] = useState(false);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setStatusMessage({ type: 'error', text: 'Valid 10-digit number required.' });
      return;
    }
    setUiLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await authApi.requestOtp({ phoneNumber: `+91${phone}` });
      if (res.data?.success) {
        setAuthStep(2);
        setStatusMessage({ type: 'success', text: 'OTP sent successfully.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Network error.' });
    } finally {
      setUiLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setUiLoading(true);
    try {
      const res = await authApi.verifyOtp({ phoneNumber: `+91${phone}`, otp });
      if (res.data?.success) {
        const { user, token } = getAuthPayload(res);
        dispatch(loginSuccess({ user, token }));
        if (!user.role) {
          navigate('/auth/select-role', { state: { userId: user.id || user._id } });
        } else {
          navigate(user.role.toLowerCase() === 'client' ? '/client/dashboard' : '/freelancer/dashboard');
        }
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'OTP verification failed.' });
    } finally {
      setUiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-[var(--radius)] shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full pointer-events-none"></div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
          <p className="text-muted-foreground text-sm mt-1.5">Sign in to your WorkQuora account.</p>
        </div>

        {statusMessage.text && (
          <div className={`mb-5 p-3.5 rounded-xl border text-xs font-medium text-center ${
            statusMessage.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            {statusMessage.text}
          </div>
        )}

        {authStep === 1 ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Mobile Number</label>
              <div className="flex bg-accent/40 border border-border rounded-xl px-4 py-3 items-center focus-within:border-primary/40 transition-all">
                <Phone size={16} className="text-muted-foreground mr-3" />
                <span className="text-foreground font-medium text-sm mr-2 border-r border-border pr-2">+91</span>
                <input
                  type="tel" maxLength="10" required placeholder="10-digit number"
                  value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground font-medium text-sm"
                />
              </div>
            </div>
            <button type="submit" disabled={uiLoading}
              className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/10">
              {uiLoading ? 'Sending...' : 'Request OTP'} <ArrowRight size={14} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Enter OTP</label>
              <div className="flex bg-accent/40 border border-border rounded-xl px-4 py-3 items-center focus-within:border-primary/40 transition-all">
                <Lock size={16} className="text-muted-foreground mr-3" />
                <input
                  type="text" maxLength="6" required placeholder="••••••"
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="bg-transparent border-none outline-none w-full text-center text-foreground font-bold text-lg tracking-[0.6em]"
                />
              </div>
            </div>
            <button type="submit" disabled={uiLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all">
              {uiLoading ? 'Verifying...' : 'Verify & Login'} <ShieldCheck size={16} />
            </button>
            <button type="button" onClick={() => setAuthStep(1)} className="text-[11px] text-muted-foreground hover:text-foreground block mx-auto mt-3 transition-colors">
              Change Number
            </button>
          </form>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-card px-3 text-muted-foreground tracking-widest font-bold">OR</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="flex items-center justify-center gap-2 py-2.5 bg-accent/40 border border-border rounded-xl text-xs font-medium hover:bg-accent transition-colors text-foreground">
            Google
          </button>
          <button type="button" className="flex items-center justify-center gap-2 py-2.5 bg-accent/40 border border-border rounded-xl text-xs font-medium hover:bg-accent transition-colors text-foreground">
             Facebook
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;