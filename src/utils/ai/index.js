/**
 * index.js
 * Central coordinator for BondIQ AI Providers.
 */

import { analyzeWithGemini } from './geminiProvider.js';
import { analyzeWithOpenAI } from './openaiProvider.js';
import { analyzeWithGroq } from './groqProvider.js';
import { analyzeWithOpenRouter } from './openrouterProvider.js';
import { analyzeWithClaude } from './claudeProvider.js';

export const PROVIDERS = {
  GEMINI: 'gemini',
  GROQ: 'groq',
  OPENROUTER: 'openrouter',
  OPENAI: 'openai',
  CLAUDE: 'claude',
};

// ─── Key Validation Rules ─────────────────────────────────────────────────────
export const KEY_VALIDATORS = {
  [PROVIDERS.GEMINI]: {
    prefix: 'AIza',
    pattern: /^AIza[0-9A-Za-z-_]{35}$/,
    placeholder: 'AIzaSy...',
    errorMsg: 'Gemini keys typically start with "AIza" and are 39 characters long.',
  },
  [PROVIDERS.GROQ]: {
    prefix: 'gsk_',
    pattern: /^gsk_[0-9A-Za-z]{40,}$/,
    placeholder: 'gsk_...',
    errorMsg: 'Groq keys typically start with "gsk_".',
  },
  [PROVIDERS.OPENAI]: {
    prefix: 'sk-',
    pattern: /^sk-[a-zA-Z0-9\-_]{20,}$/,  // allow hyphens/underscores for sk-proj-xxx format
    placeholder: 'sk-proj-... or sk-...',
    errorMsg: 'OpenAI keys typically start with "sk-" (e.g. sk-proj-... or sk-...).',
  },
  [PROVIDERS.OPENROUTER]: {
    prefix: 'sk-or-v1-',
    pattern: /^sk-or-v1-[0-9A-Za-z]{50,}$/,
    placeholder: 'sk-or-v1-...',
    errorMsg: 'OpenRouter keys typically start with "sk-or-v1-".',
  },
  [PROVIDERS.CLAUDE]: {
    prefix: 'sk-ant-',
    pattern: /^sk-ant-[0-9A-Za-z-_]{30,}$/,
    placeholder: 'sk-ant-sid01-...',
    errorMsg: 'Claude keys typically start with "sk-ant-".',
  },
};

/**
 * Validates the prefix format of an API key for a given provider.
 * @param {string} provider
 * @param {string} key
 * @returns {boolean}
 */
export function validateApiKey(provider, key) {
  if (!key) return false;
  const config = KEY_VALIDATORS[provider];
  if (!config) return true; // generic format check
  return key.trim().startsWith(config.prefix);
}

/**
 * Routes the analysis request to the selected AI provider.
 */
export async function generateAnalysis({ provider, apiKey, messages, statsSummary, participants }) {
  const selectedProvider = provider || PROVIDERS.GEMINI;

  switch (selectedProvider) {
    case PROVIDERS.GEMINI:
      return await analyzeWithGemini({ messages, statsSummary, participants, apiKey });
    case PROVIDERS.OPENAI:
      return await analyzeWithOpenAI({ messages, statsSummary, participants, apiKey });
    case PROVIDERS.GROQ:
      return await analyzeWithGroq({ messages, statsSummary, participants, apiKey });
    case PROVIDERS.OPENROUTER:
      return await analyzeWithOpenRouter({ messages, statsSummary, participants, apiKey });
    case PROVIDERS.CLAUDE:
      return await analyzeWithClaude({ messages, statsSummary, participants, apiKey });
    default:
      throw new Error(`Unsupported AI provider: ${selectedProvider}`);
  }
}

