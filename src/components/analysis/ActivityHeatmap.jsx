/**
 * ActivityHeatmap.jsx — Hourly activity visualization
 */

import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

const HOUR_LABELS = [
  '12am','1am','2am','3am','4am','5am',
  '6am','7am','8am','9am','10am','11am',
  '12pm','1pm','2pm','3pm','4pm','5pm',
  '6pm','7pm','8pm','9pm','10pm','11pm',
];

const TIME_ZONES = [
  { label: 'Early Morning', hours: [5,6,7,8],       emoji: '🌅', color: '#f59e0b' },
  { label: 'Morning',       hours: [9,10,11],        emoji: '☀️', color: '#06b6d4' },
  { label: 'Afternoon',     hours: [12,13,14,15,16], emoji: '⛅', color: '#8b5cf6' },
  { label: 'Evening',       hours: [17,18,19,20],    emoji: '🌆', color: '#ff2d78' },
  { label: 'Night',         hours: [21,22,23],       emoji: '🌙', color: '#6366f1' },
  { label: 'Late Night',    hours: [0,1,2,3,4],      emoji: '⭐', color: '#10b981' },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 border border-white/10 text-xs">
      <p className="text-white font-medium">{payload[0]?.payload?.hour}</p>
      <p className="text-white/60">{payload[0]?.value || 0} messages</p>
    </div>
  );
};

function HeatCell({ count, max }) {
  const intensity = max > 0 ? count / max : 0;
  const alpha = Math.max(0.04, intensity * 0.9);
  const color = intensity > 0.6
    ? `rgba(255,45,120,${alpha})`
    : intensity > 0.3
      ? `rgba(139,92,246,${alpha})`
      : `rgba(6,182,212,${alpha})`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      title={`${count} messages`}
      className="aspect-square rounded-sm cursor-default transition-transform hover:scale-125"
      style={{ background: color, border: `1px solid rgba(255,255,255,${alpha * 0.3})` }}
    />
  );
}

export default function ActivityHeatmap({ activityByHour = [], participants = [] }) {
  if (!activityByHour.length || !participants.length) return null;

  const [p1, p2] = participants;

  // Radar data: group by time zone
  const radarData = TIME_ZONES.map(tz => {
    const total = tz.hours.reduce((s, h) => {
      const row = activityByHour[h] || {};
      return s + (row[p1] || 0) + (row[p2] || 0);
    }, 0);
    return { zone: tz.label, messages: total, emoji: tz.emoji };
  });

  // Heatmap: all 24 hours
  const maxVal = Math.max(...activityByHour.map(r =>
    participants.reduce((s, p) => s + (r[p] || 0), 0)
  ), 1);

  // Find most active period
  const mostActivePeriod = TIME_ZONES.reduce((best, tz) => {
    const total = tz.hours.reduce((s, h) => {
      const row = activityByHour[h] || {};
      return s + participants.reduce((ss, p) => ss + (row[p] || 0), 0);
    }, 0);
    return total > best.total ? { ...tz, total } : best;
  }, { total: 0, label: 'Evening', emoji: '🌆' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="glass rounded-3xl p-6 md:p-8"
    >
      <div className="mb-6">
        <h2 className="font-display font-bold text-xl text-white">Activity Patterns</h2>
        <p className="text-white/40 text-sm mt-1">When you connect most</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Radar Chart */}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis
                dataKey="zone"
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
              />
              <Radar
                name="Activity"
                dataKey="messages"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.2}
                dot={{ fill: '#8b5cf6', r: 3, strokeWidth: 0 }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly heatmap grid */}
        <div>
          <p className="text-white/30 text-xs mb-3 uppercase tracking-wider">Hourly Heatmap</p>
          <div className="grid grid-cols-12 gap-1">
            {activityByHour.map((row, h) => {
              const total = participants.reduce((s, p) => s + (row[p] || 0), 0);
              return (
                <HeatCell key={h} count={total} max={maxVal} />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-white/20 text-xs">
            <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
          </div>
        </div>
      </div>

      {/* Most active period */}
      <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/8 border border-purple-500/15">
        <span className="text-2xl">{mostActivePeriod.emoji}</span>
        <div>
          <p className="text-white/80 text-sm font-medium">Most Active: <span className="text-purple-300">{mostActivePeriod.label}</span></p>
          <p className="text-white/30 text-xs">This is when you connect the most</p>
        </div>
      </div>
    </motion.div>
  );
}
