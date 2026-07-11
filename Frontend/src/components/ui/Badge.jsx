import React from 'react';

const STYLES = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger:  'bg-danger/10 text-danger',
  info:    'bg-primary/10 text-primary',
  neutral: 'bg-muted text-muted-foreground',
};

export const Badge = ({ children, variant = 'neutral' }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STYLES[variant]}`}>
    {children}
  </span>
);

export default Badge;
