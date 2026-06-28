import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ targetPercent = 78 }) => {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        setPercent(current);
        if (current >= targetPercent) {
          clearInterval(interval);
        }
      }, 25);
      return () => clearInterval(interval);
    }, 1500); // Trigger after page fades in
    return () => clearTimeout(timer);
  }, [targetPercent]);

  return (
    <div className="max-w-md w-full mx-auto p-5 rounded-2xl bg-card/25 border border-white/5 backdrop-blur-xl relative overflow-hidden shadow-lg mb-8">
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Platform Upgrade Progress</span>
        <span className="text-xs font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">{percent}%</span>
      </div>
      
      <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-indigo-400 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"
          initial={{ width: '0%' }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      
      <div className="flex justify-between items-center mt-2.5 text-[9px] font-bold text-muted-foreground/50">
        <span>V2.4 STABLE</span>
        <span className="animate-pulse text-primary">V3.0 ALPHA BUILD</span>
      </div>
    </div>
  );
};

export default ProgressBar;
