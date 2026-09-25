/**
 * groqProvider.js
 * Groq AI provider wrapper using OpenAI-compatible fetch API.
 */

import { buildRepresentativeSample } from '../localAnalysis.js';
import { buildPrompt, formatChatSample, withTimeout, parseAndValidateJSON } from './promptHelper.js';

export async function analyzeWithGroq({ messages, statsSummary, participants, apiKey }) {
  const cleanKey = (apiKey || '').trim().replace(/^["']|["']$/g, '');
  if (!cleanKey || cleanKey.length < 10) {
    throw new Error('A valid Groq API key is required.');
  }

  // Groq free tier: ~6,000 tokens/min limit.
  // Budget = 6,000 chars (~1,500 tokens) for chat sample; rest goes to prompt overhead.
  const sampled    = buildRepresentativeSample(messages, 6000);
  const chatSample = formatChatSample(sampled, messages.length);
  const prompt     = buildPrompt(chatSample, statsSummary, participants);

  const modelsToTry = [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-20b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant'
  ];

  let lastError = null;

  try {
    for (const model of modelsToTry) {
      try {
        console.log(`[BondIQ] Querying Groq with model: ${model}...`);
        const requestBody = {
          model,
          messages: [
            { role: 'system', content: 'You are an empathetic relationship analyst.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        };

        const response = await withTimeout(
          fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${cleanKey}`
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
            throw new Error('Invalid Groq API key. Please check and try again.');
          }
          // If model not found, continue to next model in loop
          if (msg.includes('does not exist') || msg.includes('model_not_found') || response.status === 404) {
            console.warn(`[BondIQ] Groq model ${model} not available, trying next...`);
            lastError = new Error(msg);
            continue;
          }
          throw new Error(msg);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        return parseAndValidateJSON(text);

      } catch (err) {
        if (err.message === 'QUOTA_EXCEEDED' || err.message.includes('Invalid Groq API key')) {
          throw err;
        }
        lastError = err;
      }
    }

    throw lastError || new Error('All Groq models failed. Please try another provider.');

  } catch (err) {
    console.error('[BondIQ] Groq call failed:', err);
    if (err.message === 'QUOTA_EXCEEDED') throw err;
    if (err.message === 'REQUEST_TIMEOUT') {
      throw new Error('The Groq request timed out. Please try again.');
    }
    throw new Error(err.message || 'Groq analysis failed.');
  }
}
