import React from 'react';
import { useCountdown } from '../hooks/useCountdown';
import { motion } from 'framer-motion';

const TimeCard = ({ value, label }) => {
  // Format to 2 digits
  const formattedVal = String(value).padStart(2, '0');

  return (
    <motion.div 
      className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-card/45 border border-white/5 backdrop-blur-xl relative overflow-hidden group min-w-[75px] sm:min-w-[90px] shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
      whileHover={{ y: -4, borderColor: 'rgba(99, 102, 241, 0.25)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
      
      <motion.span 
        key={formattedVal}
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-2xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 tracking-tight"
      >
        {formattedVal}
      </motion.span>
      
      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1.5 group-hover:text-primary transition-colors">
        {label}
      </span>
    </motion.div>
  );
};

const Countdown = ({ targetDate }) => {
  const timeLeft = useCountdown(targetDate);

  return (
    <div className="flex gap-2.5 sm:gap-4 justify-center items-center my-6 relative z-20">
      <TimeCard value={timeLeft.days} label="Days" />
      <span className="text-xl sm:text-2xl font-bold text-white/20 animate-pulse">:</span>
      <TimeCard value={timeLeft.hours} label="Hours" />
      <span className="text-xl sm:text-2xl font-bold text-white/20 animate-pulse">:</span>
      <TimeCard value={timeLeft.minutes} label="Mins" />
      <span className="text-xl sm:text-2xl font-bold text-white/20 animate-pulse">:</span>
      <TimeCard value={timeLeft.seconds} label="Secs" />
    </div>
  );
};

export default Countdown;
