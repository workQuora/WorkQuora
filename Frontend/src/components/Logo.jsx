import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const LogoIcon = ({ className = "w-8 h-8" }) => {
  return (
    <img 
      src="/favicon.png" 
      alt="WorkQuora Logo" 
      className={`object-contain ${className}`}
    />
  );
};

const Logo = ({ showText = true, className = "w-8 h-8", textClassName = "text-xl" }) => {
  const { theme } = useTheme();
  const colorClass = theme === 'dark' ? 'text-[#e0d2ff]' : 'text-[#4f378a]';

  return (
    <div className={`flex items-center gap-2 select-none ${colorClass}`}>
      <LogoIcon className={className} />
      {showText && (
        <span className={`font-extrabold tracking-tight ${textClassName} ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          WorkQuora
        </span>
      )}
    </div>
  );
};

export default Logo;
