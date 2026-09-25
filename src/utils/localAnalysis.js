/**
 * localAnalysis.js
 * Fast, client-side analysis of parsed chat messages.
 * Produces rich statistics without any API call.
 * 
 * Extended with Task 7 metrics:
 *   - conversationConsistencyScore
 *   - dryTextingScore (per participant)
 *   - mutualEngagementScore
 *   - emojiUsageStats
 *   - initiationFrequency (%)
 *   - avgResponseDelay (min)
 *   - lateNightScore
 *   - weeklyTrends
 *   - monthlyTrends
 */

import { getParticipants } from './chatParser.js';

// ─── Emoji Regex ──────────────────────────────────────────────────────────────
const EMOJI_REGEX = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;

// ─── Emotional Word Lists ─────────────────────────────────────────────────────
const POSITIVE_WORDS = new Set([
  'love','lovely','amazing','wonderful','happy','joy','joyful','great','awesome',
  'beautiful','smile','laugh','cute','sweet','adore','appreciate','grateful',
  'thankful','excited','thrilled','fantastic','brilliant','perfect','best',
  'proud','glad','blessed','cherish','hug','kiss','darling','honey','babe',
  'miss','missed','missing','care','caring','warm','sunshine','heart','❤️','😍','😘','🥰'
]);

const NEGATIVE_WORDS = new Set([
  'sad','hate','angry','upset','hurt','pain','cry','crying','fight','argue',
  'annoyed','frustrated','disappointed','lonely','gone',
  'tired','exhausted','stressed','worried','anxious','scared','fear','bad',
  'horrible','terrible','awful','sick','depressed','lost','confused','broken'
  // NOTE: 'miss'/'missing' intentionally removed — "I miss you" is POSITIVE affection
]);

const AFFECTIONATE_WORDS = new Set([
  'love','darling','babe','baby','honey','sweetheart','dear','cutie','angel',
  'princess','prince','sunshine','beautiful','handsome','miss you','need you',
  'want you','thinking of you','dream','forever','always'
]);

const DRY_INDICATORS = ['ok','okay','k','fine','yeah','yep','nope','sure','alright','hmm','oh','lol'];

// Day of week labels
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countEmojis(text) {
  const matches = text.match(EMOJI_REGEX);
  return matches ? matches.length : 0;
}

/** Extract individual emoji characters from text */
function extractEmojis(text) {
  return text.match(EMOJI_REGEX) || [];
}

function getHour(date)  { return new Date(date).getHours(); }
function getDayOfWeek(date) { return new Date(date).getDay(); } // 0=Sun, 6=Sat
function getMonth(date) { return new Date(date).toLocaleString('en-US', { month: 'short', year: '2-digit' }); }

function isLateNight(date) {
  const h = getHour(date);
  return h >= 23 || h <= 3;
}

function scoreEmotionalWords(text) {
  const lower = text.toLowerCase().split(/\s+/);
  let positive = 0, negative = 0, affectionate = 0;
  for (const w of lower) {
    if (POSITIVE_WORDS.has(w))     positive++;
    if (NEGATIVE_WORDS.has(w))     negative++;
    if (AFFECTIONATE_WORDS.has(w)) affectionate++;
  }
  return { positive, negative, affectionate };
}

function isDryMessage(text) {
  const lower = text.toLowerCase().trim();
  return DRY_INDICATORS.includes(lower) || lower.length <= 3;
}

