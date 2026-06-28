import { useState, useEffect } from 'react';

export const useCursor = () => {
  const [cursorType, setCursorType] = useState('default'); // 'default', 'hover', 'magnetic', 'hide'

  useEffect(() => {
    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;
      
      const isClickable = 
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.closest('a') || 
        target.closest('button') || 
        target.getAttribute('role') === 'button';
        
      if (isClickable) {
        setCursorType('hover');
      } else {
        setCursorType('default');
      }
    };

    window.addEventListener('mouseover', handleMouseOver);
    return () => window.removeEventListener('mouseover', handleMouseOver);
  }, []);

  return { cursorType, setCursorType };
};
