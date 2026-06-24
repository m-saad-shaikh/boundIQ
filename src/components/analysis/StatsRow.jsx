/**
 * StatsRow.jsx
 * Key statistics in animated counter cards.
 * Task 7: Shows new metrics — consistency, dry texting, mutual engagement,
 *          emoji usage, initiation frequency, avg response delay, late night score.
 * Task 9: Improved layout, animated counters, mobile responsiveness.
 */

import { motion } from 'framer-motion';
import {
  MessageSquare, BookOpen, SmilePlus, Clock, Zap, Moon,
  BarChart2, Activity, Heart, TrendingUp, Repeat, Users,
} from 'lucide-react';
import AnimatedCounter from '../ui/AnimatedCounter.jsx';

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, suffix = '', prefix = '', color, delay, subLabel }) {
  const colorMap = {
    pink:   'text-pink-400 bg-pink-500/10 border-pink-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    cyan:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    gold:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
    green:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    rose:   'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };
  const c = colorMap[color] || colorMap.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="glass rounded-2xl p-5 flex flex-col gap-3 group cursor-default"
    >
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${c} transition-transform group-hover:scale-110 duration-200`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="font-display font-bold text-xl md:text-2xl text-white leading-none">
          {prefix}<AnimatedCounter value={typeof value === 'number' ? value : 0} suffix={suffix} />
        </p>
        <p className="text-white/40 text-xs mt-1 leading-tight">{label}</p>
        {subLabel && <p className="text-white/20 text-[10px] mt-0.5 leading-tight">{subLabel}</p>}
      </div>
    </motion.div>
  );
}

// ── Text Stat Card (for non-numeric values like names) ────────────────────────
function TextStatCard({ icon: Icon, label, value, color, delay }) {
  const colorMap = {
    green:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    pink:   'text-pink-400 bg-pink-500/10 border-pink-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    cyan:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    gold:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
  const c = colorMap[color] || colorMap.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="glass rounded-2xl p-5 flex flex-col gap-3 group cursor-default"
    >
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${c} transition-transform group-hover:scale-110 duration-200`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="font-display font-bold text-sm md:text-base text-white truncate leading-snug">{value}</p>
        <p className="text-white/40 text-xs mt-1 leading-tight">{label}</p>
      </div>
    </motion.div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, delay }) {
  return (
    <motion.h3
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="font-display font-bold text-base text-white/60 uppercase tracking-widest mt-8 mb-4 first:mt-0"
    >
      {title}
    </motion.h3>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function StatsRow({ localStats }) {
  if (!localStats) return null;

  const {
    participants: [p1, p2],
    totalMessages,
    totalWords,
    totalEmojis,
    avgReplyDelay,
    whoTextsFirst,
    whoRepliesFast,
    lateNightRatio,
    lateNightScore,
    consistencyScore,
    conversationConsistencyScore,
    mutualEngagementScore,
    dryTextingScore,
    initiationFrequency,
    emojiUsageStats,
  } = localStats;

  // Best average reply delay (fastest replier's speed)
  const d1 = parseFloat(avgReplyDelay?.[p1] ?? 0);
  const d2 = parseFloat(avgReplyDelay?.[p2] ?? 0);
  const bestReplyDelay = Math.min(d1 > 0 ? d1 : Infinity, d2 > 0 ? d2 : Infinity);
  const displayDelay = isFinite(bestReplyDelay) ? Math.round(bestReplyDelay) : 0;

  // Top emoji
  const topEmoji = emojiUsageStats?.topEmojis?.[0]?.emoji || '—';

  return (
    <div>
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="font-display font-bold text-xl text-white mb-6"
      >
        Chat Statistics
      </motion.h2>

      {/* ── Primary Stats ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-3">
        <StatCard icon={MessageSquare} label="Total Messages"  value={totalMessages}           color="pink"   delay={0.00} />
        <StatCard icon={BookOpen}       label="Total Words"     value={totalWords}               color="purple" delay={0.05} />
        <StatCard icon={SmilePlus}      label="Emojis Used"     value={totalEmojis}              color="cyan"   delay={0.10} />
        <StatCard icon={Clock}          label="Fastest Reply"   value={displayDelay} suffix=" min" color="gold"   delay={0.15} subLabel="minutes average" />
        <StatCard icon={Moon}           label="Late Night Chats" value={Math.round(lateNightRatio * 100)} suffix="%" color="blue" delay={0.20} />
        <TextStatCard icon={Zap}        label="Fastest Replier"  value={whoRepliesFast}          color="green"  delay={0.25} />
      </div>

      {/* ── Quality Metrics (Task 7) ───────────────────────── */}
      <SectionHeader title="Relationship Quality Metrics" delay={0.3} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
        <StatCard
          icon={BarChart2}
          label="Consistency Score"
          value={conversationConsistencyScore ?? Math.round(consistencyScore * 10)}
          suffix="%"
          color="purple"
          delay={0.32}
          subLabel="chat regularity"
        />
        <StatCard
          icon={Users}
          label="Mutual Engagement"
          value={mutualEngagementScore ?? 50}
          suffix="%"
          color="cyan"
          delay={0.35}
          subLabel="participation balance"
        />
        <StatCard
          icon={Activity}
          label="Dry Texting Score"
          value={dryTextingScore ? Math.round((dryTextingScore[p1] + dryTextingScore[p2]) / 2) : 50}
          suffix="%"
          color="gold"
          delay={0.38}
          subLabel="message richness"
        />
        <StatCard
          icon={Moon}
          label="Late Night Score"
          value={lateNightScore ?? 0}
          suffix="%"
          color="blue"
          delay={0.41}
          subLabel="night-time closeness"
        />
      </div>

      {/* ── Per-Person Stats ───────────────────────────────── */}
      <SectionHeader title="Per-Person Breakdown" delay={0.45} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <TextStatCard icon={TrendingUp} label="Starts Conversations" value={`${whoTextsFirst} (${initiationFrequency?.[whoTextsFirst] ?? '—'}%)`} color="pink" delay={0.47} />
        <StatCard icon={Clock}  label={`${p1} Avg Reply`}   value={avgReplyDelay?.[p1] ?? 0}  suffix=" min" color="purple" delay={0.50} />
        <StatCard icon={Clock}  label={`${p2} Avg Reply`}   value={avgReplyDelay?.[p2] ?? 0}  suffix=" min" color="cyan"   delay={0.53} />
        <StatCard icon={Repeat} label={`${p1} Dry Msgs`}    value={dryTextingScore?.[p1] ?? 50} suffix="% rich" color="gold"  delay={0.56} />
        <StatCard icon={Repeat} label={`${p2} Dry Msgs`}    value={dryTextingScore?.[p2] ?? 50} suffix="% rich" color="green" delay={0.59} />
        {topEmoji !== '—' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.62 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="glass rounded-2xl p-5 flex flex-col gap-3"
          >
            <div className="text-3xl leading-none">{topEmoji}</div>
            <div>
              <p className="font-display font-bold text-white text-sm">Most Used Emoji</p>
              <p className="text-white/40 text-xs mt-1">
                {emojiUsageStats?.topEmojis?.[0]?.count || 0}× used
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
