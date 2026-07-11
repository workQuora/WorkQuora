import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(({ label, error, options = [], className = '', ...props }, ref) => (
  <div className="w-full mb-4">
    {label && <label className="block text-sm font-medium text-foreground mb-2">{label}</label>}
    <div className="relative">
      <select
        ref={ref}
        className={`w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl text-sm bg-white dark:bg-zinc-800/50 border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${error ? 'border-danger' : 'border-border focus:border-primary'} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
    {error && <p className="text-danger text-xs mt-1">{error}</p>}
  </div>
));

Select.displayName = 'Select';

export default Select;
