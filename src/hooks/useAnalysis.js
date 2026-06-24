/**
 * useAnalysis.js
 * Orchestrates the full analysis pipeline:
 * 1. Parse chat text
 * 2. Run local analysis (instant, no API needed)
 * 3. Optionally run Gemini AI analysis (async, requires API key)
 *
 * Key change: tracks `aiUsed` boolean so the UI can conditionally
 * show or hide AI-only sections (story, recommendations, insights).
 */

import { useState, useCallback } from 'react';
import { parseChat } from '../utils/chatParser.js';
import { runLocalAnalysis, buildStatsSummary } from '../utils/localAnalysis.js';
import { generateAnalysis, getDemoAnalysis } from '../utils/ai/index.js';

export const ANALYSIS_STAGES = {
  IDLE:    'idle',
  PARSING: 'parsing',
  LOCAL:   'local',
  AI:      'ai',
  DONE:    'done',
  ERROR:   'error',
};

export function useAnalysis() {
  const [stage,      setStage]      = useState(ANALYSIS_STAGES.IDLE);
  const [progress,   setProgress]   = useState(0);
  const [stageLabel, setStageLabel] = useState('');
  const [localStats, setLocalStats] = useState(null);
  const [aiResult,   setAiResult]   = useState(null);
  const [error,      setError]      = useState(null);

  const reset = useCallback(() => {
    setStage(ANALYSIS_STAGES.IDLE);
    setProgress(0);
    setStageLabel('');
    setLocalStats(null);
    setAiResult(null);
    setError(null);
  }, []);

  const analyze = useCallback(async ({ rawText, format, provider, apiKey, overrideParticipants }) => {
    setError(null);

    try {
      // ── Stage 1: Parse ────────────────────────────────────
      setStage(ANALYSIS_STAGES.PARSING);
      setStageLabel('Parsing your conversation...');
      setProgress(10);
      await tick();

      const { messages } = parseChat(rawText, format);

      if (messages.length < 5) {
        throw new Error(
          'Not enough messages to analyze. Please make sure the chat has at least 5 messages in a recognized format.'
        );
      }

      // If user confirmed specific participant names, remap message senders
      // so the rest of the pipeline uses the corrected names
      let processedMessages = messages;
      if (overrideParticipants && overrideParticipants.length === 2) {
        // Get the auto-detected top 2 participants (by count)
        const { getParticipants } = await import('../utils/chatParser.js');
        const detectedTop2 = getParticipants(messages);
        const nameMap = {};
        detectedTop2.forEach((name, i) => {
          if (overrideParticipants[i] && overrideParticipants[i] !== name) {
            nameMap[name] = overrideParticipants[i];
          }
        });
        if (Object.keys(nameMap).length > 0) {
          processedMessages = messages.map(m => ({
            ...m,
            sender: nameMap[m.sender] || m.sender,
          }));
        }
      }

      setProgress(25);

      // ── Stage 2: Local analysis ───────────────────────────
      setStage(ANALYSIS_STAGES.LOCAL);
      setStageLabel('Analyzing communication patterns...');
      setProgress(35);
      await tick();

      const stats = runLocalAnalysis(processedMessages);
      setLocalStats(stats);
      setProgress(55);

      // ── Stage 3: AI analysis ──────────────────────────────
      setStage(ANALYSIS_STAGES.AI);

      let aiData;
      const hasApiKey = apiKey && apiKey.trim().length > 10;

      if (hasApiKey) {
        setStageLabel('Consulting emotional AI...');
        setProgress(65);
        await tick();

        try {
          const summary = buildStatsSummary(stats);
          const result  = await generateAnalysis({
            provider,
            messages: processedMessages,
            statsSummary: summary,
            participants: stats.participants,
            apiKey: apiKey.trim(),
          });

          // Mark AI as actually used
          aiData = { ...result, aiUsed: true, _usedDemoMode: false };

        } catch (aiErr) {
          const errMsg = aiErr.message || '';
          console.warn(`[BondIQ] ${provider || 'AI'} analysis failed:`, errMsg);

          if (errMsg === 'QUOTA_EXCEEDED' || errMsg.includes('429')) {
            // Quota exceeded: fall back gracefully
            console.warn('[BondIQ] Quota exceeded — falling back to local stats mode.');
            aiData = getDemoAnalysis(stats);
            aiData._quotaExceeded = true;
          } else {
            // Re-throw other errors so the user sees the message
            throw aiErr;
          }
        }

      } else {
        // No API key provided — skip AI entirely
        setStageLabel('Running local analysis...');
        setProgress(65);
        await delay(800); // brief pause for UX smoothness
        aiData = getDemoAnalysis(stats); // aiUsed: false
      }

      setAiResult(aiData);
      setProgress(100);

      // ── Done ──────────────────────────────────────────────
      setStage(ANALYSIS_STAGES.DONE);
      setStageLabel('Analysis complete!');

    } catch (err) {
      console.error('[BondIQ] Analysis error:', err);
      setStage(ANALYSIS_STAGES.ERROR);
      setError(err.message || 'Something went wrong. Please try again.');
    }
  }, []);

  return {
    stage,
    progress,
    stageLabel,
    localStats,
    aiResult,
    error,
    analyze,
    reset,
    isLoading: stage === ANALYSIS_STAGES.PARSING
               || stage === ANALYSIS_STAGES.LOCAL
               || stage === ANALYSIS_STAGES.AI,
    isDone: stage === ANALYSIS_STAGES.DONE,
    // Convenience: true only when real AI analysis was used
    aiUsed: aiResult?.aiUsed === true,
  };
}

// ── Utilities ─────────────────────────────────────────────────────────────────
const tick  = () => new Promise(r => setTimeout(r, 50));
const delay = ms => new Promise(r => setTimeout(r, ms));