// ─── Main Analysis ────────────────────────────────────────────────────────────
export function runLocalAnalysis(messages) {
  if (!messages || messages.length === 0) return null;

  const participants = getParticipants(messages);
  const [p1, p2] = participants;

  // ── Per-person buckets ────────────────────────────────────
  const stats = {};
  for (const p of participants) {
    stats[p] = {
      messageCount:      0,
      wordCount:         0,
      emojiCount:        0,
      dryMessages:       0,
      lateNightMessages: 0,
      longMessages:      0,   // messages > 50 chars
      emotionScore:      { positive: 0, negative: 0, affectionate: 0 },
      initiations:       0,   // times they texted first after 3+ hour gap
      hourDistribution:  Array(24).fill(0),
      dayDistribution:   Array(7).fill(0),
      monthActivity:     {},
      emojiMap:          {},  // emoji → count
    };
  }

  // ── Aggregate per message ─────────────────────────────────
  const totalReplyDelay = { [p1]: 0, [p2]: 0 };
  const replyCount      = { [p1]: 0, [p2]: 0 };
  let prevMessage       = null;

  const monthlyEmotions = {}; // { 'Jan 24': { positive, negative, affectionate, total } }

  for (const msg of messages) {
    const s = msg.sender;
    if (!stats[s]) continue; // skip unknown senders

    const st = stats[s];
    st.messageCount++;
    st.wordCount   += countWords(msg.text);
    st.emojiCount  += countEmojis(msg.text);
    if (isDryMessage(msg.text))     st.dryMessages++;
    if (isLateNight(msg.timestamp)) st.lateNightMessages++;
    if (msg.text.length > 50)       st.longMessages++;

    // Track individual emoji usage
    const emojis = extractEmojis(msg.text);
    for (const e of emojis) {
      st.emojiMap[e] = (st.emojiMap[e] || 0) + 1;
    }

    const em = scoreEmotionalWords(msg.text);
    st.emotionScore.positive    += em.positive;
    st.emotionScore.negative    += em.negative;
    st.emotionScore.affectionate += em.affectionate;

    // Active hour distribution
    const hour = getHour(msg.timestamp);
    st.hourDistribution[hour]++;

    // Day of week distribution
    const dow = getDayOfWeek(msg.timestamp);
    st.dayDistribution[dow]++;

    // Monthly activity
    const monthKey = getMonth(msg.timestamp);
    st.monthActivity[monthKey] = (st.monthActivity[monthKey] || 0) + 1;

    // Monthly emotions
    if (!monthlyEmotions[monthKey]) {
      monthlyEmotions[monthKey] = { positive: 0, negative: 0, affectionate: 0, total: 0 };
    }
    monthlyEmotions[monthKey].positive    += em.positive;
    monthlyEmotions[monthKey].negative    += em.negative;
    monthlyEmotions[monthKey].affectionate += em.affectionate;
    monthlyEmotions[monthKey].total++;

    // Reply delay (only when sender switches and gap < 24 hours)
    if (prevMessage && prevMessage.sender !== s) {
      const delay = (new Date(msg.timestamp) - new Date(prevMessage.timestamp)) / 60000;
      // Only count as reply if gap is positive and < 24 hours (avoids corrupt timestamps)
      if (delay > 0 && delay < 1440) {
        totalReplyDelay[s] += delay;
        replyCount[s]++;
      }
    }

    // Initiation: gap > 3 hours from last message = they started a new conversation
    // FIX Bug #5: Do NOT auto-credit the very first message — that biases the "who texts first"
    // metric toward whichever person happens to appear first in the export file.
    if (prevMessage) {
      const gap = (new Date(msg.timestamp) - new Date(prevMessage.timestamp)) / 3600000;
      if (gap >= 3) st.initiations++; // only gap-based initiations count
    }
    // If prevMessage is null (first message ever), we deliberately skip counting it
    // because we don't know if there was a gap — it's file start, not conversation start.

    prevMessage = msg;
  }

  // ── Computed averages ─────────────────────────────────────
  const avgReplyDelay = {};
  for (const p of participants) {
    avgReplyDelay[p] = replyCount[p] > 0
      ? parseFloat((totalReplyDelay[p] / replyCount[p]).toFixed(1))
      : null;
  }

  // ── Most active hour ──────────────────────────────────────
  const mostActiveHour = {};
  for (const p of participants) {
    const dist = stats[p].hourDistribution;
    mostActiveHour[p] = dist.indexOf(Math.max(...dist));
  }

  // ── Dry texting ratio (0–1) ───────────────────────────────
  const dryRatio = {};
  for (const p of participants) {
    const total = stats[p].messageCount;
    dryRatio[p] = total > 0 ? (stats[p].dryMessages / total) : 0;
  }

  // ── Dry texting score per person (0–100, lower = drier) ──
  const dryTextingScore = {};
  for (const p of participants) {
    // 100 = no dry messages at all, 0 = all messages are dry
    dryTextingScore[p] = Math.round((1 - dryRatio[p]) * 100);
  }

  // ── Effort balance (weighted: msg count + word count) ─────
  const effortScore = {};
  for (const p of participants) {
    effortScore[p] = (stats[p].messageCount * 0.4) + (stats[p].wordCount * 0.6);
  }

  // ── Initiation frequency (%) ─────────────────────────────
  const totalInitiations = participants.reduce((s, p) => s + stats[p].initiations, 0);
  const initiationFrequency = {};
  for (const p of participants) {
    initiationFrequency[p] = totalInitiations > 0
      ? Math.round((stats[p].initiations / totalInitiations) * 100)
      : 50;
  }

  // ── Emotion timeline (sorted months) ─────────────────────
  const allMonthKeys = Object.keys(monthlyEmotions);
  const emotionTimeline = allMonthKeys.map(month => {
    const e = monthlyEmotions[month];
    const sentiment = e.positive > e.negative ? 'warm' : e.negative > e.positive ? 'cold' : 'neutral';
    const label = e.affectionate > 1
      ? (e.positive > e.negative ? 'Affectionate ❤️' : 'Tense 😤')
      : e.positive > e.negative
        ? 'Warm 🌟'
        : e.negative > e.positive
          ? 'Distant ❄️'
          : 'Neutral 😐';
    return {
      month,
      positive:     e.positive,
      negative:     e.negative,
      affectionate: e.affectionate,
      total:        e.total,
      sentiment,
      label,
      score: Math.round(((e.positive - e.negative * 0.7) / Math.max(e.total, 1)) * 100),
    };
  });

  // ── Activity heatmap (hour × sender) ─────────────────────
  const activityByHour = Array.from({ length: 24 }, (_, hour) => {
    const obj = { hour };
    for (const p of participants) {
      obj[p] = stats[p].hourDistribution[hour] || 0;
    }
    return obj;
  });

  // ── Weekly trends (day-of-week message counts) ────────────
  const weeklyTrends = DAY_LABELS.map((day, idx) => {
    const obj = { day };
    for (const p of participants) {
      obj[p] = stats[p].dayDistribution[idx] || 0;
    }
    obj.total = participants.reduce((s, p) => s + (obj[p] || 0), 0);
    return obj;
  });

  // ── Monthly trends ────────────────────────────────────────
  const monthlyTrends = allMonthKeys.map(month => {
    const obj = { month };
    for (const p of participants) {
      obj[p] = stats[p].monthActivity[month] || 0;
    }
    obj.total = participants.reduce((s, p) => s + (obj[p] || 0), 0);
    return obj;
  });

  // ── Summary stats ─────────────────────────────────────────
  const totalMessages = messages.length;
  const totalWords    = participants.reduce((s, p) => s + stats[p].wordCount, 0);
  const totalEmojis   = participants.reduce((s, p) => s + stats[p].emojiCount, 0);

  // ── Who texts first / replies faster ─────────────────────
  const whoTextsFirst  = stats[p1].initiations >= stats[p2].initiations ? p1 : p2;
  const p1Delay = avgReplyDelay[p1] ?? Infinity;
  const p2Delay = avgReplyDelay[p2] ?? Infinity;
  const whoRepliesFast = p1Delay <= p2Delay ? p1 : p2;

  // ── Late-night chat intensity ─────────────────────────────
  const totalLateNight = participants.reduce((s, p) => s + stats[p].lateNightMessages, 0);
  const lateNightRatio = totalMessages > 0 ? totalLateNight / totalMessages : 0;

  // ── Late night score (0–100) ──────────────────────────────
  // Higher = more late-night conversations (signal of emotional closeness)
  // Scaled so ~12.5% late-night msgs = 100 (more meaningful threshold than old 25%)
  const lateNightScore = Math.round(Math.min(lateNightRatio * 800, 100));

  // ── Consistency score (0–10) ──────────────────────────────
  // Based on how evenly messages are spread across all months
  const monthCounts = Object.values(monthlyEmotions).map(e => e.total);
  const avgPerMonth = monthCounts.reduce((a, b) => a + b, 0) / Math.max(monthCounts.length, 1);
  const variance    = monthCounts.reduce((s, c) => s + Math.pow(c - avgPerMonth, 2), 0) / Math.max(monthCounts.length, 1);
  const stdDev      = Math.sqrt(variance);
  const consistencyScore = Math.max(0, Math.min(10, 10 - (stdDev / Math.max(avgPerMonth, 1)) * 5));

  // ── Conversation consistency score (0–100 for UI) ────────
  const conversationConsistencyScore = Math.round(consistencyScore * 10);

  // ── Mutual engagement score (0–100) ──────────────────────
  // How balanced the participation is between both people
  const totalMsg = stats[p1].messageCount + stats[p2].messageCount;
  const balanceRatio = totalMsg > 0
    ? Math.min(stats[p1].messageCount, stats[p2].messageCount) / Math.max(stats[p1].messageCount, stats[p2].messageCount)
    : 0.5;
  // Also factor in word balance and emoji balance
  const wordBalance  = totalWords > 0
    ? Math.min(stats[p1].wordCount, stats[p2].wordCount) / Math.max(stats[p1].wordCount, stats[p2].wordCount, 1)
    : 0.5;
  const mutualEngagementScore = Math.round(((balanceRatio * 0.6) + (wordBalance * 0.4)) * 100);

  // ── Emoji usage stats (combined top emojis) ──────────────
  const combinedEmojiMap = {};
  for (const p of participants) {
    for (const [emoji, count] of Object.entries(stats[p].emojiMap)) {
      combinedEmojiMap[emoji] = (combinedEmojiMap[emoji] || 0) + count;
    }
  }
  const topEmojis = Object.entries(combinedEmojiMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([emoji, count]) => ({ emoji, count }));

  const emojiUsageStats = {
    total: totalEmojis,
    topEmojis,
    perParticipant: Object.fromEntries(
      participants.map(p => [p, {
        count: stats[p].emojiCount,
        top: Object.entries(stats[p].emojiMap)
               .sort((a, b) => b[1] - a[1])
               .slice(0, 5)
               .map(([emoji, count]) => ({ emoji, count })),
      }])
    ),
  };

  // ── Recent message excerpts for contextual AI coaching ──
  const recentMessages = messages.slice(-30).map(m => ({
    sender: m.sender,
    text: (m.text || '').slice(0, 300),
  }));

  return {
    participants,
    totalMessages,
    totalWords,
    totalEmojis,
    stats,
    avgReplyDelay,
    mostActiveHour,
    dryRatio,
    dryTextingScore,
    effortScore,
    emotionTimeline,
    activityByHour,
    whoTextsFirst,
    whoRepliesFast,
    lateNightRatio,
    lateNightScore,
    consistencyScore,
    conversationConsistencyScore,
    mutualEngagementScore,
    emojiUsageStats,
    initiationFrequency,
    weeklyTrends,
    monthlyTrends,
    monthlyEmotions,
    recentMessages,
  };
}

