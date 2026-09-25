/**
 * LandingPage.jsx — Full immersive hero page
 * Updated: added trust signals, data-flow visual, "how it works" steps
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, Sparkles, Shield, Zap, Brain, MessageCircle, ChevronDown,
  Lock, Eye, Server, Monitor, CheckCircle2, ArrowRight, Upload,
  BarChart2, MessageSquare,
} from 'lucide-react';

import BondIQLogo from '../components/common/BondIQLogo.jsx';

// ── Particle Background ───────────────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 4,
    delay: Math.random() * 4,
    color: ['#ff2d78', '#8b5cf6', '#06b6d4', '#f59e0b'][Math.floor(Math.random() * 4)],
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full opacity-40"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
          }}
          animate={{ y: [-20, 20, -20], x: [-10, 10, -10], opacity: [0.2, 0.6, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
           style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl"
           style={{ background: 'radial-gradient(circle, #ff2d78, transparent)' }} />
    </div>
  );
}

// ── Trust Pill ────────────────────────────────────────────────────────────────
function TrustPill({ icon: Icon, label, color = 'emerald' }) {
  const colors = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    purple:  'bg-purple-500/10  border-purple-500/20  text-purple-400',
    cyan:    'bg-cyan-500/10    border-cyan-500/20    text-cyan-400',
  };
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${colors[color]}`}>
      <Icon size={11} />
      {label}
    </div>
  );
}

// ── How It Works Step ────────────────────────────────────────────────────────
function HowStep({ step, icon: Icon, title, desc, color, delay }) {
  const colors = {
    pink:   'from-pink-500 to-rose-500',
    purple: 'from-purple-500 to-violet-500',
    cyan:   'from-cyan-500 to-blue-500',
    gold:   'from-amber-500 to-orange-500',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center text-center gap-4"
    >
      <div className="relative">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${colors[color]}`}>
            <Icon size={22} className="text-white" />
          </div>
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="text-white/50 text-[10px] font-bold">{step}</span>
        </div>
      </div>
      <div>
        <h3 className="font-display font-bold text-white text-base mb-1">{title}</h3>
        <p className="text-white/40 text-sm leading-relaxed max-w-[180px] mx-auto">{desc}</p>
      </div>
    </motion.div>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, color, delay }) {
  const colorMap = {
    pink:   { text: 'text-pink-400',    border: 'border-pink-500/20',   bg: 'bg-pink-500/10' },
    purple: { text: 'text-purple-400',  border: 'border-purple-500/20', bg: 'bg-purple-500/10' },
    cyan:   { text: 'text-cyan-400',    border: 'border-cyan-500/20',   bg: 'bg-cyan-500/10' },
    gold:   { text: 'text-amber-400',   border: 'border-amber-500/20',  bg: 'bg-amber-500/10' },
    green:  { text: 'text-emerald-400', border: 'border-emerald-500/20',bg: 'bg-emerald-500/10' },
  };
  const c = colorMap[color] || colorMap.purple;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="glass rounded-2xl p-6 flex flex-col gap-4 group cursor-default"
    >
      <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={c.text} size={22} />
      </div>
      <div>
        <h3 className="font-display font-semibold text-white mb-1.5">{title}</h3>
        <p className="text-sm text-white/50 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// ── Data Flow Diagram ────────────────────────────────────────────────────────
function DataFlowDiagram() {
  const nodes = [
    { icon: '💬', label: 'Your Chat', sub: 'WhatsApp / Telegram / etc.', color: '#8b5cf6' },
    { icon: '🖥️', label: 'Your Browser', sub: 'Analyzed locally, never uploaded', color: '#06b6d4' },
    { icon: '🧠', label: 'AI Provider', sub: 'Only if you add an API key', color: '#f59e0b' },
    { icon: '📊', label: 'Your Results', sub: 'Shown only to you, then gone', color: '#10b981' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="max-w-3xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
        {nodes.map((node, i) => (
          <div key={i} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
            {/* Node */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.12 }}
              className="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl border border-white/8 text-center"
              style={{ background: `${node.color}12`, minWidth: 120 }}
            >
              <span className="text-2xl">{node.icon}</span>
              <div>
                <p className="text-white/80 text-xs font-bold">{node.label}</p>
                <p className="text-white/30 text-[9px] mt-0.5 leading-snug">{node.sub}</p>
              </div>
            </motion.div>

            {/* Arrow between nodes */}
            {i < nodes.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.12 }}
                className="flex items-center justify-center w-8 sm:w-6 rotate-90 sm:rotate-0 flex-shrink-0"
              >
                <div className="flex items-center gap-0.5">
                  <div className="w-4 h-px bg-white/15" />
                  <ArrowRight size={10} className="text-white/20" />
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>
      {/* No-server note */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7 }}
        className="flex items-center justify-center gap-2 mt-4"
      >
        <div className="w-2 h-2 rounded-full bg-red-500/60 flex-shrink-0" />
        <p className="text-white/25 text-[10px]">BondIQ servers never receive your chat data</p>
        <div className="w-2 h-2 rounded-full bg-red-500/60 flex-shrink-0" />
      </motion.div>
    </motion.div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'BondIQ — AI Relationship Intelligence & Chat Analysis';
  }, []);

  const features = [
    { icon: Heart,         title: 'Relationship Score',      description: 'Get a precise emotional health score based on communication patterns, affection, and consistency.',               color: 'pink',   delay: 0.1 },
    { icon: Brain,         title: 'AI Emotional Analysis',   description: 'AI reads emotional undertones in your conversations — detecting warmth, tension, and connection depth.',           color: 'purple', delay: 0.2 },
    { icon: MessageCircle, title: 'Communication Insights',  description: 'Discover who puts in more effort, who replies faster, and how balanced your communication really is.',             color: 'cyan',   delay: 0.3 },
    { icon: Sparkles,      title: 'Emotional Timeline',      description: 'See how your relationship emotions evolved month by month — from intense to distant and back.',                    color: 'gold',   delay: 0.4 },
    { icon: Zap,           title: 'Instant Local Analysis',  description: 'Lightning-fast stats computed privately in your browser. No data ever leaves your device.',                        color: 'green',  delay: 0.5 },
    { icon: Shield,        title: '100% Private & Secure',   description: 'Your chats are never stored or transmitted. AI analysis runs ephemerally and results are immediately discarded.',  color: 'purple', delay: 0.6 },
  ];

  const howSteps = [
    { step: '1', icon: Upload,       title: 'Upload or Paste',    desc: 'Export your chat from WhatsApp, Telegram, or any platform and paste it here.',  color: 'purple', delay: 0.1 },
    { step: '2', icon: Brain,        title: 'AI Analyzes',        desc: 'BondIQ reads emotional patterns, response times, and communication dynamics.',   color: 'pink',   delay: 0.2 },
    { step: '3', icon: BarChart2,    title: 'See the Insights',   desc: 'Beautiful charts, scores, and AI-written insights reveal your relationship.',     color: 'cyan',   delay: 0.3 },
    { step: '4', icon: MessageSquare,title: 'Ask the AI Coach',   desc: 'Chat with an AI coach who knows your relationship — get personal advice.',       color: 'gold',   delay: 0.4 },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(180deg, #050510 0%, #0d0d2b 50%, #050510 100%)' }}>
      <Particles />

      {/* ── Nav ───────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex items-center justify-between px-4 sm:px-6 md:px-12 py-5"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <BondIQLogo size={36} textSize="md" />
          <span className="hidden sm:inline-block w-px h-5 bg-white/10" />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] sm:text-xs text-white/70 font-medium">
              Developed by <strong className="text-white font-semibold tracking-wide">M Saad Shaikh</strong>
            </span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/analyze')}
          className="btn-primary text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5"
        >
          <Sparkles size={14} />
          <span>Try Now — Free</span>
        </motion.button>
      </motion.nav>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-12 pb-28 min-h-[85vh]"
      >
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-medium text-purple-300 border border-purple-500/20">
            <Sparkles size={12} className="text-purple-400" />
            AI-Powered Emotional Intelligence
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-display font-black text-4xl sm:text-5xl md:text-7xl leading-tight mb-6 max-w-5xl"
        >
          <span className="text-white">Discover the </span>
          <span className="text-gradient-pink-purple">Emotional Story</span>
          <br />
          <span className="text-white">Hidden in Your </span>
          <span className="text-gradient-cyan-purple">Conversations</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-white/50 text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed mb-8"
        >
          Upload your WhatsApp, Telegram, or any chat. BondIQ uses AI to reveal relationship health,
          emotional patterns, and communication dynamics — <strong className="text-white/70">100% privately in your browser.</strong>
        </motion.p>

        {/* ── Trust Pills row ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          <TrustPill icon={Lock}          label="Chat never leaves your device" color="emerald" />
          <TrustPill icon={Eye}           label="Zero data stored"               color="emerald" />
          <TrustPill icon={Server}        label="No account required"            color="purple"  />
          <TrustPill icon={CheckCircle2}  label="Free to use"                    color="cyan"    />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/analyze')}
            className="btn-primary text-base px-10 py-4"
          >
            <Heart size={18} fill="currentColor" />
            Analyze My Chat
          </motion.button>
          <p className="text-white/25 text-xs">Takes &lt;30 seconds · No signup · 100% private</p>
        </motion.div>

        {/* ── Mock Results Preview Card ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.9, type: 'spring', damping: 20 }}
          className="mt-14 w-full max-w-md relative"
        >
          {/* Glow behind card */}
          <div className="absolute inset-0 rounded-3xl blur-2xl opacity-20"
               style={{ background: 'linear-gradient(135deg, #ff2d78, #8b5cf6)' }} />

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative rounded-3xl border border-white/10 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(13,13,43,0.95), rgba(5,5,16,0.98))', backdropFilter: 'blur(20px)' }}
          >
            {/* Card header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg,#ff2d78,#8b5cf6)' }}>
                  <Heart size={14} className="text-white" fill="white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold">Alex & Jordan</p>
                  <p className="text-white/30 text-[10px]">1,247 messages · 6 months</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[10px] font-bold">LIVE PREVIEW</span>
              </div>
            </div>

            <div className="px-5 py-4 flex flex-col gap-4">
              {/* Score ring + label */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <motion.circle
                      cx="32" cy="32" r="26"
                      fill="none" stroke="url(#scoreGrad)" strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - 0.82) }}
                      transition={{ duration: 1.5, delay: 1.2, ease: 'easeOut' }}
                    />
                    <defs>
                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ff2d78" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.4 }}
                      className="text-white font-display font-black text-lg"
                    >82</motion.span>
                  </div>
                </div>
                <div>
                  <p className="text-white font-display font-bold text-base">Strong Bond 💕</p>
                  <p className="text-white/40 text-xs leading-relaxed">High emotional warmth with balanced communication patterns detected.</p>
                </div>
              </div>

              {/* Stat bars */}
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Emotional Warmth',    pct: 88, color: 'from-pink-500 to-rose-400' },
                  { label: 'Communication Balance', pct: 74, color: 'from-purple-500 to-violet-400' },
                  { label: 'Response Consistency', pct: 91, color: 'from-cyan-500 to-blue-400' },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-white/40 text-[10px]">{s.label}</span>
                      <span className="text-white/50 text-[10px] font-semibold">{s.pct}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 0.8, delay: 1.3 + i * 0.1, ease: 'easeOut' }}
                        className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Emotion tags */}
              <div className="flex flex-wrap gap-1.5">
                {['💕 Loving', '😄 Playful', '🤗 Supportive', '😊 Comfortable'].map((tag, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.6 + i * 0.07 }}
                    className="px-2.5 py-1 rounded-full text-[10px] text-white/60 border border-white/8"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >{tag}</motion.span>
                ))}
              </div>

              {/* AI insight snippet */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.9 }}
                className="px-3 py-2.5 rounded-xl text-[10px] text-white/50 leading-relaxed italic"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}
              >
                🧠 <span className="text-purple-300 font-semibold not-italic">AI Insight:</span> Jordan initiates conversations 58% of the time, while Alex responds significantly faster — suggesting mutual investment with complementary communication styles...
              </motion.div>
            </div>

            {/* Bottom CTA */}
            <div className="px-5 pb-5">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/analyze')}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #ff2d78, #8b5cf6)' }}
              >
                Get your own analysis →
              </motion.button>
            </div>
          </motion.div>

          {/* "Demo only" label */}
          <p className="text-center text-white/15 text-[9px] mt-2 tracking-wider">
            ↑ SAMPLE OUTPUT — your results will be personalized
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-16 text-white/20"
        >
          <ChevronDown size={24} />
        </motion.div>
      </section>

      {/* ── How It Works ───────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 pb-24 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400/70 mb-3 block">Simple Process</span>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-3">
            How It <span className="text-gradient-pink-purple">Works</span>
          </h2>
          <p className="text-white/35 text-sm max-w-md mx-auto">
            From raw chat to deep emotional insights in under a minute.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4">
          {howSteps.map((s, i) => <HowStep key={i} {...s} />)}
        </div>

        {/* Connector line (desktop) */}
        <div className="hidden sm:block relative mt-0 -mt-[calc(50%+28px)] pointer-events-none" />
      </section>

      {/* ── Platforms ─────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <p className="text-white/30 text-xs font-medium tracking-widest uppercase mb-4">Supports</p>
        <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'WhatsApp',  emoji: '💬' },
              { label: 'Telegram',  emoji: '✈️' },
              { label: 'Instagram', emoji: '📸' },
              { label: 'Plain Text',emoji: '📄' },
              { label: 'More soon…',emoji: '🔜', dim: true },
            ].map((p, i) => (
              <motion.span
                key={p.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`px-4 py-2 glass rounded-full text-sm border border-white/10 flex items-center gap-2 ${p.dim ? 'text-white/25' : 'text-white/60'}`}
              >
                <span>{p.emoji}</span>{p.label}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Features Grid ─────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 pb-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-3">
            What BondIQ <span className="text-gradient-pink-purple">Reveals</span>
          </h2>
          <p className="text-white/40 text-base max-w-xl mx-auto">
            A deep, cinematic analysis of your relationship — like nothing you've seen before.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>
      </section>

      {/* ── Privacy / Data Flow Section ────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400/70 mb-3 block">Privacy First</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-3">
              Your Chat <span className="text-emerald-400">Never Leaves</span> Your Device
            </h2>
            <p className="text-white/35 text-sm max-w-lg mx-auto">
              We built BondIQ so that even <em>we</em> can't see your conversations.
              Here's exactly where your data goes:
            </p>
          </div>

          {/* Data flow diagram */}
          <DataFlowDiagram />

          {/* Guarantee grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10">
            {[
              { icon: Lock,    color: 'emerald', title: 'Zero Server Storage',    desc: 'Your chat is processed in your browser and discarded immediately.' },
              { icon: Eye,     color: 'purple',  title: 'Completely Anonymous',   desc: 'No account, no email, no IP logging. You are invisible to us.' },
              { icon: Monitor, color: 'cyan',    title: 'Verify in DevTools',     desc: 'Open F12 → Network tab anytime. See for yourself — no upload to us.' },
            ].map((g, i) => {
              const colors = {
                emerald: { bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.15)', text: 'text-emerald-400', icon: 'text-emerald-400' },
                purple:  { bg: 'rgba(139,92,246,0.06)',  border: 'rgba(139,92,246,0.15)', text: 'text-purple-400',  icon: 'text-purple-400' },
                cyan:    { bg: 'rgba(6,182,212,0.06)',   border: 'rgba(6,182,212,0.15)',  text: 'text-cyan-400',    icon: 'text-cyan-400' },
              };
              const c = colors[g.color];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center`}
                       style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                    <g.icon size={16} className={c.icon} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${c.text} mb-1`}>{g.title}</p>
                    <p className="text-white/35 text-xs leading-relaxed">{g.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display font-black text-3xl md:text-5xl text-white mb-4">
            Ready to understand your <span className="text-gradient-pink-purple">relationship?</span>
          </h2>
          <p className="text-white/40 mb-3">Takes less than 30 seconds. No signup. No data stored.</p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <TrustPill icon={Lock}         label="Private"        color="emerald" />
            <TrustPill icon={CheckCircle2} label="Free"           color="emerald" />
            <TrustPill icon={Server}       label="No Account"     color="purple"  />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/analyze')}
            className="btn-primary text-lg px-12 py-5"
          >
            <Heart size={20} fill="currentColor" />
            Start Free Analysis
          </motion.button>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 px-6 md:px-12 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto">
          <div className="opacity-70 hover:opacity-100 transition-opacity">
            <BondIQLogo size={24} textSize="sm" />
          </div>
          <p className="text-white/20 text-xs">Made with ❤️ by <span className="text-white/40 font-semibold">M SAAD SHAIKH</span></p>
        </div>
      </footer>
    </div>
  );
}
