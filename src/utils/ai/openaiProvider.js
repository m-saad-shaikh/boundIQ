/**
 * openaiProvider.js
 * OpenAI provider wrapper using direct fetch requests.
 */

import { buildRepresentativeSample } from '../localAnalysis.js';
import { buildPrompt, formatChatSample, withTimeout, parseAndValidateJSON } from './promptHelper.js';

export async function analyzeWithOpenAI({ messages, statsSummary, participants, apiKey }) {
  if (!apiKey || apiKey.trim().length < 10) {
    throw new Error('A valid OpenAI API key is required.');
  }

  const sampled    = buildRepresentativeSample(messages);
  const chatSample = formatChatSample(sampled, messages.length);
  const prompt     = buildPrompt(chatSample, statsSummary, participants);

  const requestBody = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an empathetic relationship analyst.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  };

  try {
    console.log('[BondIQ] Querying OpenAI (gpt-4o-mini)...');
    
    const response = await withTimeout(
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
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
        throw new Error('Invalid OpenAI API key. Please check and try again.');
      }
      throw new Error(msg);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    return parseAndValidateJSON(text);

  } catch (err) {
    console.error('[BondIQ] OpenAI call failed:', err);
    if (err.message === 'QUOTA_EXCEEDED') throw err;
    if (err.message === 'REQUEST_TIMEOUT') {
      throw new Error('The OpenAI request timed out. Please try again.');
    }
    throw new Error(err.message || 'OpenAI analysis failed.');
  }
}
