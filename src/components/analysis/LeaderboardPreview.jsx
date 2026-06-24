import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Calendar, Heart, Medal, Sparkles } from 'lucide-react';
import { getLeaderboard, subscribeToLeaderboard } from '../../utils/supabaseClient';

const SkeletonItem = () => (
  <div className="glass flex items-center justify-between p-4 rounded-2xl border border-white/5 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-white/5" />
      <div className="space-y-2">
        <div className="h-4 w-32 bg-white/10 rounded" />
        <div className="h-3 w-20 bg-white/5 rounded" />
      </div>
    </div>
    <div className="h-8 w-12 bg-white/10 rounded" />
  </div>
);

export default function LeaderboardPreview({ refreshKey }) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('top');

  const loadLeaderboard = async () => {
    setIsLoading(true);
    const data = await getLeaderboard();
    setEntries(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadLeaderboard();

    // Subscribe to realtime changes
    const subscription = subscribeToLeaderboard((payload) => {
      // Refresh on any change (insert/update/delete)
      loadLeaderboard();
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5 w-fit mx-auto sm:mx-0">
        {[
          { id: 'top', label: 'Top Scores', icon: Trophy },
          { id: 'trending', label: 'Trending', icon: TrendingUp },
          { id: 'weekly', label: 'Weekly', icon: Calendar },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white/10 text-white shadow-lg' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {[1, 2, 3, 4, 5].map(i => <SkeletonItem key={i} />)}
            </motion.div>
          ) : entries.length > 0 ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-premium flex items-center justify-between p-4 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all group relative overflow-hidden"
                >
                  {/* Top 3 celebratory glow */}
                  {index === 0 && (
                    <div className="absolute inset-0 bg-yellow-400/5 pointer-events-none" />
                  )}

                  <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-xl ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black' :
                        index === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-black' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-black' :
                        'bg-white/5 text-white/40 border border-white/5'
                      }`}>
                        {index + 1}
                      </div>
                      {index < 3 && (
                        <motion.div
                          animate={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -top-1 -right-1"
                        >
                          <Medal size={14} className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                        </motion.div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-bold text-sm group-hover:text-purple-300 transition-colors">
                          {entry.username} & {entry.partner_name}
                        </h4>
                        {index === 0 && <Sparkles size={12} className="text-yellow-400 animate-pulse" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/40 font-bold uppercase tracking-wider">
                          {entry.rank}
                        </span>
                        <span className="text-[10px] text-white/20">•</span>
                        <span className="text-[10px] text-white/20">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right relative z-10">
                    <div className="text-xl font-black text-gradient-pink-purple">
                      {entry.score}<span className="text-[10px] ml-0.5">%</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-white/30">
                      <Heart size={8} fill="currentColor" />
                      Bond Level
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-16 glass rounded-[2.5rem] border border-dashed border-white/10 text-center flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <Trophy size={32} className="text-white/10" />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">No Champions Yet</h4>
                <p className="text-white/20 text-xs px-8">Be the first to immortalize your bond on the global stage!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
