/**
 * chatCoachProvider.js
 * Powers the AI Chat Coach feature in BondIQ.
 * Sends a user question + relationship context to the selected AI provider.
 */

import { withTimeout } from './promptHelper.js';

// ─── Build the system prompt ──────────────────────────────────────────────────
function buildCoachSystemPrompt(aiResult, localStats) {
  const [p1, p2] = localStats?.participants || ['Person 1', 'Person 2'];
  const score    = aiResult?.relationshipScore || 70;
  const status   = aiResult?.relationshipStatus || 'Growing Bond';
  const story    = aiResult?.aiStory || '';
  const profile  = aiResult?.emotionalProfile || {};
  const insights = (aiResult?.communicationInsights || []).join('\n- ');
  const moments  = (aiResult?.keyMoments || []).join('\n- ');
  const recs     = (aiResult?.recommendations || []).join('\n- ');

  return `You are BondIQ's empathetic AI Chat Coach — a warm, emotionally intelligent relationship advisor.

You have access to the full analysis of a conversation between "${p1}" and "${p2}".

=== RELATIONSHIP ANALYSIS CONTEXT ===
Relationship Score: ${score}/100
Status: ${status}
Emotional Story: ${story}

Emotional Profile:
- Overall Tone: ${profile.overall || 'N/A'}
- Affection Level: ${profile.affectionLevel || 'N/A'}
- Conflict Level: ${profile.conflictLevel || 'N/A'}
- Support Level: ${profile.supportLevel || 'N/A'}
- ${p1}'s Tone: ${profile.p1Tone || 'N/A'}
- ${p2}'s Tone: ${profile.p2Tone || 'N/A'}

Communication Insights:
- ${insights || 'N/A'}

Key Moments Detected:
- ${moments || 'N/A'}

Recommendations:
- ${recs || 'N/A'}
=== END OF CONTEXT ===

Your role as Chat Coach:
- Answer questions specifically about THIS relationship and its analysis
- Be warm, non-judgmental, and emotionally supportive
- Give practical, actionable advice
- Refer to ${p1} and ${p2} by name when relevant
- Keep answers concise (2-4 paragraphs max) but rich and empathetic
- Use the analysis data to support your answers
- Never reveal raw JSON or technical data — translate it into human language
- If asked something unrelated to the relationship, gently redirect back`;
}

// ─── Call Gemini ──────────────────────────────────────────────────────────────
async function callGemini(apiKey, messages) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const chat = model.startChat({
    history: messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
  });

  const lastMsg = messages[messages.length - 1];
  const result  = await chat.sendMessage(lastMsg.content);
  return result.response.text();
}

// ─── Call OpenAI-compatible (OpenAI, Groq, OpenRouter) ───────────────────────
async function callOpenAICompat(endpoint, apiKey, model, systemPrompt, messages, extraHeaders = {}) {
  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.75,
    max_tokens: 800,
  };

  const response = await withTimeout(
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    })
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `HTTP ${response.status}`;
    if (response.status === 401) throw new Error('Invalid API key.');
    if (response.status === 429) throw new Error('QUOTA_EXCEEDED');
    throw new Error(msg);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── Call Claude ──────────────────────────────────────────────────────────────
async function callClaude(apiKey, systemPrompt, messages) {
  const response = await withTimeout(
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerously-allow-browser': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        system: systemPrompt,
        messages,
        max_tokens: 800,
      }),
    })
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `HTTP ${response.status}`;
    if (response.status === 401) throw new Error('Invalid Claude API key.');
    if (response.status === 429) throw new Error('QUOTA_EXCEEDED');
    throw new Error(msg);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * @param {object} opts
 * @param {string} opts.provider  - 'gemini' | 'groq' | 'openai' | 'openrouter' | 'claude'
 * @param {string} opts.apiKey    - User's API key
 * @param {Array}  opts.messages  - [{role: 'user'|'assistant', content: string}]
 * @param {object} opts.aiResult  - Full AI analysis result
 * @param {object} opts.localStats- Local statistics
 */
export async function chatWithCoach({ provider, apiKey, messages, aiResult, localStats }) {
  if (!apiKey || apiKey.trim().length < 10) {
    throw new Error('A valid API key is required for Chat Coach.');
  }

  const systemPrompt = buildCoachSystemPrompt(aiResult, localStats);

  try {
    switch (provider) {
      case 'gemini': {
        // For Gemini, prepend system prompt to first user message
        const withSystem = messages.map((m, i) =>
          i === 0 && m.role === 'user'
            ? { ...m, content: `${systemPrompt}\n\n---\n\n${m.content}` }
            : m
        );
        return await callGemini(apiKey, withSystem);
      }

      case 'groq':
        return await callOpenAICompat(
          'https://api.groq.com/openai/v1/chat/completions',
          apiKey,
          'llama-3.1-8b-instant',
          systemPrompt,
          messages
        );

      case 'openai':
        return await callOpenAICompat(
          'https://api.openai.com/v1/chat/completions',
          apiKey,
          'gpt-4o-mini',
          systemPrompt,
          messages
        );

      case 'openrouter':
        return await callOpenAICompat(
          'https://openrouter.ai/api/v1/chat/completions',
          apiKey,
          'google/gemini-2.5-flash',
          systemPrompt,
          messages,
          {
            'HTTP-Referer': window.location.origin,
            'X-Title': 'BondIQ Chat Coach',
          }
        );

      case 'claude':
        return await callClaude(apiKey, systemPrompt, messages);

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (err) {
    console.error('[BondIQ Chat Coach] Error:', err);
    if (err.message === 'QUOTA_EXCEEDED') throw err;
    if (err.message === 'REQUEST_TIMEOUT') {
      throw new Error('The request timed out. Please try again.');
    }
    throw new Error(err.message || 'Chat Coach failed to respond.');
  }
}
