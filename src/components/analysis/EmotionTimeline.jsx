/**
 * EmotionTimeline.jsx — Month-by-month emotional area chart
 */

import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 border border-white/10 text-sm">
      <p className="text-white/60 mb-2 font-medium">{label}</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-white/80 capitalize">{entry.name}:</span>
          <span className="text-white font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// Map month labels to emoji labels for the legend
const EMOTION_LABELS = {
  warm: 'Warm 🌟', cold: 'Cold ❄️', neutral: 'Neutral 😐',
};

export default function EmotionTimeline({ emotionTimeline = [] }) {
  if (!emotionTimeline.length) return null;

  // Build chart data from timeline
  const data = emotionTimeline.map(t => ({
    month:       t.month,
    'Positive':  t.positive,
    'Affection': t.affectionate,
    'Negative':  t.negative,
    label:       t.label,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="glass rounded-3xl p-6 md:p-8"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-display font-bold text-xl text-white">Emotion Timeline</h2>
          <p className="text-white/40 text-sm mt-1">How emotions evolved month by month</p>
        </div>
        {/* Legend */}
        <div className="flex flex-col gap-1 text-right">
          <div className="flex items-center justify-end gap-1.5 text-xs text-white/40">
            <span>Positive</span><div className="w-2 h-2 rounded-full bg-pink-400" />
          </div>
          <div className="flex items-center justify-end gap-1.5 text-xs text-white/40">
            <span>Affection</span><div className="w-2 h-2 rounded-full bg-purple-400" />
          </div>
          <div className="flex items-center justify-end gap-1.5 text-xs text-white/40">
            <span>Negative</span><div className="w-2 h-2 rounded-full bg-red-400" />
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ff2d78" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ff2d78" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="affGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="Positive"
              stroke="#ff2d78"
              strokeWidth={2}
              fill="url(#posGrad)"
              dot={{ fill: '#ff2d78', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#ff2d78' }}
            />
            <Area
              type="monotone"
              dataKey="Affection"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#affGrad)"
              dot={{ fill: '#8b5cf6', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#8b5cf6' }}
            />
            <Area
              type="monotone"
              dataKey="Negative"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#negGrad)"
              dot={{ fill: '#ef4444', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#ef4444' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Month labels row */}
      {emotionTimeline.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {emotionTimeline.map((t, i) => (
            <motion.span
              key={t.month}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`text-xs px-3 py-1 rounded-full glass border ${
                t.sentiment === 'warm'
                  ? 'border-pink-500/20 text-pink-300'
                  : t.sentiment === 'cold'
                    ? 'border-cyan-500/20 text-cyan-300'
                    : 'border-white/10 text-white/40'
              }`}
            >
              {t.month} · {t.label}
            </motion.span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
