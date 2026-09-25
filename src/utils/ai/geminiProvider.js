/**
 * geminiProvider.js
 * Gemini AI provider wrapper for BondIQ relationship analysis.
 */

import { buildRepresentativeSample } from '../localAnalysis.js';
import { buildPrompt, formatChatSample, withTimeout, parseAndValidateJSON } from './promptHelper.js';

const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
];

export async function analyzeWithGemini({ messages, statsSummary, participants, apiKey }) {
  const cleanKey = (apiKey || '').trim().replace(/^["']|["']$/g, '');
  if (!cleanKey || cleanKey.length < 10) {
    throw new Error('A valid Gemini API key is required.');
  }

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(cleanKey);

  // Gemini free tier: 1M token context, 15 RPM.
  // Budget = 80,000 chars (~20,000 tokens) — plenty of headroom.
  const sampled    = buildRepresentativeSample(messages, 80000);
  const chatSample = formatChatSample(sampled, messages.length);
  const prompt     = buildPrompt(chatSample, statsSummary, participants);

  let lastError = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`[BondIQ] Trying Gemini model: ${modelName}`);

      const model  = genAI.getGenerativeModel({ model: modelName });
      const result = await withTimeout(model.generateContent(prompt));
      const text   = result.response.text();

      const parsed = parseAndValidateJSON(text);
      console.log(`[BondIQ] ✅ Gemini success with model: ${modelName}`);
      return parsed;

    } catch (err) {
      lastError = err;
      const msg = err.message || '';
      console.warn(`[BondIQ] Model ${modelName} failed:`, msg.slice(0, 150));

      if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('QUOTA_EXCEEDED');
      }

      if (msg === 'REQUEST_TIMEOUT') {
        throw new Error('The AI request timed out. Please try again.');
      }

      if (msg.includes('400') || msg.includes('API_KEY_INVALID') || msg.includes('invalid api key')) {
        throw new Error('Invalid Gemini API key. Please check and try again.');
      }

      if (msg.includes('404') || msg.includes('not found') || msg.includes('not supported')) {
        continue;
      }
      break;
    }
  }

  const finalMsg = lastError?.message || 'All Gemini models failed.';
  throw new Error(finalMsg);
}
