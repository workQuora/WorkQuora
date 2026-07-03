import React from 'react';
import { motion } from 'framer-motion';

const Logo = () => {
  return (
    <div className="flex items-center gap-2 select-none">
      <motion.div 
        className="w-8 h-8 bg-gradient-to-br from-primary via-indigo-500 to-cyan-400 rounded-xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
        whileHover={{ scale: 1.05, rotate: 5 }}
      >
        <span className="text-white font-black text-base tracking-tighter">W</span>
      </motion.div>
      <span className="text-foreground font-extrabold text-lg tracking-tight">
        Work<span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-400">Quora</span>
      </span>
    </div>
  );
};

export default Logo;
