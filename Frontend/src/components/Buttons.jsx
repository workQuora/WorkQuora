import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export const MagneticButton = ({ children, onClick, className = '', active = false }) => {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    
    // Magnetic pull limit (0.3 of drag offset)
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative px-5 py-3 rounded-xl font-bold text-xs transition-shadow duration-300 select-none shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 cursor-pointer border ${className}`}
      animate={{ x: position.x, y: position.y }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 200, damping: 12, mass: 0.5 }}
    >
      {/* Background radial glow */}
      <span className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary/10 to-cyan-400/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      {children}
    </motion.button>
  );
};
