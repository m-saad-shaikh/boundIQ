/**
 * ResultsPage.jsx — Full analysis results dashboard
 *
 * Task 1: AI sections (AIInsights, Recommendations, AI Story) are conditionally
 *          shown based on analysis.aiUsed === true. Fallback card shown when AI
 *          was not used (no API key / quota exceeded).
 * Task 2: ShareChallengeModal now receives status + emoji props for share record.
 * Task 9: Better skeletons, animated counters, mobile improvements.
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, RotateCcw, Share2, ArrowLeft, Sparkles, Trophy,
  Key, Brain, Lightbulb, BookOpen,
} from 'lucide-react';
import ExportButton from '../components/common/ExportButton.jsx';
import BondIQLogo from '../components/common/BondIQLogo.jsx';

import RelationshipScore    from '../components/analysis/RelationshipScore.jsx';
import RelationshipStatus   from '../components/analysis/RelationshipStatus.jsx';
import StatsRow             from '../components/analysis/StatsRow.jsx';
import EmotionTimeline      from '../components/analysis/EmotionTimeline.jsx';
import SentimentGraph       from '../components/analysis/SentimentGraph.jsx';
import CommunicationBalance from '../components/analysis/CommunicationBalance.jsx';
import ActivityHeatmap      from '../components/analysis/ActivityHeatmap.jsx';
import RankBadge            from '../components/analysis/RankBadge.jsx';
import CompetitionCard      from '../components/analysis/CompetitionCard.jsx';
import ShareChallengeModal  from '../components/analysis/ShareChallengeModal.jsx';
import Toast                from '../components/common/Toast.jsx';
import ErrorBoundary        from '../components/common/ErrorBoundary.jsx';

const AIInsights        = lazy(() => import('../components/analysis/AIInsights.jsx'));
const Recommendations   = lazy(() => import('../components/analysis/Recommendations.jsx'));
const AIChatCoach       = lazy(() => import('../components/analysis/AIChatCoach.jsx'));
const LeaderboardPreview= lazy(() => import('../components/analysis/LeaderboardPreview.jsx'));

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/5 ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.03) 50%, transparent 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s linear infinite',
        }}
      />
    </div>
  );
}

// ── AI Not Enabled Fallback Card ──────────────────────────────────────────────
function AIDisabledCard({ section }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-8 border border-amber-500/15 flex flex-col items-center text-center gap-4"
      style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.04), rgba(139,92,246,0.03))' }}
    >
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        {section === 'insights' && <Brain size={20} className="text-amber-400" />}
        {section === 'recommendations' && <Lightbulb size={20} className="text-amber-400" />}
        {section === 'story' && <BookOpen size={20} className="text-amber-400" />}
        {!section && <Sparkles size={20} className="text-amber-400" />}
      </div>
      <div>
        <h3 className="font-display font-bold text-white text-base mb-1.5">AI Analysis Not Enabled</h3>
        <p className="text-white/40 text-sm leading-relaxed max-w-sm">
          Configure an AI Provider and API key on the upload page to unlock advanced emotional insights, recommendations, and your relationship story.
        </p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
        <Key size={13} className="text-amber-400 flex-shrink-0" />
        <span className="text-amber-300/70 text-xs">You can configure free providers like Gemini or Groq to analyze.</span>
      </div>
    </motion.div>
  );
}

// ── Ambient background ────────────────────────────────────────────────────────
function AmbientBg({ score }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#8b5cf6' : '#06b6d4';
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] opacity-8 blur-3xl"
           style={{ background: `radial-gradient(ellipse, ${color}, transparent)` }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] opacity-6 blur-3xl"
           style={{ background: 'radial-gradient(ellipse, #ff2d78, transparent)' }} />
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay }}>
      {children}
    </motion.div>
  );
}

// ── Main ResultsPage ──────────────────────────────────────────────────────────
export default function ResultsPage({ analysis, apiKey, provider }) {
  const navigate = useNavigate();
  const [isShareModalOpen,   setIsShareModalOpen]   = useState(false);
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const { localStats, aiResult, aiUsed } = analysis;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 5000);
  };

  useEffect(() => {
    document.title = 'Relationship Report — BondIQ';
  }, []);

  // Guard: redirect if no data
  if (!localStats || !aiResult) {
    navigate('/analyze');
    return null;
  }

  const score  = aiResult.relationshipScore  || 70;
  const status = aiResult.relationshipStatus || 'Growing Bond';
  const emoji  = aiResult.relationshipStatusEmoji || '❤️';
  const [p1, p2] = localStats.participants;

  return (
    <div
      className="min-h-screen relative"
      style={{ background: 'linear-gradient(180deg, #050510 0%, #0d0d2b 60%, #050510 100%)' }}
    >
      <AmbientBg score={score} />

      {/* shimmer keyframes */}
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>

      {/* ── Header ─────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 border-b border-white/5 sticky top-0 no-print"
        style={{ background: 'rgba(5,5,16,0.85)', backdropFilter: 'blur(20px)' }}
      >
        <button
          onClick={() => { analysis.reset(); navigate('/analyze'); }}
          className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> New Analysis
        </button>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <BondIQLogo size={32} textSize="sm" />
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-white/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Developed by <strong className="text-white font-semibold">M Saad Shaikh</strong></span>
          </div>
        </div>

        <div className="flex gap-2">
          <ExportButton targetId="report" filename={`BondIQ-Report-${p1}-${p2}.pdf`} />
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="btn-ghost text-xs px-4 py-2 gap-2 h-10"
          >
            <Share2 size={14} />
            <span className="hidden sm:inline uppercase font-bold tracking-wider">Share</span>
          </button>
          <button
            onClick={() => { analysis.reset(); navigate('/analyze'); }}
            className="btn-ghost text-xs px-4 py-2 gap-2 h-10"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline uppercase font-bold tracking-wider">Reset</span>
          </button>
        </div>
      </motion.header>

      {/* ── Main Content ────────────────────────────────────── */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-10 pb-24">
        <div id="report" className="p-2 md:p-6 rounded-3xl overflow-hidden">

          {/* Page title */}
          <Section delay={0.05}>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 text-xs text-white/50 mb-4">
                <Sparkles size={11} className="text-purple-400" />
                Analysis complete for {p1} &amp; {p2}
              </div>
              <h1 className="font-display font-black text-3xl md:text-5xl text-white">
                Your <span className="text-gradient-pink-purple">Relationship</span> Report
              </h1>
            </div>

            {/* Status banners */}
            {aiResult._quotaExceeded && (
              <div className="mb-6 flex items-start gap-3 px-5 py-4 rounded-2xl bg-amber-500/8 border border-amber-500/20 text-amber-300 text-sm max-w-2xl mx-auto no-print">
                <span className="text-xl flex-shrink-0">⚡</span>
                <div>
                  <p className="font-semibold mb-0.5">AI Quota Exceeded</p>
                  <p className="text-amber-400/60 text-xs leading-relaxed">
                    Your free-tier quota for the selected AI provider is exhausted for today. AI features are disabled — local analysis is shown below.
                    Try another provider or key on the upload page.
                  </p>
                </div>
              </div>
            )}

            {!aiUsed && !aiResult._quotaExceeded && (
              <div className="mb-6 flex items-start gap-3 px-5 py-4 rounded-2xl bg-purple-500/8 border border-purple-500/20 text-purple-300 text-sm max-w-2xl mx-auto no-print">
                <span className="text-xl flex-shrink-0">🔬</span>
                <div>
                  <p className="font-semibold mb-0.5">Local Analysis Mode</p>
                  <p className="text-purple-400/60 text-xs leading-relaxed">
                    Running on local statistical analysis. Add an AI API key on the upload page for full AI emotional insights.
                  </p>
                </div>
              </div>
            )}
          </Section>

          {/* Score + Status + Challenge */}
          <ErrorBoundary>
            <Section delay={0.1}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                <RelationshipScore score={score} />
                <div className="flex flex-col gap-5">
                  <RelationshipStatus status={status} emoji={emoji} />
                  <RankBadge score={score} />
                </div>
                <div className="glass rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center border border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Trophy size={48} className="text-yellow-400 mb-6 animate-bounce" />
                  <h3 className="text-2xl font-display font-black text-white mb-2">Can You Beat This?</h3>
                  <p className="text-white/40 text-xs mb-8 px-4 leading-relaxed">
                    Challenge your friends and see where your bond ranks globally!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setIsShareModalOpen(true)}
                    className="btn-primary w-full py-4 text-xs shadow-2xl shadow-purple-500/20"
                  >
                    <Share2 size={16} /> Challenge Others
                  </motion.button>
                </div>
              </div>
            </Section>
          </ErrorBoundary>

          {/* Stats Row */}
          <Section delay={0.2}>
            <div className="mb-8">
              <StatsRow localStats={localStats} aiResult={aiResult} />
            </div>
          </Section>

          {/* Emotion Timeline */}
          {localStats.emotionTimeline?.length > 0 && (
            <Section delay={0.25}>
              <div className="mb-6">
                <EmotionTimeline emotionTimeline={localStats.emotionTimeline} />
              </div>
            </Section>
          )}

          {/* Sentiment + Communication */}
          <Section delay={0.3}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              <SentimentGraph sentimentFlow={aiResult.sentimentFlow} />
              <CommunicationBalance localStats={localStats} />
            </div>
          </Section>

          {/* Activity Heatmap */}
          <Section delay={0.35}>
            <div className="mb-6">
              <ActivityHeatmap activityByHour={localStats.activityByHour} participants={localStats.participants} />
            </div>
          </Section>

          {/* ── AI Sections (Task 1: only when aiUsed === true) ── */}
          <Section delay={0.4}>
            <ErrorBoundary>
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <div className="mb-6">
                  {aiUsed ? (
                    <AIInsights aiResult={aiResult} localStats={localStats} />
                  ) : (
                    <AIDisabledCard section="insights" />
                  )}
                </div>
              </Suspense>
            </ErrorBoundary>
          </Section>

          {/* AI Recommendations (Task 1: conditional) */}
          <Section delay={0.45}>
            <ErrorBoundary>
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <div className="mb-6">
                  {aiUsed ? (
                    <Recommendations recommendations={aiResult.recommendations} />
                  ) : (
                    <AIDisabledCard section="recommendations" />
                  )}
                </div>
              </Suspense>
            </ErrorBoundary>
          </Section>

          {/* ── AI Chat Coach (only when AI was used) ── */}
          {aiUsed && (
            <Section delay={0.5}>
              <ErrorBoundary>
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <div className="mb-6">
                    <AIChatCoach
                      aiResult={aiResult}
                      localStats={localStats}
                      provider={provider}
                      apiKey={apiKey}
                    />
                  </div>
                </Suspense>
              </ErrorBoundary>
            </Section>
          )}

          {/* Competition & Leaderboard */}
          <Section delay={0.5}>
            <ErrorBoundary>
              <div className="mt-12 mb-8">
                <div className="flex items-center gap-3 mb-10">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                  <h2 className="font-display font-black text-2xl md:text-3xl text-white uppercase tracking-widest px-4 text-center">
                    Global <span className="text-gradient-pink-purple">Competition</span>
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <CompetitionCard
                      score={score}
                      onScoreSaved={(data) => {
                        setLeaderboardRefresh(prev => prev + 1);
                        showToast(`Successfully joined the leaderboard as ${data.username}!`);
                      }}
                    />
                    <div className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                        <Sparkles size={40} className="text-purple-400" />
                      </div>
                      <h4 className="text-white font-bold text-sm mb-3">Viral Potential</h4>
                      <p className="text-white/40 text-xs leading-relaxed">
                        Relationships with a score above 85% are trending 3× more on social media. Share your card to join the movement!
                      </p>
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <Suspense fallback={
                      <div className="space-y-4">
                        {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                      </div>
                    }>
                      <LeaderboardPreview refreshKey={leaderboardRefresh} />
                    </Suspense>
                  </div>
                </div>
              </div>
            </ErrorBoundary>
          </Section>

          {/* Brand footer for PDF */}
          <div className="hidden show-on-print mt-12 text-center border-t border-white/5 pt-8 opacity-20 text-[10px] tracking-widest uppercase">
            Generated by BondIQ Relationship Intelligence • Private &amp; Ephemeral
          </div>
        </div>

        {/* Footer CTA */}
        <Section delay={0.55}>
          <div className="text-center mt-12 pb-4 no-print">
            <p className="text-white/20 text-xs mb-4">🔒 This analysis was private and ephemeral. No data was stored.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => { analysis.reset(); navigate('/analyze'); }}
                className="btn-primary px-8 py-3 text-sm"
              >
                <RotateCcw size={15} /> Analyze Another Chat
              </motion.button>
              <ExportButton targetId="report" filename={`BondIQ-Report-${p1}-${p2}.pdf`} />
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => setIsShareModalOpen(true)}
                className="btn-ghost px-8 py-3 text-sm"
              >
                <Share2 size={15} /> Share Result
              </motion.button>
            </div>
          </div>
        </Section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 md:px-12 py-8 mt-10 no-print">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-pink-400" fill="currentColor" />
            <span className="font-display font-bold text-white/60 text-sm tracking-tight uppercase">BondIQ</span>
          </div>
          <p className="text-white/20 text-xs">Developed with ❤️ by <span className="text-white/40 font-semibold">M SAAD SHAIKH</span></p>
        </div>
      </footer>

      {/* Share Modal */}
      <ErrorBoundary>
        <ShareChallengeModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          score={score}
          participants={localStats.participants}
          status={status}
          emoji={emoji}
        />
      </ErrorBoundary>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
