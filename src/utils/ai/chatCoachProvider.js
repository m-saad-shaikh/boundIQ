/**
 * chatCoachProvider.js
 * Powers the AI Chat Coach feature in BondIQ.
 * Sends a user question + relationship context to the selected AI provider.
 */

import { withTimeout } from './promptHelper.js';

// ─── Build the system prompt ──────────────────────────────────────────────────
function buildCoachSystemPrompt(aiResult, localStats, activeUser) {
  const [p1, p2] = localStats?.participants || ['Person 1', 'Person 2'];
  const user = activeUser || p1;
  const partner = user === p1 ? p2 : p1;

  const score    = aiResult?.relationshipScore || 70;
  const status   = aiResult?.relationshipStatus || 'Growing Bond';
  const story    = aiResult?.aiStory || '';
  const profile  = aiResult?.emotionalProfile || {};
  const insights = (aiResult?.communicationInsights || []).join('\n- ');
  const moments  = (aiResult?.keyMoments || []).join('\n- ');
  const recs     = (aiResult?.recommendations || []).join('\n- ');

  // Detailed statistics
  const totalMsgs = localStats?.totalMessages || 0;
  const userStats = localStats?.stats?.[user] || {};
  const partnerStats = localStats?.stats?.[partner] || {};
  const userDelay = localStats?.avgReplyDelay?.[user] != null ? `${localStats.avgReplyDelay[user]} mins` : 'N/A';
  const partnerDelay = localStats?.avgReplyDelay?.[partner] != null ? `${localStats.avgReplyDelay[partner]} mins` : 'N/A';
  const userInitiation = localStats?.initiationFrequency?.[user] != null ? `${localStats.initiationFrequency[user]}%` : '50%';
  const partnerInitiation = localStats?.initiationFrequency?.[partner] != null ? `${localStats.initiationFrequency[partner]}%` : '50%';
  const userDry = localStats?.dryTextingScore?.[user] != null ? `${localStats.dryTextingScore[user]}/100` : 'N/A';
  const partnerDry = localStats?.dryTextingScore?.[partner] != null ? `${localStats.dryTextingScore[partner]}/100` : 'N/A';

  // Recent actual message snippets for pinpoint accuracy
  const recentExcerpts = (localStats?.recentMessages || [])
    .slice(-25)
    .map(m => `[${m.sender}]: ${m.text}`)
    .join('\n');

  return `You are BondIQ's empathetic, insightful AI Relationship Coach.

=== USER PERSPECTIVE & IDENTITY (CRITICAL) ===
- The person chatting with you RIGHT NOW is: "${user}"
- Their partner / friend they are discussing is: "${partner}"
- When "${user}" says "I", "me", "my", or asks "Should I...", "What should I do?", "Did I do something wrong?", they are talking about THEMSELVES ("${user}").
- When they mention "${partner}", or "they/he/she", they mean "${partner}".
- ALWAYS address the user directly as "you" ("${user}") and speak about "${partner}" by their name!
- NEVER mix up who is who! You are coaching ${user} on their relationship with ${partner}.
- If ${user} speaks or asks in Hindi or Hinglish (e.g., "kya baat hai?", "mujhe kya karna chahiye?"), reply in warm, natural conversational Hinglish/Hindi! If in English, reply in English!

=== VERIFIED RELATIONSHIP METRICS ===
- Relationship Health Score: ${score}/100 (${status})
- Total Messages Analyzed: ${totalMsgs}
- Message Count: You (${user}) sent ${userStats.messageCount || 0} msgs | ${partner} sent ${partnerStats.messageCount || 0} msgs
- Initiation Frequency: You start ${userInitiation} of chats | ${partner} starts ${partnerInitiation}
- Average Reply Speed: You take ~${userDelay} | ${partner} takes ~${partnerDelay}
- Text Warmth (Dry Texting Score, higher is warmer): You: ${userDry} | ${partner}: ${partnerDry}
- Overall Emotional Tone: ${profile.overall || 'N/A'}
- Affection Level: ${profile.affectionLevel || 'N/A'} | Conflict Level: ${profile.conflictLevel || 'N/A'}
- ${user}'s Detected Tone: ${user === p1 ? profile.p1Tone : profile.p2Tone || 'N/A'}
- ${partner}'s Detected Tone: ${partner === p1 ? profile.p1Tone : profile.p2Tone || 'N/A'}

=== KEY INSIGHTS & STORY ===
${story ? `Story: ${story}` : ''}
${insights ? `Insights:\n- ${insights}` : ''}
${moments ? `Key Moments:\n- ${moments}` : ''}
${recs ? `Recommendations:\n- ${recs}` : ''}

=== RECENT REAL CONVERSATION EXCERPTS ===
${recentExcerpts || 'No recent raw excerpts available'}
========================================

=== COACHING INSTRUCTIONS ===
1. ACCURACY: Base your analysis directly on the real numbers, tone, and chat excerpts above. Explain the REAL dynamic honestly — if ${partner} is being distant, or if ${user} is overthinking, point it out gently with evidence.
2. PERSPECTIVE: Stand in ${user}'s corner as a trusted, emotionally mature mentor who wants the healthiest outcome for them.
3. LANGUAGE: Match ${user}'s language naturally (Hinglish/Hindi/English).
4. LENGTH: 2-3 focused paragraphs with practical, real-world advice and actionable next steps.`;
}

// ─── Call Gemini ──────────────────────────────────────────────────────────────
async function callGemini(apiKey, systemPrompt, messages) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  });

  const previousTurns = messages.slice(0, -1);
  const history = previousTurns.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
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
export async function chatWithCoach({ provider, apiKey, messages, aiResult, localStats, activeUser }) {
  if (!apiKey || apiKey.trim().length < 10) {
    throw new Error('A valid API key is required for Chat Coach.');
  }

  const systemPrompt = buildCoachSystemPrompt(aiResult, localStats, activeUser);

  try {
    switch (provider) {
      case 'gemini': {
        return await callGemini(apiKey, systemPrompt, messages);
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
