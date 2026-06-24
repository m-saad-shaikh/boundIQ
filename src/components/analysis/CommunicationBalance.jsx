/**
 * CommunicationBalance.jsx — Who texts more, who replies faster
 */

import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { MessageSquare, Clock, BookOpen, Zap } from 'lucide-react';

const COLORS = ['#ff2d78', '#8b5cf6'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 border border-white/10 text-sm">
      <p className="text-white font-semibold">{payload[0].name}</p>
      <p className="text-white/60">{payload[0].value}% of messages</p>
    </div>
  );
};

function BalanceBar({ label, p1, p1Val, p2, p2Val, icon: Icon, unit = '' }) {
  const total = p1Val + p2Val || 1;
  const p1Pct = Math.round((p1Val / total) * 100);
  const p2Pct = 100 - p1Pct;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-white/40">
        <div className="flex items-center gap-1.5">
          <Icon size={12} />
          <span>{label}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-pink-400 w-8 text-right font-medium">{p1Pct}%</span>
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden flex">
          <motion.div
            initial={{ width: '50%' }}
            whileInView={{ width: `${p1Pct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #ff2d78, #ff6b9d)' }}
          />
          <motion.div
            initial={{ width: '50%' }}
            whileInView={{ width: `${p2Pct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #8b5cf6)' }}
          />
        </div>
        <span className="text-xs text-purple-400 w-8 font-medium">{p2Pct}%</span>
      </div>
      <div className="flex justify-between text-xs text-white/25">
        <span>{p1}: {p1Val}{unit}</span>
        <span>{p2}: {p2Val}{unit}</span>
      </div>
    </div>
  );
}

export default function CommunicationBalance({ localStats }) {
  if (!localStats) return null;

  const { participants: [p1, p2], stats, avgReplyDelay, whoTextsFirst, whoRepliesFast } = localStats;

  const msgData = [
    { name: p1, value: stats[p1].messageCount },
    { name: p2, value: stats[p2].messageCount },
  ];

  const totalMsg = stats[p1].messageCount + stats[p2].messageCount || 1;
  const p1Pct    = Math.round((stats[p1].messageCount / totalMsg) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="glass rounded-3xl p-6 md:p-8"
    >
      <div className="mb-6">
        <h2 className="font-display font-bold text-xl text-white">Communication Balance</h2>
        <p className="text-white/40 text-sm mt-1">Who puts in more effort?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Pie chart */}
        <div className="flex flex-col items-center">
          <div className="h-48 w-full max-w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={msgData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {msgData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i]}
                      style={{ filter: `drop-shadow(0 0 6px ${COLORS[i]}60)` }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-2">
            {msgData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-white/50">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* Balance bars */}
        <div className="flex flex-col gap-5">
          <BalanceBar
            label="Messages Sent" icon={MessageSquare}
            p1={p1} p1Val={stats[p1].messageCount}
            p2={p2} p2Val={stats[p2].messageCount}
          />
          <BalanceBar
            label="Words Written" icon={BookOpen}
            p1={p1} p1Val={stats[p1].wordCount}
            p2={p2} p2Val={stats[p2].wordCount}
          />
          <BalanceBar
            label="Emojis Used" icon={Zap}
            p1={p1} p1Val={stats[p1].emojiCount}
            p2={p2} p2Val={stats[p2].emojiCount}
          />
        </div>
      </div>

      {/* Insights row */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="glass rounded-xl p-4 border border-pink-500/10">
          <p className="text-pink-400 text-xs font-medium mb-1">Initiates More</p>
          <p className="text-white font-display font-bold text-base truncate">{whoTextsFirst}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-purple-500/10">
          <p className="text-purple-400 text-xs font-medium mb-1">Replies Faster</p>
          <p className="text-white font-display font-bold text-base truncate">{whoRepliesFast}</p>
        </div>
      </div>
    </motion.div>
  );
}
