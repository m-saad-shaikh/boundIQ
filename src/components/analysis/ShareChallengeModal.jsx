/**
 * ShareChallengeModal.jsx
 * Persistent share system with Supabase Auth login gate.
 * Creates real /share/:id links stored in Supabase.
 * Requires Google Sign-In via Supabase Auth before generating a share.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Share2, Download, MessageCircle, Check, Heart, LogIn, ExternalLink, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { getRankInfo } from './RankBadge.jsx';
import { createShare } from '../../utils/supabaseClient.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import LoginModal from '../common/LoginModal.jsx';

export default function ShareChallengeModal({ isOpen, onClose, score, participants, status, emoji }) {
  const { user } = useAuth();
  const [copied,       setCopied]       = useState(false);
  const [isDownloading,setIsDownloading]= useState(false);
  const [isCreating,   setIsCreating]   = useState(false);
  const [shareUrl,     setShareUrl]     = useState('');
  const [shareError,   setShareError]   = useState('');
  const [showLogin,    setShowLogin]    = useState(false);
  const cardRef = useRef(null);

  const rank = getRankInfo(score);
  const [p1, p2] = participants || ['Person 1', 'Partner'];

  // ── Generate share link via Supabase ─────────────────────
  const generateShareLink = async (currentUser) => {
    const u = currentUser || user;
    if (!u) {
      // Not signed in — show login modal
      setShowLogin(true);
      return;
    }

    setIsCreating(true);
    setShareError('');

    const username = `${p1} & ${p2}`;
    const result = await createShare({
      username,
      score,
      status:  status || 'Growing Bond',
      emoji:   emoji  || '❤️',
      // Pass user_id so RLS ownership policies work correctly
      userId:  u.uid || u.id || null,
    });

    setIsCreating(false);

    if (result.error) {
      setShareError(result.error);
    } else {
      setShareUrl(result.shareUrl);
    }
  };

  // ── Called after successful Google Sign-In ────────────────
  const handleLoginSuccess = (u) => {
    setShowLogin(false);
    generateShareLink(u);
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#050510',
        scale: 2,
        useCORS: true,
      });

      const filename = `BondIQ-Challenge-${p1}-${p2}.png`;

      // Capacitor / mobile: use Web Share API with blob (works in WebView)
      canvas.toBlob(async (blob) => {
        if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: 'image/png' })] })) {
          try {
            await navigator.share({
              files: [new File([blob], filename, { type: 'image/png' })],
              title: 'BondIQ Challenge',
              text: `Our relationship scored ${score}%!`,
            });
          } catch (shareErr) {
            // User cancelled share — not an error
            console.log('[BondIQ] Share cancelled:', shareErr);
          }
        } else {
          // Web browser fallback: anchor download
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = filename;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');

    } catch (err) {
      console.error('[BondIQ] Failed to generate image:', err);
    }
    setIsDownloading(false);
  };

  const handleWhatsAppShare = () => {
    // Always use production URL — never localhost
    const appBase = import.meta.env.VITE_APP_URL?.replace(/\/$/, '') || window.location.origin;
    const url = shareUrl || `${appBase}`;
    const text = `Our relationship scored ${score}% (${rank.name}) on BondIQ! 🔥 Check it out: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#050510] rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(139,92,246,0.15)] overflow-hidden my-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#050510]/90 backdrop-blur-md z-20">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <Share2 size={18} className="text-purple-400" />
                  Share Challenge
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">
                {/* Share Card Preview */}
                <div
                  ref={cardRef}
                  className="aspect-[4/5] w-full max-w-[300px] mx-auto rounded-[2rem] p-8 relative overflow-hidden shadow-2xl border border-white/10 bg-[#050510]"
                >
                  <div
                    className="absolute top-0 left-0 w-full h-full opacity-30 blur-3xl pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${rank.glow}, transparent)` }}
                  />

                  <div className="relative z-10 h-full flex flex-col justify-between items-center text-center">
                    {/* Header */}
                    <div className="flex items-center gap-2 pt-2">
                      <div className="w-5 h-5 rounded bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Heart size={10} className="text-white" fill="white" />
                      </div>
                      <span className="text-[9px] font-bold tracking-[0.2em] text-white uppercase opacity-40">BondIQ</span>
                    </div>

                    {/* Middle Info */}
                    <div className="my-auto py-4">
                      <motion.div
                        animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className={`w-20 h-20 rounded-[1.5rem] mx-auto bg-gradient-to-br ${rank.color} flex items-center justify-center shadow-2xl mb-4`}
                      >
                        {(() => { const Icon = rank.icon; return <Icon size={38} className="text-white drop-shadow-lg" />; })()}
                      </motion.div>
                      <h4 className="text-white font-black text-xl mb-1">{rank.name}</h4>
                      
                      <div className="font-black text-5xl mb-2 text-[#ff2d78] drop-shadow-[0_0_15px_rgba(255,45,120,0.35)]">
                        {score}%
                      </div>
                      
                      <p className="text-white/40 text-xs px-2">
                        {p1} &amp; {p2}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="w-full pb-2">
                      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full mb-3" />
                      <p className="text-[9px] font-bold text-white uppercase tracking-widest opacity-30">
                        bondiq.app
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 space-y-5">
                  {/* Download + WhatsApp */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownloadPNG}
                      disabled={isDownloading}
                      className="flex-1 btn-primary py-3.5 rounded-2xl text-sm gap-2"
                    >
                      {isDownloading
                        ? <Loader2 size={16} className="animate-spin" />
                        : <Download size={16} />}
                      Download PNG
                    </button>
                    <button
                      onClick={handleWhatsAppShare}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all text-sm"
                    >
                      <MessageCircle size={16} />
                      WhatsApp
                    </button>
                  </div>

                  {/* Share link section */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest text-center">
                      Persistent Share Link
                    </p>

                    {shareError && (
                      <p className="text-red-400 text-xs text-center px-2">{shareError}</p>
                    )}

                    {shareUrl ? (
                      /* Link ready — show copy field */
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={shareUrl}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-xs text-white/50 font-mono text-ellipsis overflow-hidden"
                        />
                        <button
                          onClick={handleCopyLink}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
                        >
                          {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        </button>
                      </div>
                    ) : (
                      /* Generate button (requires login) */
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => generateShareLink(null)}
                        disabled={isCreating}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all border border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                      >
                        {isCreating ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : user ? (
                          <>
                            <ExternalLink size={15} />
                            Generate Share Link
                          </>
                        ) : (
                          <>
                            <LogIn size={15} />
                            Sign In to Generate Link
                          </>
                        )}
                      </motion.button>
                    )}

                    {!user && (
                      <p className="text-white/20 text-xs text-center">
                        A free Google account is required to create share links
                      </p>
                    )}
                    {user && (
                      <p className="text-white/20 text-xs text-center">
                        Signed in as {user.displayName || user.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login modal (shown when unauthenticated user clicks generate) */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
        title="Sign In to Share"
        subtitle="Create a persistent link others can view — no private chat data is ever shared."
      />
    </>
  );
}
