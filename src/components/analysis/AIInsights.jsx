/**
 * AIInsights.jsx — Gemini-generated emotional profile and key moments
 */

import { motion } from 'framer-motion';
import { Brain, Sparkles, Heart, MessageCircle, Users, Layers } from 'lucide-react';
import NeonBadge from '../ui/NeonBadge.jsx';

function ProfileTag({ label, value, color }) {
  const colorMap = {
    high:              { badge: 'green',  text: 'High' },
    medium:            { badge: 'gold',   text: 'Medium' },
    low:               { badge: 'gray',   text: 'Low' },
    positive:          { badge: 'green',  text: 'Positive' },
    negative:          { badge: 'pink',   text: 'Negative' },
    neutral:           { badge: 'gray',   text: 'Neutral' },
    mixed:             { badge: 'gold',   text: 'Mixed' },
    aligned:           { badge: 'green',  text: 'Aligned' },
    'somewhat aligned':{ badge: 'gold',   text: 'Somewhat' },
    misaligned:        { badge: 'pink',   text: 'Misaligned' },
    balanced:          { badge: 'green',  text: 'Balanced' },
    'one-sided':       { badge: 'pink',   text: 'One-sided' },
    growing:           { badge: 'cyan',   text: 'Growing' },
    deep:              { badge: 'purple', text: 'Deep' },
    moderate:          { badge: 'gold',   text: 'Moderate' },
    'surface-level':   { badge: 'gray',   text: 'Surface' },
  };

  const cfg = colorMap[value?.toLowerCase()] || { badge: 'gray', text: value };
  return (
    <div className="flex flex-col gap-1">
      <p className="text-white/30 text-xs uppercase tracking-wider">{label}</p>
      <NeonBadge color={cfg.badge}>{cfg.text}</NeonBadge>
    </div>
  );
}

export default function AIInsights({ aiResult, localStats }) {
  if (!aiResult) return null;

  const { emotionalProfile, communicationInsights, keyMoments, compatibilityFactors, aiStory } = aiResult;
  const [p1, p2] = localStats?.participants || ['Person 1', 'Person 2'];

  return (
    <div className="flex flex-col gap-6">
      {/* ── AI Story ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass rounded-3xl p-6 md:p-8 relative overflow-hidden"
        style={{ border: '1px solid rgba(255,45,120,0.15)' }}
      >
        {/* Decorative gradient */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
             style={{ background: 'radial-gradient(circle, #ff2d78, transparent)' }} />

        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <Heart size={18} className="text-pink-400" fill="currentColor" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-white">Your Relationship Story</h2>
            <p className="text-white/30 text-xs">AI-generated emotional narrative</p>
          </div>
          <NeonBadge color="pink" className="ml-auto">
            <Sparkles size={10} />
            AI Generated
          </NeonBadge>
        </div>

        <p className="text-white/70 leading-relaxed text-sm md:text-base relative z-10 font-light italic">
          "{aiStory}"
        </p>
      </motion.div>

      {/* ── Emotional Profile ──────────────────────────────── */}
      {emotionalProfile && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Brain size={18} className="text-purple-400" />
            </div>
            <h2 className="font-display font-bold text-lg text-white">Emotional Profile</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-6">
            <ProfileTag label="Overall Tone"    value={emotionalProfile.overall} />
            <ProfileTag label="Affection Level" value={emotionalProfile.affectionLevel} />
            <ProfileTag label="Conflict Level"  value={emotionalProfile.conflictLevel} />
            <ProfileTag label="Support Level"   value={emotionalProfile.supportLevel} />
            <ProfileTag label="Comm. Style"     value={compatibilityFactors?.communicationStyle} />
            <ProfileTag label="Conversation Depth" value={compatibilityFactors?.conversationDepth} />
          </div>

          {/* Per-person tones */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: p1, tone: emotionalProfile.p1Tone, color: 'border-pink-500/15 bg-pink-500/5' },
              { name: p2, tone: emotionalProfile.p2Tone, color: 'border-purple-500/15 bg-purple-500/5' },
            ].map(({ name, tone, color }) => (
              <div key={name} className={`rounded-xl p-4 border ${color}`}>
                <p className="text-white/40 text-xs mb-1 truncate">{name}'s tone</p>
                <p className="text-white text-sm font-medium capitalize">{tone}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Communication Insights ─────────────────────────── */}
      {communicationInsights?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="glass rounded-3xl p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <MessageCircle size={18} className="text-cyan-400" />
            </div>
            <h2 className="font-display font-bold text-lg text-white">Communication Insights</h2>
          </div>

          <div className="flex flex-col gap-3">
            {communicationInsights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-cyan-400 text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{insight}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Key Moments ────────────────────────────────────── */}
      {keyMoments?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Sparkles size={18} className="text-amber-400" />
            </div>
            <h2 className="font-display font-bold text-lg text-white">Key Moments Detected</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {keyMoments.map((moment, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10"
              >
                <span className="text-amber-400 text-sm mt-0.5">✦</span>
                <p className="text-white/65 text-sm leading-relaxed">{moment}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
