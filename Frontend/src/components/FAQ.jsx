import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

import { useAppStore } from '../store/appStore';

const DEFAULT_FAQ_ITEMS = [
  {
    q: "Why is WorkQuora currently undergoing maintenance?",
    a: "We are migrating our database indexes and scaling up our servers to deploy version 3.0. This includes integrating enhanced security upgrades (AES-256 for KYC details) and our new AI-assisted matching engines."
  },
  {
    q: "How long will the platform be offline?",
    a: "The upgrade sequence is projected to finalize on June 29. Refer to the countdown timer above for real-time live launch updates."
  },
  {
    q: "Will my active tasks, escrows, and balances be safe?",
    a: "Absolutely. All active jobs, financial ledgers, wallets, and escrow balances are locked in secure snapshot storage. Everything will resume seamlessly exactly where it was left."
  },
  {
    q: "How can I contact support if I have an urgent transaction query?",
    a: "You can reach out to our dedicated support team immediately via email at support@workquora.local or by clicking the Support button on this page."
  }
];

const AccordionItem = ({ q, a, isOpen, onClick }) => {
  return (
    <div className="border-b border-white/5 last:border-0 py-1">
      <button
        onClick={onClick}
        className="w-full py-4 flex items-center justify-between text-left focus:outline-none group"
      >
        <div className="flex items-center gap-3">
          <HelpCircle size={14} className="text-primary group-hover:text-cyan-400 transition-colors shrink-0" />
          <span className="text-xs font-semibold text-foreground/80 group-hover:text-white transition-colors">{q}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground shrink-0 ml-4"
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-xs text-muted-foreground/80 pb-4 pl-7 leading-relaxed whitespace-pre-line">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleIndex = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const { maintenanceData } = useAppStore();
  const rawFaqs = maintenanceData?.faqs || DEFAULT_FAQ_ITEMS;

  return (
    <div className="w-full bg-card/25 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Frequently Asked Questions</h3>
      
      <div className="divide-y divide-white/5">
        {rawFaqs.map((item, idx) => (
          <AccordionItem
            key={idx}
            q={item.q}
            a={item.a}
            isOpen={openIndex === idx}
            onClick={() => toggleIndex(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default FAQ;
