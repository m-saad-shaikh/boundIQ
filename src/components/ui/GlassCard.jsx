/**
 * GlassCard.jsx — Reusable glassmorphism card with optional glow
 */

import { motion } from 'framer-motion';

const glowMap = {
  pink:   'glow-pink',
  purple: 'glow-purple',
  cyan:   'glow-cyan',
  gold:   'glow-gold',
  none:   '',
};

export default function GlassCard({
  children,
  className = '',
  glow = 'none',
  hover = true,
  delay = 0,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={`glass rounded-2xl p-6 ${glowMap[glow]} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
