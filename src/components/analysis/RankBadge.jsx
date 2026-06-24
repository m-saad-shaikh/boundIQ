import { motion } from 'framer-motion';
import { Trophy, Star, Crown, Flame, Heart, Zap } from 'lucide-react';

export const getRankInfo = (score) => {
  if (score >= 95) return { 
    name: 'Soulmates', 
    emoji: '👑', 
    icon: Crown, 
    color: 'from-yellow-400 via-orange-500 to-yellow-600', 
    glow: 'rgba(234,179,8,0.5)',
    percent: 99
  };
  if (score >= 85) return { 
    name: 'Power Couple', 
    emoji: '🔥', 
    icon: Flame, 
    color: 'from-red-500 via-pink-500 to-orange-500', 
    glow: 'rgba(239,68,68,0.5)',
    percent: 90
  };
  if (score >= 70) return { 
    name: 'Strong Bond', 
    emoji: '💖', 
    icon: Heart, 
    color: 'from-pink-400 via-purple-500 to-indigo-500', 
    glow: 'rgba(236,72,153,0.5)',
    percent: 75
  };
  if (score >= 50) return { 
    name: 'Complicated', 
    emoji: '😅', 
    icon: Zap, 
    color: 'from-blue-400 via-cyan-500 to-teal-500', 
    glow: 'rgba(59,130,246,0.5)',
    percent: 45
  };
  return { 
    name: 'Needs Work', 
    emoji: '💀', 
    icon: Star, 
    color: 'from-gray-400 via-slate-500 to-zinc-600', 
    glow: 'rgba(156,163,175,0.5)',
    percent: 15
  };
};

export default function RankBadge({ score }) {
  const rank = getRankInfo(score);
  const Icon = rank.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      whileHover={{ 
        scale: 1.02,
        rotateY: 8,
        rotateX: -5,
        transition: { duration: 0.2 }
      }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.5 
      }}
      className="relative group perspective-1000"
    >
      {/* Background Glow */}
      <div 
        className="absolute inset-0 blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 rounded-full scale-110"
        style={{ backgroundColor: rank.glow }}
      />

      <div className="relative glass-premium rounded-[2rem] p-7 border border-white/10 overflow-hidden shadow-2xl">
        {/* Animated Gradient Background */}
        <motion.div 
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className={`absolute inset-0 opacity-10 bg-gradient-to-r ${rank.color} bg-[length:200%_200%]`}
        />

        <div className="flex items-center gap-4 relative z-10">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${rank.color} shadow-lg shadow-black/20`}>
            <Icon size={24} className="text-white drop-shadow-md" />
          </div>
          
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-white/40">Current Rank</span>
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-lg"
              >
                {rank.emoji}
              </motion.span>
            </div>
            <h3 className={`text-2xl font-black bg-gradient-to-r ${rank.color} bg-clip-text text-transparent`}>
              {rank.name}
            </h3>
            <p className="text-xs text-white/60 font-medium">
              Better than <span className="text-white font-bold">{rank.percent}%</span> of users
            </p>
          </div>
        </div>

        {/* Floating particles animation effect could be added here if desired */}
      </div>
    </motion.div>
  );
}
