import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Database, Brain, Cpu, Globe, Rocket } from 'lucide-react';
import { useAppStore } from '../store/appStore';

const ICON_MAP = {
  Rocket,
  Database,
  ShieldCheck,
  Brain,
  Cpu,
  Globe
};

const DEFAULT_ITEMS = [
  { label: 'Server Optimization', icon: 'Rocket', status: 'Completed', color: 'text-emerald-400' },
  { label: 'Database Migration', icon: 'Database', status: 'Completed', color: 'text-emerald-400' },
  { label: 'Security Upgrade (AES-256)', icon: 'ShieldCheck', status: 'Completed', color: 'text-emerald-400' },
  { label: 'AI Matching Engines', icon: 'Brain', status: 'Optimizing', color: 'text-cyan-400' },
  { label: 'Payment Gateway Integration', icon: 'Cpu', status: 'Testing', color: 'text-amber-400 animate-pulse' },
  { label: 'Global CDN Deployment', icon: 'Globe', status: 'Queued', color: 'text-muted-foreground/60' },
];

const SystemStatus = () => {
  const { maintenanceData } = useAppStore();
  const rawItems = maintenanceData?.systemStatus || DEFAULT_ITEMS;

  return (
    <div className="w-full bg-card/25 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" /> System Upgrade Console
      </h3>
      
      <div className="grid sm:grid-cols-2 gap-4">
        {rawItems.map((item, idx) => {
          const IconComp = ICON_MAP[item.icon] || Rocket;
          return (
            <motion.div
              key={item.label}
              className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5 text-primary">
                  <IconComp size={16} />
                </div>
                <span className="text-xs font-semibold text-foreground/80">{item.label}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${item.color || 'text-muted-foreground'}`}>
                  {item.status}
                </span>
                {item.status === 'Completed' && (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SystemStatus;