// ─── Condensed summary for Gemini prompt ──────────────────────────────────────
export function buildStatsSummary(localStats) {
  const {
    participants: [p1, p2], stats, avgReplyDelay, dryRatio,
    consistencyScore, lateNightRatio, whoTextsFirst, whoRepliesFast,
    totalMessages, totalWords, mutualEngagementScore, initiationFrequency,
  } = localStats;

  return `
CHAT STATISTICS SUMMARY:
- Total messages: ${totalMessages}
- Total words: ${totalWords}
- Participants: "${p1}" and "${p2}"
- Mutual engagement score: ${mutualEngagementScore}/100

${p1}:
  - Messages: ${stats[p1].messageCount} (${Math.round(stats[p1].messageCount / totalMessages * 100)}%)
  - Avg words/message: ${(stats[p1].wordCount / Math.max(stats[p1].messageCount, 1)).toFixed(1)}
  - Emojis used: ${stats[p1].emojiCount}
  - Avg reply delay: ${avgReplyDelay[p1] ?? 'N/A'} min
  - Dry message ratio: ${(dryRatio[p1] * 100).toFixed(0)}%
  - Late-night messages: ${stats[p1].lateNightMessages}
  - Conversation initiations: ${initiationFrequency[p1]}% of sessions
  - Positive word score: ${stats[p1].emotionScore.positive}
  - Negative word score: ${stats[p1].emotionScore.negative}
  - Affectionate word score: ${stats[p1].emotionScore.affectionate}

${p2}:
  - Messages: ${stats[p2].messageCount} (${Math.round(stats[p2].messageCount / totalMessages * 100)}%)
  - Avg words/message: ${(stats[p2].wordCount / Math.max(stats[p2].messageCount, 1)).toFixed(1)}
  - Emojis used: ${stats[p2].emojiCount}
  - Avg reply delay: ${avgReplyDelay[p2] ?? 'N/A'} min
  - Dry message ratio: ${(dryRatio[p2] * 100).toFixed(0)}%
  - Late-night messages: ${stats[p2].lateNightMessages}
  - Conversation initiations: ${initiationFrequency[p2]}% of sessions
  - Positive word score: ${stats[p2].emotionScore.positive}
  - Negative word score: ${stats[p2].emotionScore.negative}
  - Affectionate word score: ${stats[p2].emotionScore.affectionate}

RELATIONSHIP DYNAMICS:
  - Who texts first more: ${whoTextsFirst}
  - Who replies faster: ${whoRepliesFast}
  - Chat consistency score: ${consistencyScore.toFixed(1)}/10
  - Late-night chat ratio: ${(lateNightRatio * 100).toFixed(0)}%
`.trim();
}

