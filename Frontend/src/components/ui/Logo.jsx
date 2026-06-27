import React from "react";

export const LogoIcon = ({ className = "w-12 h-12" }) => {
  return (
    <img 
      src="/favicon.png" 
      alt="WorkQuora Logo" 
      className={`object-contain ${className}`}
    />
  );
};

const Logo = ({ darkMode = true }) => {
  const colorClass = darkMode ? 'text-[#e0d2ff]' : 'text-[#4f378a]';

  return (
    <div className={`flex items-center gap-3 ${colorClass}`}>
      <LogoIcon className="w-12 h-12" />

      <div>
        <h1
          className={`text-2xl font-bold ${
            darkMode
              ? "text-white"
              : "text-slate-900"
          }`}
        >
          WorkQuora
        </h1>

        <p
          className={`text-xs tracking-[0.2em] uppercase ${
            darkMode
              ? "text-slate-400"
              : "text-slate-500"
          }`}
        >
          Connecting Talent With Opportunity
        </p>
      </div>
    </div>
  );
};

export default Logo;