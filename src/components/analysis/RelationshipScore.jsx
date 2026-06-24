/**
 * RelationshipScore.jsx — Animated circular score meter
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Heart } from 'lucide-react';

function getScoreColor(score) {
  if (score >= 80) return { start: '#10b981', end: '#06b6d4', glow: 'rgba(16,185,129,0.4)' };
  if (score >= 60) return { start: '#ff2d78', end: '#8b5cf6', glow: 'rgba(255,45,120,0.4)' };
  if (score >= 40) return { start: '#f59e0b', end: '#ff2d78', glow: 'rgba(245,158,11,0.4)' };
  return { start: '#6b7280', end: '#4b5563', glow: 'rgba(107,114,128,0.3)' };
}

function getScoreLabel(score) {
  if (score >= 85) return 'Exceptional ✨';
  if (score >= 70) return 'Very Strong ❤️';
  if (score >= 55) return 'Healthy 🌱';
  if (score >= 40) return 'Developing 💛';
  return 'Needs Attention 💔';
}

// Animated SVG arc
function ScoreArc({ score, size = 220 }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const start    = performance.now();
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(eased * score));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [inView, score]);

  const colors = getScoreColor(score);
  const radius = 85;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc from -225deg → 45deg = 270deg sweep
  const sweepFraction = (displayed / 100) * 0.75;
  const dashOffset    = circumference * (1 - sweepFraction);
  const gradId        = 'scoreGrad';

  return (
    <div ref={ref} className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-[225deg]">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="12"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <motion.circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="12"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${colors.glow})` }}
          initial={{ strokeDashoffset: circumference * 0.75 }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </svg>

      {/* Center content */}
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div
            className="font-display font-black text-5xl mb-1"
            style={{
              background: `linear-gradient(135deg, ${colors.start}, ${colors.end})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {displayed}
            <span className="text-2xl">%</span>
          </div>
          <Heart size={18} className="mx-auto text-pink-400" fill="currentColor" />
        </motion.div>
      </div>
    </div>
  );
}

export default function RelationshipScore({ score = 75 }) {
  const colors = getScoreColor(score);
  const label  = getScoreLabel(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="glass rounded-3xl p-8 flex flex-col items-center text-center"
      style={{
        border: `1px solid ${colors.glow}`,
        boxShadow: `0 0 40px ${colors.glow}25, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <p className="font-display font-semibold text-white/50 text-sm uppercase tracking-widest mb-6">
        Relationship Score
      </p>
      <ScoreArc score={score} />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1.2 }}
        className="mt-4"
      >
        <p className="font-display font-bold text-xl text-white">{label}</p>
        <p className="text-white/30 text-xs mt-1">Based on communication patterns & emotional depth</p>
      </motion.div>
    </motion.div>
  );
}
