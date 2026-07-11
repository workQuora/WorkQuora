import React from 'react';

export const Toggle = ({ label, description, value, onChange, disabled }) => (
  <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
    <div className="pr-4">
      <p className="font-medium text-foreground text-sm">{label}</p>
      {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`w-11 h-6 rounded-full relative transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${value ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'}`}
    >
      <span
        className={`block w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  </div>
);

export default Toggle;