// ─── Build representative sample for AI providers ─────────────────────────────
// Selects high-signal messages across the full relationship timeline while staying
// strictly within token/character limits for free tier AI providers.
export function buildRepresentativeSample(messages, budgetChars = 32000) {
  if (!messages || messages.length === 0) return [];

  const total = messages.length;

  // Key emotional words (English + Roman Urdu/Hindi)
  const CONFLICT_WORDS = /\b(sorry|apologize|forgive|maaf|galti|fight|angry|gussa|naraz|upset|hurt|leave|ignoring|ignore|rude|hate|breakup|stop|crying|tears|problem|issue)\b/i;
  const AFFECTION_WORDS = /\b(love|pyaar|miss|missing|jaan|baby|babe|sweetheart|adore|care|forever|always|beautiful|handsome|special|heart|kiss|hug|lucky|blessed)\b/i;
  const VULNERABLE_WORDS = /\b(feel|feeling|feelings|trust|afraid|scared|darr|honestly|truth|promise|thinking of you|need you|want you|understand|lonely)\b/i;
  const DISMISSIVE_WORDS = /^(ok|okay|k|hmm|hm|yep|nope|sure|fine|theek|accha|acha|media omitted|image omitted|sticker omitted)$/i;

  // Score a message for emotional importance & relationship signal
  const scoreMsg = (msg) => {
    const text = (msg.text || '').trim();
    if (!text || DISMISSIVE_WORDS.test(text)) return -2;

    let score = 0;
    const len = text.length;

    // Substantial messages indicate emotional investment
    if (len > 140) score += 4;
    else if (len > 60) score += 2;
    else if (len < 10) score -= 1;

    // High priority: Conflict, apology, deep emotion
    if (CONFLICT_WORDS.test(text)) score += 5;
    if (AFFECTION_WORDS.test(text)) score += 4;
    if (VULNERABLE_WORDS.test(text)) score += 3;

    const em = scoreEmotionalWords(text);
    score += (em.positive + em.negative + em.affectionate);

    // Late night conversations (11 PM - 4 AM) carry higher intimacy/vulnerability
    if (isLateNight(msg.timestamp)) score += 3;

    return score;
  };

  // Small chats: use all messages directly
  if (total <= 120) {
    return messages.map(m => ({ ...m, text: (m.text || '').slice(0, 300) }));
  }

  // Budget allocations across timeline:
  // 1. Beginning Phase (First 30%): How the relationship started
  // 2. Middle Phase (Middle 40%): How communication stabilized/shifted
  // 3. Recent Phase (Last 30%): Present dynamic, latest issues & state
  const z1End   = Math.floor(total * 0.30);
  const z2Start = z1End;
  const z2End   = Math.floor(total * 0.70);
  const z3Start = z2End;

  const zones = [
    { msgs: messages.slice(0, z1End),       weight: 0.25, label: 'Beginning Phase' },
    { msgs: messages.slice(z2Start, z2End), weight: 0.35, label: 'Middle Evolution' },
    { msgs: messages.slice(z3Start),        weight: 0.40, label: 'Recent / Current Dynamic' },
  ];

  const pickedIndices = new Set();
  let usedChars = 0;

  // Always reserve and include the absolute latest 10 messages so recent context is 100% fresh
  for (let i = Math.max(0, total - 10); i < total; i++) {
    pickedIndices.add(i);
    usedChars += ((messages[i]?.text || '').slice(0, 250).length + 50);
  }

  // Sample within each zone based on emotional weight
  for (const zone of zones) {
    if (usedChars >= budgetChars) break;

    const zoneBudget = (budgetChars - usedChars) * (zone.weight / (zone.weight + 0.1));
    let zoneUsed = 0;

    // Score all messages in zone
    const scored = zone.msgs
      .map((msg) => {
        const absIdx = messages.indexOf(msg);
        return { msg, absIdx, score: scoreMsg(msg) };
      })
      .filter(item => !pickedIndices.has(item.absIdx) && item.score > 0)
      .sort((a, b) => b.score - a.score);

    for (const { msg, absIdx } of scored) {
      if (zoneUsed > zoneBudget || usedChars >= budgetChars) break;

      const preview = (msg.text || '').slice(0, 250);
      const cost = preview.length + 50;

      pickedIndices.add(absIdx);
      zoneUsed += cost;
      usedChars += cost;

      // Dialogue pairing: If this is a high-emotion text, also pull the reply if available!
      if (absIdx + 1 < total && !pickedIndices.has(absIdx + 1) && (usedChars + 150 < budgetChars)) {
        const replyMsg = messages[absIdx + 1];
        if (replyMsg && replyMsg.sender !== msg.sender) {
          pickedIndices.add(absIdx + 1);
          const replyCost = (replyMsg.text || '').slice(0, 200).length + 50;
          zoneUsed += replyCost;
          usedChars += replyCost;
        }
      }
    }
  }

  // Sort picked messages in exact chronological order to preserve real conversation flow
  const sortedSample = Array.from(pickedIndices)
    .sort((a, b) => a - b)
    .map(idx => {
      const m = messages[idx];
      return {
        ...m,
        text: (m.text || '').slice(0, 250),
        _origIdx: idx,
      };
    });

  return sortedSample;
}