// ─── Fallback / Local analysis (when no API key or AI fails) ─────────────────
export function getDemoAnalysis(localStats) {
  const [p1, p2] = localStats.participants;
  const totalMessages = localStats.totalMessages || 1;

  // ── Improved score formula using actual chat data ──────────────────────────
  const avgAffection = (
    localStats.stats[p1].emotionScore.affectionate +
    localStats.stats[p2].emotionScore.affectionate
  ) / Math.max(totalMessages, 1);

  const avgPositive = (
    localStats.stats[p1].emotionScore.positive +
    localStats.stats[p2].emotionScore.positive
  ) / Math.max(totalMessages, 1);

  const avgNegative = (
    localStats.stats[p1].emotionScore.negative +
    localStats.stats[p2].emotionScore.negative
  ) / Math.max(totalMessages, 1);

  // Sentiment positivity ratio (0-1)
  const totalSentiment = avgPositive + avgNegative + 0.01;
  const positivityRatio = avgPositive / totalSentiment;

  const score = Math.round(
    35 +
    Math.min(localStats.consistencyScore * 3, 15) +   // up to 15pts (was 20 via *2)
    Math.min(avgAffection * 50, 20) +                 // up to 20pts affection density
    positivityRatio * 15 +                             // up to 15pts sentiment ratio
    (localStats.mutualEngagementScore / 100) * 10 +   // up to 10pts balance
    Math.min(localStats.lateNightScore / 100 * 5, 5)  // up to 5pts late night
  );

  const clampedScore = Math.min(Math.max(score, 20), 95);

  // ── Derive sentimentFlow from real emotionTimeline ─────────────────────────
  // This replaces hardcoded fake data with actual chat sentiment over time
  const timeline = localStats.emotionTimeline || [];
  let sentimentFlow;

  if (timeline.length >= 3) {
    // Split into thirds for early/middle/recent
    const thirdLen = Math.ceil(timeline.length / 3);
    const zones = [
      { label: 'Early',  entries: timeline.slice(0, thirdLen) },
      { label: 'Middle', entries: timeline.slice(thirdLen, thirdLen * 2) },
      { label: 'Recent', entries: timeline.slice(thirdLen * 2) },
    ];
    sentimentFlow = zones.map(({ label, entries }) => {
      const totPos = entries.reduce((s, e) => s + e.positive, 0);
      const totNeg = entries.reduce((s, e) => s + e.negative, 0);
      const totAll = entries.reduce((s, e) => s + e.total, 0) || 1;
      const pos = Math.round((totPos / totAll) * 100);
      const neg = Math.round((totNeg / totAll) * 100);
      return { label, positive: pos, neutral: Math.max(100 - pos - neg, 0), negative: neg };
    });
  } else if (timeline.length > 0) {
    // Just 1-2 months: use as single data points
    sentimentFlow = timeline.map(t => {
      const total = t.total || 1;
      const pos = Math.round((t.positive / total) * 100);
      const neg = Math.round((t.negative / total) * 100);
      return { label: t.month, positive: pos, neutral: Math.max(100 - pos - neg, 0), negative: neg };
    });
  } else {
    // Pure fallback: use overall stats when no timeline available
    const overallPos = Math.round(positivityRatio * 70);
    const overallNeg = Math.round((1 - positivityRatio) * 30);
    sentimentFlow = [
      { label: 'Overall', positive: overallPos, neutral: 100 - overallPos - overallNeg, negative: overallNeg },
    ];
  }

  return {
    relationshipScore:       clampedScore,
    relationshipStatus:      clampedScore > 78 ? 'Emotionally Strong' : clampedScore > 60 ? 'Growing Bond' : clampedScore > 45 ? 'Mixed Signals' : 'Needs Work',
    relationshipStatusEmoji: clampedScore > 78 ? '❤️' : clampedScore > 60 ? '🌱' : clampedScore > 45 ? '😶' : '💔',
    emotionalProfile:        null,
    communicationInsights:   [],
    sentimentFlow,  // ← Now real data, not hardcoded!
    recommendations: [],
    aiStory:         null,
    keyMoments:      [],
    compatibilityFactors: null,
    aiUsed: false,
    _usedDemoMode: true,
  };
}


/**
 * Test connectivity for the selected AI provider.
 */
export async function testConnection({ provider, apiKey }) {
  if (!apiKey || apiKey.trim().length < 10) {
    throw new Error('Please enter a valid API key first.');
  }

  const trimmedKey = apiKey.trim();
  const selectedProvider = provider || PROVIDERS.GEMINI;

  switch (selectedProvider) {
    case PROVIDERS.GEMINI: {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(trimmedKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent('Reply with exactly OK.');
      const text = result.response.text().trim().toLowerCase();
      if (!text || text.length === 0) {
        throw new Error('Empty response from Gemini.');
      }
      break;
    }

    case PROVIDERS.OPENAI: {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${trimmedKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'OK' }],
          max_tokens: 5
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
      }
      break;
    }

    case PROVIDERS.GROQ: {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${trimmedKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: 'OK' }],
          max_tokens: 5
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
      }
      break;
    }

    case PROVIDERS.OPENROUTER: {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${trimmedKey}`
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite:free',
          messages: [{ role: 'user', content: 'OK' }],
          max_tokens: 5
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
      }
      break;
    }

    case PROVIDERS.CLAUDE: {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': trimmedKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'OK' }],
          max_tokens: 5
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
      }
      break;
    }

    default:
      throw new Error(`Unsupported AI provider: ${selectedProvider}`);
  }
}
