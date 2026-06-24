/**
 * promptHelper.js
 * Shared prompts and text formatting helpers for BondIQ's AI providers.
 */

import { buildRepresentativeSample } from '../localAnalysis.js';

// ─── Build the AI prompt ──────────────────────────────────────────────────────
export function buildPrompt(chatSample, statsSummary, participants) {
  const [p1, p2] = participants;

  return `You are an empathetic AI relationship intelligence system. Analyze the following one-to-one conversation between "${p1}" and "${p2}".

Use the pre-computed statistics AND the chat sample to generate deep, emotionally intelligent insights.

${statsSummary}

--- CHAT SAMPLE (representative messages) ---
${chatSample}
--- END OF CHAT SAMPLE ---

Analyze this conversation deeply and return a SINGLE valid JSON object with EXACTLY this structure (no markdown, no code fences, just raw JSON):

{
  "relationshipScore": <integer 0-100>,
  "relationshipStatus": <one of: "Soul Connected", "Emotionally Strong", "Growing Bond", "Mixed Signals", "Emotionally Distant", "Dry Connection">,
  "relationshipStatusEmoji": <emoji string matching the status>,
  "emotionalProfile": {
    "overall": <"positive" | "neutral" | "negative" | "mixed">,
    "dominant": <the most dominant emotional tone in 1-3 words>,
    "p1Tone": <emotional tone of "${p1}" in 2-4 words>,
    "p2Tone": <emotional tone of "${p2}" in 2-4 words>,
    "affectionLevel": <"high" | "medium" | "low">,
    "conflictLevel": <"high" | "medium" | "low">,
    "supportLevel": <"high" | "medium" | "low">
  },
  "communicationInsights": [
    <5-7 short, specific insight strings about communication patterns, effort, style, balance>
  ],
  "sentimentFlow": [
    { "label": <short period label like "Early chats">, "positive": <0-100>, "neutral": <0-100>, "negative": <0-100> }
  ],
  "recommendations": [
    <5-7 warm, actionable recommendation strings — empathetic and constructive, not judgmental>
  ],
  "aiStory": <A 3-5 sentence emotional narrative about this relationship's journey — warm, human, cinematic. Avoid toxic or manipulative framing.>,
  "keyMoments": [
    <3-5 brief strings describing notable emotional moments or patterns detected in the chat>
  ],
  "compatibilityFactors": {
    "communicationStyle": <"aligned" | "somewhat aligned" | "misaligned">,
    "emotionalInvestment": <"balanced" | "one-sided" | "growing">,
    "conversationDepth": <"deep" | "moderate" | "surface-level">
  }
}

Rules:
- Be empathetic and emotionally intelligent. No toxic framing.
- All strings must be warm, insightful, and human-sounding.
- relationshipScore should reflect overall health (not just sentiment).
- sentimentFlow should have 4-6 entries spanning the relationship arc.
- Return ONLY the JSON. No preamble, no explanation.`;
}

// ─── Format chat sample as readable text ─────────────────────────────────────
export function formatChatSample(sampledMessages, totalCount) {
  const header = `[Context: Sampled ${sampledMessages.length} emotionally-weighted messages from ${totalCount} total, spanning the full relationship timeline]\n\n`;
  const body = sampledMessages.map(m => {
    const time = new Date(m.timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: '2-digit',
    });
    return `[${time}] ${m.sender}: ${m.text}`;
  }).join('\n');
  return header + body;
}

// ─── Request timeout wrapper ──────────────────────────────────────────────────
export function withTimeout(promise, ms = 45000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), ms)
    ),
  ]);
}

// ─── Clean and Parse JSON Helper ──────────────────────────────────────────────
export function parseAndValidateJSON(text) {
  let jsonText = text.trim();

  // Strip markdown code fences if present
  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonText = fenceMatch[1].trim();

  // Find the first valid JSON object
  const start = jsonText.indexOf('{');
  const end   = jsonText.lastIndexOf('}');
  if (start !== -1 && end !== -1) jsonText = jsonText.slice(start, end + 1);

  const parsed = JSON.parse(jsonText);

  // Validate essential fields
  if (typeof parsed.relationshipScore !== 'number') {
    throw new Error('Invalid response structure from AI.');
  }

  return parsed;
}
