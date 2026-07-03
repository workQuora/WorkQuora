import { motion } from 'framer-motion';
import { scaleIn } from '../../utils/animations';

export function AnimatedCard({ children, className = '', delay = 0, hover = true }) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay }}
      whileHover={
        hover
          ? {
              y: -4,
              boxShadow: 'var(--card-shadow-hover)',
              transition: { duration: 0.2 },
            }
          : {}
      }
      className={`bg-[hsl(var(--surface))] rounded-[var(--radius)] border border-[hsl(var(--border))]
                  shadow-[var(--card-shadow)] ${className}`}
    >
      {children}
    </motion.div>
  );
}
