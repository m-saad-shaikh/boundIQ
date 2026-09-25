/**
 * claudeProvider.js
 * Claude (Anthropic) AI provider wrapper using fetch.
 */

import { buildRepresentativeSample } from '../localAnalysis.js';
import { buildPrompt, formatChatSample, withTimeout, parseAndValidateJSON } from './promptHelper.js';

export async function analyzeWithClaude({ messages, statsSummary, participants, apiKey }) {
  const cleanKey = (apiKey || '').trim().replace(/^["']|["']$/g, '');
  if (!cleanKey || cleanKey.length < 10) {
    throw new Error('A valid Claude API key is required.');
  }

  const sampled    = buildRepresentativeSample(messages);
  const chatSample = formatChatSample(sampled, messages.length);
  const prompt     = buildPrompt(chatSample, statsSummary, participants);

  // Anthropic API body structure
  const requestBody = {
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 4000,
    system: 'You are an empathetic relationship analyst. You must return only a valid JSON response matching the requested schema. Do not write any markdown code fences, just return raw JSON.',
    messages: [
      { role: 'user', content: prompt }
    ]
  };

  try {
    console.log('[BondIQ] Querying Claude (claude-3-5-haiku-20241022)...');

    const response = await withTimeout(
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerously-allow-browser': 'true' // Disables client SDK check
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
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid Claude API key. Please check and try again.');
      }
      throw new Error(msg);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    return parseAndValidateJSON(text);

  } catch (err) {
    console.error('[BondIQ] Claude call failed:', err);

    // Provide guidance for CORS errors (which happen when querying Claude directly from the browser)
    const isCorsErr = err instanceof TypeError && err.message?.includes('Failed to fetch');
    if (isCorsErr) {
      throw new Error(
        'Anthropic API blocks direct browser calls (CORS). ' +
        'Please use OpenRouter to access Claude, or configure a local proxy.'
      );
    }

    if (err.message === 'QUOTA_EXCEEDED') throw err;
    if (err.message === 'REQUEST_TIMEOUT') {
      throw new Error('The Claude request timed out. Please try again.');
    }
    throw new Error(err.message || 'Claude analysis failed.');
  }
}
