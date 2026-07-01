/**
 * LandingPage.jsx — Full immersive hero page
 */

import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Heart, Sparkles, Shield, Zap, Brain, MessageCircle, ChevronDown } from 'lucide-react';
import { useRef } from 'react';
import BondIQLogo from '../components/common/BondIQLogo.jsx';

// ── Particle Background ───────────────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
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
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
           style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl"
           style={{ background: 'radial-gradient(circle, #ff2d78, transparent)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
           style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
    </div>
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

// ── Privacy Badge ─────────────────────────────────────────────────────────────
function PrivacyBadge({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-white/60">
      <Icon size={14} className="text-emerald-400" />
      {label}
    </div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef  = useRef(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0], { clamp: true });
  const heroY       = useTransform(scrollY, [0, 400], [0, -100], { clamp: true });

  const features = [
    {
      icon: Heart,
      title: 'Relationship Score',
      description: 'Get a precise emotional health score based on communication patterns, affection, and consistency.',
      color: 'pink',
      delay: 0.1,
    },
    {
      icon: Brain,
      title: 'AI Emotional Analysis',
      description: 'Gemini AI reads the emotional undertones in your conversations, detecting warmth, tension, and connection.',
      color: 'purple',
      delay: 0.2,
    },
    {
      icon: MessageCircle,
      title: 'Communication Insights',
      description: 'Discover who puts in more effort, who replies faster, and how balanced your communication really is.',
      color: 'cyan',
      delay: 0.3,
    },
    {
      icon: Sparkles,
      title: 'Emotional Timeline',
      description: 'See how your relationship emotions have evolved month by month — from intense to distant and back.',
      color: 'gold',
      delay: 0.4,
    },
    {
      icon: Zap,
      title: 'Instant Local Analysis',
      description: 'Lightning-fast stats computed privately in your browser. No data ever leaves your device.',
      color: 'green',
      delay: 0.5,
    },
    {
      icon: Shield,
      title: '100% Private & Secure',
      description: 'Your chats are never stored or transmitted. The AI analysis runs ephemerally and is immediately discarded.',
      color: 'purple',
      delay: 0.6,
    },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(180deg, #050510 0%, #0d0d2b 50%, #050510 100%)' }}>
      <Particles />

      {/* ── Nav ───────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6"
      >
        <BondIQLogo size={36} textSize="md" />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/analyze')}
          className="btn-primary text-sm px-5 py-2.5"
        >
          <Sparkles size={14} />
          Try Now
        </motion.button>
      </motion.nav>

      {/* ── Hero ──────────────────────────────────────────── */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-32 min-h-[85vh]"
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
          className="text-white/50 text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed mb-10"
        >
          Upload your WhatsApp, Telegram, or any chat. BondIQ uses AI to reveal relationship health, emotional patterns, and communication dynamics — all privately in your browser.
        </motion.p>

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
          <button className="btn-ghost text-sm">
            See how it works ↓
          </button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20"
        >
          <ChevronDown size={24} />
        </motion.div>
      </motion.section>

      {/* ── Platforms ─────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <p className="text-white/30 text-sm font-medium tracking-widest uppercase">Supports</p>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {['WhatsApp', 'Telegram', 'Instagram', 'Snapchat', 'Messenger', 'Plain Text'].map((platform, i) => (
              <motion.span
                key={platform}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="px-4 py-2 glass rounded-full text-sm text-white/60 border border-white/10"
              >
                {platform}
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
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </section>

      {/* ── Privacy Section ───────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto glass rounded-3xl p-8 md:p-12 text-center border border-emerald-500/10"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Shield size={28} className="text-emerald-400" />
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-3">
            Your Privacy is <span className="text-emerald-400">Sacred</span>
          </h2>
          <p className="text-white/40 text-base mb-8 max-w-lg mx-auto">
            We believe your personal conversations deserve the highest level of protection.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <PrivacyBadge icon={Shield} label="Your chats stay private" />
            <PrivacyBadge icon={Shield} label="No data is stored" />
            <PrivacyBadge icon={Shield} label="Analysis runs in-browser" />
            <PrivacyBadge icon={Shield} label="You control your data" />
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
          <p className="text-white/40 mb-8">Takes less than 30 seconds. No signup required.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/analyze')}
            className="btn-primary text-lg px-12 py-5"
          >
            <Heart size={20} fill="currentColor" />
            Start Analysis
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
