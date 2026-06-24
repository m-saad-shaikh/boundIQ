/**
 * RelationshipStatus.jsx — Status card with large emoji and description
 */

import { motion } from 'framer-motion';

const STATUS_CONFIG = {
  'Soul Connected': {
    emoji: '💞', gradient: 'from-pink-500/20 to-purple-500/20',
    border: 'border-pink-500/30', glow: 'rgba(255,45,120,0.2)',
    description: 'An exceptionally deep emotional bond. You understand each other on a soul level.',
  },
  'Emotionally Strong': {
    emoji: '❤️', gradient: 'from-rose-500/20 to-pink-500/20',
    border: 'border-rose-500/30', glow: 'rgba(244,63,94,0.2)',
    description: 'A strong, healthy connection with consistent emotional investment from both sides.',
  },
  'Growing Bond': {
    emoji: '🌱', gradient: 'from-emerald-500/20 to-cyan-500/20',
    border: 'border-emerald-500/30', glow: 'rgba(16,185,129,0.2)',
    description: 'Your relationship is actively deepening. The connection is building beautifully.',
  },
  'Mixed Signals': {
    emoji: '😶', gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30', glow: 'rgba(245,158,11,0.2)',
    description: 'Some inconsistency in communication. Clarity and openness could strengthen the bond.',
  },
  'Emotionally Distant': {
    emoji: '❄️', gradient: 'from-blue-500/20 to-slate-500/20',
    border: 'border-blue-500/30', glow: 'rgba(59,130,246,0.2)',
    description: 'The emotional connection has cooled. More intentional communication could help.',
  },
  'Dry Connection': {
    emoji: '🥶', gradient: 'from-slate-600/20 to-gray-600/20',
    border: 'border-slate-500/20', glow: 'rgba(100,116,139,0.15)',
    description: 'Minimal emotional depth detected. This relationship may benefit from more vulnerability.',
  },
};

export default function RelationshipStatus({ status = 'Growing Bond', emoji }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Growing Bond'];
  const displayEmoji = emoji || cfg.emoji;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className={`glass rounded-3xl p-8 flex flex-col items-center text-center bg-gradient-to-br ${cfg.gradient} ${cfg.border} border`}
      style={{ boxShadow: `0 0 40px ${cfg.glow}` }}
    >
      <p className="font-display font-semibold text-white/50 text-sm uppercase tracking-widest mb-6">
        Relationship Status
      </p>

      {/* Large animated emoji */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [-3, 3, -3],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="text-7xl mb-5 select-none"
      >
        {displayEmoji}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="font-display font-black text-2xl text-white mb-3"
      >
        {status}
      </motion.h2>

      <p className="text-white/40 text-sm leading-relaxed max-w-xs">
        {cfg.description}
      </p>
    </motion.div>
  );
}
