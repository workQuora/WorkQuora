import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Meteor = () => {
  const [meteors, setMeteors] = useState([]);

  useEffect(() => {
    const spawnMeteor = () => {
      const id = Math.random();
      const top = Math.random() * 40; // top 40%
      const left = 30 + Math.random() * 60; // start right-ish
      const duration = 1 + Math.random() * 2;
      const size = 1 + Math.random() * 2; // pixel width

      const newMeteor = { id, top, left, duration, size };
      setMeteors((prev) => [...prev, newMeteor]);

      setTimeout(() => {
        setMeteors((prev) => prev.filter((m) => m.id !== id));
      }, duration * 1000);
    };

    // Spawn meteor every 4-8 seconds
    const interval = setInterval(() => {
      spawnMeteor();
    }, 4500 + Math.random() * 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-1">
      <AnimatePresence>
        {meteors.map((m) => (
          <motion.span
            key={m.id}
            className="absolute bg-gradient-to-r from-cyan-400 to-transparent rounded-full shadow-[0_0_12px_#22d3ee]"
            style={{
              top: `${m.top}%`,
              left: `${m.left}%`,
              width: `${m.size * 60}px`, // tail length
              height: `${m.size}px`,
              rotate: '-35deg',
              transformOrigin: 'left center',
            }}
            initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: -300,
              y: 210, // diagonally down-left
              scale: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: m.duration,
              ease: 'easeOut',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Meteor;
