import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Send, User, Users, Loader2, CheckCircle2 } from 'lucide-react';
import { saveToLeaderboard } from '../../utils/supabaseClient';
import { getRankInfo } from './RankBadge';

export default function CompetitionCard({ score, onScoreSaved }) {
  const [username, setUsername] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  const rankInfo = getRankInfo(score);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !partnerName) return;

    setIsSubmitting(true);
    setError(null);

    const { data, error: submitError } = await saveToLeaderboard({
      username,
      partner_name: partnerName,
      score,
      rank: rankInfo.name
    });

    if (submitError) {
      setError('Failed to join. Is Supabase configured?');
      setIsSubmitting(false);
    } else {
      setIsSuccess(true);
      setTimeout(() => {
        if (onScoreSaved) onScoreSaved(data[0]);
      }, 1500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass rounded-3xl p-8 relative overflow-hidden border border-white/5"
    >
      {/* Decorative background element */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Trophy size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-white">Join the Competition</h3>
            <p className="text-white/40 text-xs">Submit your score to the global leaderboard</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 size={32} className="text-green-400" />
              </motion.div>
              <h4 className="text-white font-bold text-lg mb-1">You're on the Board!</h4>
              <p className="text-white/40 text-sm">Your score has been immortalized.</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">Your Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      required
                      placeholder="Enter name"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">Partner's Name</label>
                  <div className="relative">
                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      required
                      placeholder="Enter partner name"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-xs mt-2 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                  {error}
                </p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
              >
                {isSubmitting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    Submit Score
                  </>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
