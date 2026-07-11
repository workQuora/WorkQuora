import React from 'react';
import { motion } from 'framer-motion';

export const FilterChip = ({ label, active, onClick, layoutId = 'filter-chip-highlight' }) => (
  <button
    onClick={onClick}
    className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
      active ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'
    }`}
  >
    {active && (
      <motion.span
        layoutId={layoutId}
        className="absolute inset-0 bg-primary rounded-full"
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      />
    )}
    <span className="relative z-10">{label}</span>
  </button>
);

export default FilterChip;
