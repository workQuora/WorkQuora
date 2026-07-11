import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchBox = ({ value, onChange, onClear, placeholder = 'Search…', className = '' }) => (
  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted border border-transparent focus-within:border-primary/30 focus-within:bg-white dark:focus-within:bg-zinc-900 transition-colors ${className}`}>
    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
    />
    {onClear && value && (
      <button
        type="button"
        onClick={onClear}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

export default SearchBox;
