import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:   'bg-primary text-white hover:bg-primary/90 shadow-sm',
  secondary: 'bg-white dark:bg-zinc-900 border border-border text-foreground hover:bg-muted',
  ghost:     'text-foreground hover:bg-muted',
  danger:    'bg-danger text-white hover:bg-danger/90',
};

const SIZES = {
  sm: 'text-sm px-3.5 py-2',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-6 py-3',
};

const Button = ({ children, variant = 'primary', size = 'md', isLoading, className = '', as: Tag = 'button', disabled, ...props }) => (
  <Tag
    className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    {...props}
    disabled={Tag === 'button' ? (isLoading || disabled) : undefined}
  >
    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
  </Tag>
);

export default Button;
