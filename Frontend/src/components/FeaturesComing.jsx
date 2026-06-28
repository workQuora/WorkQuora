import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, MessageCircle, Video, Award, ShieldAlert, Navigation2, FileSpreadsheet, Bot, Layout } from 'lucide-react';

import { useAppStore } from '../store/appStore';

const ICON_MAP = {
  'AI Matching': Brain,
  'Instant Payments': Zap,
  'Live Chat': MessageCircle,
  'Video Calls': Video,
  'Skill Verification': Award,
  'Blockchain Certs': ShieldAlert,
  'Realtime Tracking': Navigation2,
  'Smart Contracts': FileSpreadsheet,
  'AI Assistant': Bot,
  'Premium Dashboard': Layout
};

const DEFAULT_FEATURES = [
  { title: 'AI Matching', desc: 'Hyper-personalized job allocation algorithms matched by skills, rating, and location.' },
  { title: 'Instant Payments', desc: 'Milestone escrow funding and instant withdrawal settlements linked to primary banks.' },
  { title: 'Live Chat', desc: 'Realtime chat engines. Workers can respond immediately once bid is accepted.' },
  { title: 'Video Calls', desc: 'Encrypted screen sharing and high fidelity in-browser video calls for client consultations.' },
  { title: 'Skill Verification', desc: 'Automated vetting system validating freelancer skills and credentials dynamically.' },
  { title: 'Blockchain Certs', desc: 'Decentralized trust certificate badges minted directly to your freelancer profile.' },
  { title: 'Realtime Tracking', desc: 'Active travel and project milestones tracked via geolocation parameters.' },
  { title: 'Smart Contracts', desc: 'Secure, legally-binding freelance contract schemas created automatically on hiring.' },
  { title: 'AI Assistant', desc: 'Built-in platform guide and optimization advisor powered by advanced LLMs.' },
  { title: 'Premium Dashboard', desc: 'Analytical performance dashboard tracking all time income, reviews, and tasks.' },
];

const FeaturesComing = () => {
  const { maintenanceData } = useAppStore();
  const rawFeatures = maintenanceData?.features || DEFAULT_FEATURES;

  return (
    <div className="w-full relative z-20">
      <div className="text-center mb-10">
        <h3 className="text-sm font-bold text-primary uppercase tracking-widest block mb-1">Coming Features</h3>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">WorkQuora Advancements</h2>
        <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
          Here is a sneak peek at what is deploying under the current upgrade sequence.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rawFeatures.map((feat, idx) => {
          const IconComp = ICON_MAP[feat.title] || Brain;
          return (
            <motion.div
              key={feat.title}
              className="p-6 bg-card/25 border border-white/5 hover:border-primary/20 backdrop-blur-xl rounded-3xl relative overflow-hidden transition-all duration-300 group shadow-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(99,102,241,0.05)' }}
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
              <div className="w-10 h-10 bg-primary/10 text-primary group-hover:text-cyan-400 group-hover:bg-cyan-400/10 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 border border-primary/20">
                <IconComp size={18} />
              </div>

              <h4 className="text-sm font-extrabold text-white mb-2 group-hover:text-primary transition-colors">{feat.title}</h4>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">{feat.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturesComing;
