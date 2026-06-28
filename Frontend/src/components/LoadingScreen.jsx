import React, { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const LoadingScreen = () => {
  const { loadingProgress, currentStatusStep, incrementProgress, isLoadingComplete } = useAppStore();

  useEffect(() => {
    if (loadingProgress < 100) {
      const interval = setInterval(() => {
        // Fast progress in beginning, slightly slowing down to look organic
        const increment = Math.max(1, Math.floor(Math.random() * 8));
        incrementProgress(increment);
      }, 120);
      return () => clearInterval(interval);
    }
  }, [loadingProgress, incrementProgress]);

  return (
    <AnimatePresence>
      {!isLoadingComplete && (
        <motion.div
          className="fixed inset-0 bg-[#09090B] z-[99999] flex flex-col items-center justify-center overflow-hidden"
          exit={{
            opacity: 0,
            scale: 1.05,
            filter: 'blur(10px)',
            transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
          }}
        >
          {/* Background mesh effects */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

          {/* Centered content block */}
          <div className="relative flex flex-col items-center max-w-md w-full px-6 text-center select-none">
            
            {/* Logo animation */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-3 mb-10"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary via-indigo-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.25)] border border-white/10">
                <span className="text-white font-black text-2xl tracking-tighter">W</span>
              </div>
              <span className="text-white font-extrabold text-2xl tracking-tight">
                Work<span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-400">Quora</span>
              </span>
            </motion.div>

            {/* Circular Spinner */}
            <div className="relative mb-6">
              <Loader2 className="w-10 h-10 animate-spin text-primary opacity-30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white/50">{loadingProgress}%</span>
              </div>
            </div>

            {/* Simulated Progress bar */}
            <div className="w-full h-[2px] bg-white/5 rounded-full mb-4 overflow-hidden relative border border-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-indigo-400 to-cyan-400 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                initial={{ width: '0%' }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            {/* Step text update */}
            <motion.p
              key={currentStatusStep}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-[11px] font-bold tracking-widest text-primary/80 uppercase mb-2 min-h-[16px]"
            >
              {currentStatusStep}
            </motion.p>
            
            <p className="text-xs text-muted-foreground/60">
              WorkQuora Engine v3.0
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
