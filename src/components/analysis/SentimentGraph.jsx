/**
 * SentimentGraph.jsx — Sentiment flow bar chart from Gemini output
 */

import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 border border-white/10 text-sm">
      <p className="text-white/60 mb-2 font-medium">{label}</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-white/70 capitalize">{entry.name}:</span>
          <span className="text-white font-semibold">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
};

export default function SentimentGraph({ sentimentFlow = [] }) {
  if (!sentimentFlow.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="glass rounded-3xl p-6 md:p-8"
    >
      <div className="mb-6">
        <h2 className="font-display font-bold text-xl text-white">Sentiment Flow</h2>
        <p className="text-white/40 text-sm mt-1">Emotional tone across the relationship arc</p>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sentimentFlow}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            barCategoryGap="30%"
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="positive" name="Positive" fill="#ff2d78" radius={[4, 4, 0, 0]}
                 style={{ filter: 'drop-shadow(0 0 4px rgba(255,45,120,0.5))' }} />
            <Bar dataKey="neutral"  name="Neutral"  fill="#8b5cf6" radius={[4, 4, 0, 0]}
                 style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.4))' }} />
            <Bar dataKey="negative" name="Negative" fill="#06b6d4" radius={[4, 4, 0, 0]}
                 style={{ filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.4))' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 justify-center">
        {[
          { label: 'Positive', color: '#ff2d78' },
          { label: 'Neutral',  color: '#8b5cf6' },
          { label: 'Negative', color: '#06b6d4' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-white/40">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
