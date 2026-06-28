import React, { useEffect, useState, useRef } from 'react';
import { useMouse } from '../hooks/useMouse';
import { useCursor } from '../hooks/useCursor';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const Cursor = () => {
  const mouse = useMouse();
  const { cursorType } = useCursor();
  const [isVisible, setIsVisible] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 40, stiffness: 400, mass: 0.4 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    if (mouse.x !== 0 || mouse.y !== 0) {
      cursorX.set(mouse.x);
      cursorY.set(mouse.y);
      setIsVisible(true);
    }
  }, [mouse, cursorX, cursorY]);

  if (!isVisible) return null;

  const size = cursorType === 'hover' ? 64 : 16;
  const glowOpacity = cursorType === 'hover' ? 0.35 : 0.15;
  const borderCol = cursorType === 'hover' ? 'border-primary' : 'border-white/50';
  const bgCol = cursorType === 'hover' ? 'bg-primary/20' : 'bg-transparent';

  return (
    <>
      {/* Glow dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          width: 6,
          height: 6,
          boxShadow: '0 0 12px 4px rgba(34, 211, 238, 0.8)',
        }}
      />
      {/* Outer ring */}
      <motion.div
        className={`pointer-events-none fixed top-0 left-0 z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full border ${borderCol} ${bgCol} transition-colors duration-300`}
        animate={{
          width: size,
          height: size,
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          boxShadow: `0 0 20px 4px rgba(99, 102, 241, ${glowOpacity})`,
        }}
      />
    </>
  );
};

export default Cursor;
