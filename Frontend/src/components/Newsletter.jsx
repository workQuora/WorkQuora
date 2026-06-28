import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    
    // Quick regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    // Simulate API registration
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
      toast.success('Successfully subscribed to launches! 🚀');
    }, 1500);
  };

  return (
    <div className="w-full bg-card/25 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl max-w-xl mx-auto">
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="text-center mb-6">
        <h3 className="text-base font-extrabold text-white tracking-tight">Stay Synchronized</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Get notified automatically the second our servers come back online.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!subscribed ? (
          <motion.form 
            key="subscribe-form"
            onSubmit={handleSubmit} 
            className="flex flex-col sm:flex-row gap-3 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex-1 relative">
              <input
                type="email"
                placeholder="Enter your professional email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-[#0a0a10]/50 border border-white/5 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Subscribing...</span>
                </>
              ) : (
                <>
                  <span>Notify Me</span>
                  <ArrowRight size={12} />
                </>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="subscribe-success"
            className="flex flex-col items-center justify-center py-4 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <CheckCircle2 size={32} className="text-emerald-400 mb-2 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)] animate-bounce" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Subscription Confirmed</h4>
            <p className="text-[10px] text-muted-foreground mt-1">
              You will receive a notification at <span className="text-primary font-bold">{email}</span>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Newsletter;
