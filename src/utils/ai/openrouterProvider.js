/**
 * openrouterProvider.js
 * OpenRouter AI provider wrapper using fetch.
 */

import { buildRepresentativeSample } from '../localAnalysis.js';
import { buildPrompt, formatChatSample, withTimeout, parseAndValidateJSON } from './promptHelper.js';

export async function analyzeWithOpenRouter({ messages, statsSummary, participants, apiKey }) {
  const cleanKey = (apiKey || '').trim().replace(/^["']|["']$/g, '');
  if (!cleanKey || cleanKey.length < 10) {
    throw new Error('A valid OpenRouter API key is required.');
  }

  // OpenRouter (gemini-2.0-flash): 1M token context.
  // Budget = 80,000 chars (~20,000 tokens).
  const sampled    = buildRepresentativeSample(messages, 80000);
  const chatSample = formatChatSample(sampled, messages.length);
  const prompt     = buildPrompt(chatSample, statsSummary, participants);

  const requestBody = {
    model: 'google/gemini-2.0-flash-001',
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  };

  try {
    console.log('[BondIQ] Querying OpenRouter (google/gemini-2.0-flash-001)...');

    const response = await withTimeout(
      fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': `${window.location.origin}`,
          'X-Title': 'BondIQ'
        },
        body: JSON.stringify(requestBody)
      })
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || `HTTP ${response.status}`;

      if (response.status === 429) {
        throw new Error('QUOTA_EXCEEDED');
      }
      if (response.status === 401) {
        throw new Error('Invalid OpenRouter API key. Please check and try again.');
      }
      throw new Error(msg);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    return parseAndValidateJSON(text);

  } catch (err) {
    console.error('[BondIQ] OpenRouter call failed:', err);
    if (err.message === 'QUOTA_EXCEEDED') throw err;
    if (err.message === 'REQUEST_TIMEOUT') {
      throw new Error('The OpenRouter request timed out. Please try again.');
    }
    throw new Error(err.message || 'OpenRouter analysis failed.');
  }
}
