/**
 * LoadingScreen.jsx — Cinematic AI loading animation
 */

import { motion } from 'framer-motion';
import { Brain, Heart, Sparkles } from 'lucide-react';

const STAGE_ICONS = {
  parsing: FileText,
  local:   Brain,
  ai:      Sparkles,
};

function FileText({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10,9 9,9 8,9"/>
    </svg>
  );
}

// ── Orbiting Particle Ring ────────────────────────────────────────────────────
function OrbitRing({ radius, count, color, duration }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 8px ${color}`,
              left: '50%',
              top: '50%',
              marginLeft: -4,
              marginTop: -4,
            }}
            animate={{
              x: [
                Math.cos(angle) * radius,
                Math.cos(angle + Math.PI * 2) * radius,
              ],
              y: [
                Math.sin(angle) * radius,
                Math.sin(angle + Math.PI * 2) * radius,
              ],
              opacity: [0.3, 1, 0.3],
              scale: [0.6, 1.2, 0.6],
            }}
            transition={{
              duration,
              repeat: Infinity,
              ease: 'linear',
              delay: (i / count) * duration,
            }}
          />
        );
      })}
    </>
  );
}

// ── Stage label data ──────────────────────────────────────────────────────────
const STAGE_DATA = {
  parsing: { color: '#06b6d4', label: 'Parsing Conversation' },
  local:   { color: '#8b5cf6', label: 'Analyzing Patterns'   },
  ai:      { color: '#ff2d78', label: 'AI Deep Analysis'     },
};

export default function LoadingScreen({ stage, progress, label }) {
  const current = STAGE_DATA[stage] || STAGE_DATA.ai;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #050510 0%, #0d0d2b 100%)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse at center, ${current.color}15 0%, transparent 70%)`,
        }}
      />

      {/* Central orb */}
      <div className="relative mb-12">
        <div className="relative w-40 h-40">
          {/* Outer ring orbit */}
          <OrbitRing radius={72} count={6} color="#8b5cf6" duration={4} />
          {/* Middle ring orbit */}
          <OrbitRing radius={52} count={4} color="#ff2d78" duration={3} />
          {/* Inner ring orbit */}
          <OrbitRing radius={32} count={3} color="#06b6d4" duration={2} />

          {/* Central pulsing heart */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                boxShadow: [
                  '0 0 20px rgba(255,45,120,0.4)',
                  '0 0 50px rgba(255,45,120,0.7)',
                  '0 0 20px rgba(255,45,120,0.4)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ff2d78, #8b5cf6)' }}
            >
              <Heart size={36} className="text-white" fill="white" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stage label */}
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-center mb-8 px-6"
      >
        <p className="font-display font-bold text-2xl text-white mb-2">{label || 'Analyzing...'}</p>
        <p className="text-white/30 text-sm">Please wait while BondIQ reads your conversation</p>
      </motion.div>

      {/* Progress bar */}
      <div className="w-64 sm:w-80">
        <div className="flex justify-between text-xs text-white/30 mb-2">
          <span>Processing</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, #ff2d78, #8b5cf6, #06b6d4)` }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Stage indicators */}
      <div className="flex gap-6 mt-10">
        {[
          { key: 'parsing', label: 'Parse',   done: progress >= 25 },
          { key: 'local',   label: 'Analyze', done: progress >= 55 },
          { key: 'ai',      label: 'AI',      done: progress >= 90 },
        ].map(s => (
          <div key={s.key} className="flex flex-col items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
              s.done ? 'bg-emerald-400 scale-125' : 'bg-white/20'
            }`} />
            <span className={`text-xs transition-colors duration-300 ${
              s.done ? 'text-emerald-400' : 'text-white/20'
            }`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Privacy reminder */}
      <p className="absolute bottom-8 text-white/15 text-xs">
        🔒 Your data never leaves your device
      </p>
    </div>
  );
}
