import React from 'react';
import { motion } from 'framer-motion';

import { useAppStore } from '../store/appStore';

const DEFAULT_MILESTONES = [
  { day: 'Yesterday', title: 'Asset & Database Lock', desc: 'Secure snapshot and legacy DB freeze completed. Server offline transition initialized.', date: 'June 27' },
  { day: 'Today', title: 'Vol 11 Core Migration', desc: 'Running security upgrades, AES encryption integration, and Wallet instantiation.', date: 'June 28 (Current)' },
  { day: 'Tomorrow', title: 'WorkQuora V3 Launch', desc: 'Global domain propagation, smart-matching AI tests, and sandbox deployment.', date: 'June 29' },
];

const Timeline = () => {
  const { maintenanceData } = useAppStore();
  const rawMilestones = maintenanceData?.milestones || DEFAULT_MILESTONES;

  return (
    <div className="w-full relative py-6">
      {/* Central trace line */}
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-primary/10 via-primary/50 to-cyan-400/10 pointer-events-none" />
      
      <div className="space-y-12">
        {rawMilestones.map((m, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <div key={m.day} className={`flex flex-col md:flex-row items-start md:items-center relative ${isEven ? 'md:flex-row-reverse' : ''}`}>
              
              {/* Central node */}
              <div className="absolute left-6 md:left-1/2 w-3.5 h-3.5 -translate-x-[7px] rounded-full border border-cyan-400 bg-[#09090B] shadow-[0_0_10px_#22d3ee] z-10" />

              {/* Card wrapper */}
              <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${isEven ? 'md:pr-12 text-left md:text-right' : 'md:pl-12 text-left'}`}>
                <motion.div
                  className="bg-card/20 border border-white/5 p-6 rounded-2xl backdrop-blur-xl relative overflow-hidden inline-block max-w-sm md:max-w-md w-full shadow-lg"
                  initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, type: 'spring', damping: 20 }}
                >
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">
                    {m.day} · {m.date}
                  </span>
                  
                  <h4 className="text-sm font-extrabold text-white mb-2">{m.title}</h4>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                </motion.div>
              </div>
              
              {/* Empty placeholder column to balance grid */}
              <div className="hidden md:block w-1/2" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;
