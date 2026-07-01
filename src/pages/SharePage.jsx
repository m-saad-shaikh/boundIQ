/**
 * SharePage.jsx
 * Public share page: /share/:id
 * Displays username, relationship score, status, and badge.
 * Shows ZERO private chat information.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Share2, AlertTriangle, RotateCcw, ExternalLink } from 'lucide-react';
import { getShare } from '../utils/supabaseClient.js';
import { getRankInfo } from '../components/analysis/RankBadge.jsx';
import BondIQLogo from '../components/common/BondIQLogo.jsx';

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return <div className={`rounded-2xl bg-white/5 animate-pulse ${className}`} />;
}

// ── Share card ────────────────────────────────────────────────────────────────
function ShareCard({ data }) {
  const rank = getRankInfo(data.score);
  const RankIcon = rank.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      className="relative w-full max-w-sm mx-auto"
    >
      {/* Card */}
      <div
        className="rounded-3xl p-8 relative overflow-hidden border border-white/10"
        style={{ background: 'linear-gradient(135deg, #0d0d2b, #050510)' }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 30%, ${rank.glow}, transparent 70%)` }}
        />

        <div className="relative z-10 flex flex-col items-center text-center gap-6">
          {/* Brand */}
          <BondIQLogo size={28} textSize="sm" />

          {/* Rank icon */}
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className={`w-28 h-28 rounded-[2rem] bg-gradient-to-br ${rank.color} flex items-center justify-center shadow-2xl`}
          >
            <RankIcon size={56} className="text-white drop-shadow-lg" />
          </motion.div>

          {/* Name */}
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Relationship Score</p>
            <h1 className="font-display font-black text-white text-2xl">{data.username}</h1>
          </div>

          {/* Score */}
          <div
            className="font-display font-black text-7xl"
            style={{
              background: 'linear-gradient(135deg, #ff2d78, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {data.score}%
          </div>

          {/* Status */}
          <div className="px-5 py-2 rounded-full glass border border-white/10">
            <span className="text-white font-semibold text-sm">
              {data.emoji} {data.status}
            </span>
          </div>

          {/* Rank name */}
          <div className="text-white/50 text-sm">
            Rank: <span className="text-white font-semibold">{rank.name}</span>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* CTA */}
          <p className="text-white/30 text-xs">Can you beat this score?</p>
        </div>
      </div>

      {/* Timestamp */}
      {data.created_at && (
        <p className="text-white/20 text-xs text-center mt-3">
          Shared on {new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      )}
    </motion.div>
  );
}

// ── Main Share Page ────────────────────────────────────────────────────────────
export default function SharePage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [errorMsg,  setErrorMsg]  = useState('');

  useEffect(() => {
    if (!id) {
      setErrorMsg('Invalid share link.');
      setLoading(false);
      return;
    }

    getShare(id).then(result => {
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setData(result.data);
      }
      setLoading(false);
    });
  }, [id]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #050510 0%, #0d0d2b 100%)' }}
    >
      {/* Background blob */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #8b5cf6, transparent)' }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5"
        style={{ background: 'rgba(5,5,16,0.8)', backdropFilter: 'blur(20px)' }}
      >
        <BondIQLogo size={32} textSize="sm" />

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/')}
          className="btn-ghost text-xs px-4 py-2 gap-2"
        >
          <ExternalLink size={13} />
          Try for Free
        </motion.button>
      </motion.header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">

        {loading && (
          <div className="w-full max-w-sm space-y-5">
            <Skeleton className="h-10 w-40 mx-auto" />
            <Skeleton className="h-[440px] w-full" />
          </div>
        )}

        {!loading && errorMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <h2 className="font-display font-bold text-white text-xl mb-2">Share Not Found</h2>
            <p className="text-white/40 text-sm mb-8 leading-relaxed">{errorMsg}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/')}
              className="btn-primary px-8 py-3"
            >
              <RotateCcw size={14} />
              Analyze Your Chat
            </motion.button>
          </motion.div>
        )}

        {!loading && !errorMsg && data && (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/30 text-xs uppercase tracking-widest mb-8"
            >
              Challenge Score
            </motion.p>

            <ShareCard data={data} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-10 text-center"
            >
              <p className="text-white/30 text-sm mb-4">Think your relationship scores higher?</p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/')}
                className="btn-primary px-10 py-4"
              >
                <Heart size={16} />
                Analyze Your Chat
              </motion.button>
            </motion.div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8 text-center space-y-3">
        <p className="text-white/20 text-xs">
          🔒 This share contains zero private chat data. Only the score and status are public.
        </p>
        <p className="text-white/15 text-[10px]">
          Developed with ❤️ by <span className="text-white/30 font-semibold">M SAAD SHAIKH</span>
        </p>
      </footer>
    </div>
  );
}
