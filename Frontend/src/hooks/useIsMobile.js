import { useState, useEffect } from 'react';

const DEFAULT_BREAKPOINT = 768;

const getIsMobile = (breakpoint) => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoint;
};

export const useIsMobile = (breakpoint = DEFAULT_BREAKPOINT) => {
  const [isMobile, setIsMobile] = useState(() => getIsMobile(breakpoint));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleResize = () => {
      setIsMobile(getIsMobile(breakpoint));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
};
