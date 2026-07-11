import React, { forwardRef } from 'react';

const Input = forwardRef(({ label, error, icon: Icon, className = '', ...props }, ref) => (
  <div className="w-full mb-4">
    {label && <label className="block text-sm font-medium text-foreground mb-2">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />}
      <input
        ref={ref}
        className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-zinc-800/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${Icon ? 'pl-10' : ''} ${error ? 'border-danger' : 'border-border focus:border-primary'} ${className}`}
        {...props}
      />
    </div>
    {error && <p className="text-danger text-xs mt-1">{error}</p>}
  </div>
));

Input.displayName = 'Input';

export default Input;
