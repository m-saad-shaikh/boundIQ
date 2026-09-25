/**
 * chatParser.js
 * Parses raw chat text from WhatsApp, Telegram, Instagram, and plain text.
 * Normalized into: { sender, text, timestamp: Date, platform }
 *
 * Task 5 improvements:
 *   - Better participant ranking (count messages, top 2 real users)
 *   - Instagram DM export support
 *   - Stricter system message filtering
 *   - Handles WhatsApp ~ prefix (broadcast names)
 *   - Handles media/deleted message patterns more robustly
 */

// ─── WhatsApp Patterns ────────────────────────────────────────────────────────
// Format A: [12/12/25, 10:30 PM] Saad: Hello
const WA_PATTERN_1 = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s+(.+?):\s([\s\S]*)/i;

// Format B: 12/12/25, 10:30 PM - Saad: Hello
const WA_PATTERN_2 = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*-\s*(.+?):\s([\s\S]*)/i;

// Format C: 12/12/2025, 10:30 - Saad: Hello
const WA_PATTERN_3 = /^(\d{1,2}\/\d{1,2}\/\d{4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(.+?):\s([\s\S]*)/i;

// Format D: Generic fallback — now captures date+time+sender+text for proper timestamps
// Matches: "12.01.25 10:30 - Sender: text" or "12-01-25, 10:30AM - Sender: text"
const WA_GENERIC = /^([\d.\/-]{6,12}),?\s+([\d:]{4,8}(?:\s*[AP]M)?)\s*[-–]\s*(.+?):\s([\s\S]*)/i;

// ─── Telegram Text Export ─────────────────────────────────────────────────────
// "Sender Name, [12 Jan 2024 at 10:30]:"
const TG_SENDER_PATTERN = /^([A-Za-z][\w\s.-]+),\s*\[(\d{1,2}\s+\w+\s+\d{4})\s+at\s+(\d{1,2}:\d{2}(?::\d{2})?)\]:/;

// ─── Instagram Export Pattern ─────────────────────────────────────────────────
// Instagram exports look like:
// "Saad\n10:30 PM\nHello there"  or  "Saad 10:30 PM\nMessage"
const IG_SENDER_TIME = /^(.+?)\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s*$/i;

// ─── System Message Patterns ──────────────────────────────────────────────────
const SYSTEM_PATTERNS = [
  /messages and calls are end-to-end encrypted/i,
  /this message was deleted/i,
  /you deleted this message/i,
  /<media omitted>/i,
  /missed voice call/i,
  /missed video call/i,
  /voice call/i,
  /video call/i,
  /changed the group/i,
  /added you/i,
  /created group/i,
  /security code changed/i,
  /\u202f?null$/,
  /^\+?\d[\d\s()-]{7,}$/, // pure phone numbers as sender
];

// ─── Date-like line detector ──────────────────────────────────────────────────
const DATE_LIKE = /^[\d\[][^\w]*[\d.\/\s,:-]{5,25}/;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDate(dateStr, timeStr) {
  try {
    if (!dateStr || !timeStr) return null; // Return null instead of new Date() on no input
    const combined = `${dateStr} ${timeStr}`.replace(/[\[\]]/g, '');
    const d = new Date(combined);
    if (!isNaN(d) && d.getFullYear() > 2000) return d;

    // Try DD/MM/YYYY → MM/DD/YYYY swap
    const parts = dateStr.split(/[\/\.\-]/);
    if (parts.length === 3) {
      const swapped = `${parts[1]}/${parts[0]}/${parts[2]}`;
      const d2 = new Date(`${swapped} ${timeStr}`);
      if (!isNaN(d2) && d2.getFullYear() > 2000) return d2;
    }
  } catch (_) { /* ignore */ }
  // Return null on parse failure so callers can handle gracefully
  console.warn('[BondIQ] Date parse failed for:', dateStr, timeStr);
  return null;
}

function isSystemMessage(text) {
  if (!text) return true;
  return SYSTEM_PATTERNS.some(pattern => pattern.test(text));
}

// ─── WhatsApp Parser ──────────────────────────────────────────────────────────
function parseWhatsApp(lines) {
  const messages = [];
  let current = null;

  for (const line of lines) {
    const raw = line.trim();
    if (!raw) continue;

    const match = WA_PATTERN_1.exec(raw)
               || WA_PATTERN_2.exec(raw)
               || WA_PATTERN_3.exec(raw)
               || WA_GENERIC.exec(raw);

    if (match) {
      if (current) messages.push(current);

      if (match.length === 5) {
        // Generic pattern now has 4 capture groups: date, time, sender, text
        let [, dateStr, timeStr, sender, text] = match;
        sender = sender.replace(/^~/, '').trim();
        if (DATE_LIKE.test(sender) || sender.length > 30) continue;
        const ts = parseDate(dateStr, timeStr);
        current = {
          sender,
          text:      text.trim(),
          timestamp: ts || new Date(), // fallback to now only if parse truly fails
          platform:  'whatsapp',
        };
      } else {
        // Full pattern (4 capture groups: date, time, sender, text)
        let [, dateStr, timeStr, sender, text] = match;
        sender = sender.replace(/^~/, '').trim();
        const ts = parseDate(dateStr, timeStr);
        current = {
          sender,
          text:      text.trim(),
          timestamp: ts || new Date(),
          platform:  'whatsapp',
        };
      }
    } else if (current) {
      // Continuation line for multi-line messages
      current.text += ' ' + raw;
    } else {
      // Manual fallback: split on " - " separator
      const parts = raw.split(/ [-–] /);
      if (parts.length >= 2) {
        const secondPart = parts[1].trim();
        const colonIdx = secondPart.indexOf(': ');
        if (colonIdx !== -1) {
          const sender = secondPart.slice(0, colonIdx).replace(/^~/, '').trim();
          const text   = secondPart.slice(colonIdx + 2).trim();
          if (sender && text && !DATE_LIKE.test(sender) && sender.length <= 30) {
            current = { sender, text, timestamp: new Date(), platform: 'whatsapp' };
          }
        }
      }
    }
  }
  if (current) messages.push(current);
  return messages;
}

// ─── Telegram Text Parser ─────────────────────────────────────────────────────
function parseTelegram(lines) {
  const messages = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    const match = TG_SENDER_PATTERN.exec(line);
    if (match) {
      const [, sender, dateStr, timeStr] = match;
      const text = lines[i + 1] ? lines[i + 1].trim() : '';
      messages.push({
        sender:    sender.trim(),
        text,
        timestamp: parseDate(dateStr, timeStr),
        platform:  'telegram',
      });
      i += 2;
    } else {
      i++;
    }
  }
  return messages;
}

// ─── Instagram Parser ─────────────────────────────────────────────────────────
// Instagram exported DMs typically appear as multi-line blocks:
// SenderName
// Sep 15, 2024 10:30 PM   ← Full timestamp (HTML export) - BEST case
// 10:30 PM                ← Time only (text export) - need to derive date
// Message text here
//
// IMPORTANT: Instagram text exports often lack real dates.
// We use a deterministic spread: messages go from ~90 days ago → today
// based on their position in the file (oldest first = top of file).
// This is NOT perfect but far better than random 30–330 second gaps.

// Date header pattern in Instagram HTML exports: "Sep 15, 2024" or "September 15, 2024"
const IG_DATE_HEADER = /^([A-Za-z]+ \d{1,2},?\s*\d{4})\s*$/;
// Full Instagram timestamp: "Sep 15, 2024 10:30 PM"
const IG_FULL_TIMESTAMP = /^([A-Za-z]+\s+\d{1,2},?\s*\d{4})\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s*$/i;

function parseInstagram(lines) {
  const messages = [];
  let i = 0;
  let lastKnownDate = null; // Track date headers from Instagram HTML exports

  // Estimate spread: if no real dates, spread messages over ~90 days
  // Count total messages first for spacing
  let estimatedMsgCount = 0;
  for (let j = 0; j < lines.length - 2; j++) {
    const l = lines[j].trim();
    const next = lines[j + 1] ? lines[j + 1].trim() : '';
    if (l && l.length <= 40 && !DATE_LIKE.test(l)) {
      if (/^\d{1,2}:\d{2}\s*(AM|PM)/i.test(next)) estimatedMsgCount++;
    }
  }
  // Spread messages over 90 days ending at today
  const SPREAD_MS = 90 * 24 * 60 * 60 * 1000;
  const endTime = Date.now();
  const startTime = endTime - SPREAD_MS;
  const msgStep = estimatedMsgCount > 1 ? SPREAD_MS / (estimatedMsgCount - 1) : 3600000;
  let msgIndex = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }

    // Check for date header (Instagram HTML export includes these)
    const dateHeaderMatch = IG_DATE_HEADER.exec(line);
    if (dateHeaderMatch) {
      const parsedDate = new Date(dateHeaderMatch[1]);
      if (!isNaN(parsedDate)) {
        lastKnownDate = parsedDate;
      }
      i++;
      continue;
    }

    // Check for full Instagram timestamp "Sep 15, 2024 10:30 PM"
    const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
    const fullTsMatch = IG_FULL_TIMESTAMP.exec(nextLine);

    if (fullTsMatch && line.length <= 40 && !DATE_LIKE.test(line)) {
      // Current line = sender, next = full timestamp, after = message
      const sender  = line;
      const msgLine = lines[i + 2] ? lines[i + 2].trim() : '';
      if (msgLine && msgLine.length > 0) {
        const ts = parseDate(fullTsMatch[1], fullTsMatch[2]);
        messages.push({
          sender,
          text:      msgLine,
          timestamp: ts || new Date(startTime + msgIndex * msgStep),
          platform:  'instagram',
        });
        msgIndex++;
        i += 3;
        continue;
      }
    }

    // Check for time-only line (no date available)
    const timeOnlyMatch = IG_SENDER_TIME.exec(nextLine) || /^\d{1,2}:\d{2}\s*(AM|PM)/i.exec(nextLine);
    if (timeOnlyMatch && line.length <= 40 && !DATE_LIKE.test(line)) {
      const sender  = line;
      const msgLine = lines[i + 2] ? lines[i + 2].trim() : '';
      if (msgLine && msgLine.length > 0) {
        let ts;
        if (lastKnownDate) {
          // Use the last seen date header + the time from this line
          const timeStr = nextLine;
          const dateStr = lastKnownDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          ts = parseDate(dateStr, timeStr);
        }
        // Fallback: deterministic sequential timestamp (much better than random!)
        messages.push({
          sender,
          text:      msgLine,
          timestamp: ts || new Date(startTime + msgIndex * msgStep),
          platform:  'instagram',
        });
        msgIndex++;
        i += 3;
        continue;
      }
    }
    i++;
  }
  return messages;
}


// ─── Plain Text Parser ────────────────────────────────────────────────────────
function parsePlainText(lines) {
  const messages = [];
  const senderPattern = /^([^:\-\[\]]{1,30})[:\-]\s*(.+)/;
  let baseTime = Date.now() - lines.length * 60000;

  for (const line of lines) {
    const raw = line.trim();
    if (!raw) continue;

    // Skip lines that start with a date
    if (DATE_LIKE.test(raw)) {
      const afterSeparator = raw.split(/ [-–] /)[1] || raw.split(', ')[1];
      if (afterSeparator) {
        const match = senderPattern.exec(afterSeparator);
        if (match) {
          const [, sender, text] = match;
          messages.push({ sender: sender.trim(), text: text.trim(), timestamp: new Date(baseTime), platform: 'plain' });
          baseTime += 60000;
          continue;
        }
      }
      continue;
    }

    const match = senderPattern.exec(raw);
    if (match) {
      const [, sender, text] = match;
      if (/^\d+$/.test(sender) || sender.length > 25 || DATE_LIKE.test(sender)) continue;

      messages.push({
        sender:    sender.trim(),
        text:      text.trim(),
        timestamp: new Date(baseTime),
        platform:  'plain',
      });
      baseTime += 60000 + Math.random() * 300000;
    }
  }
  return messages;
}

// ─── Format Detector ──────────────────────────────────────────────────────────
export function detectFormat(rawText) {
  const sample = rawText.slice(0, 3000);
  if (WA_PATTERN_1.test(sample) || WA_PATTERN_2.test(sample) || WA_PATTERN_3.test(sample)) {
    return 'whatsapp';
  }
  if (TG_SENDER_PATTERN.test(sample)) return 'telegram';
  // Instagram heuristic: look for short name lines followed by time patterns
  if (IG_SENDER_TIME.test(sample)) return 'instagram';
  return 'plain';
}

// ─── Main Parser ──────────────────────────────────────────────────────────────
export function parseChat(rawText, forceFormat = null) {
  const lines  = rawText.split('\n');
  const format = forceFormat || detectFormat(rawText);

  let messages = [];
  switch (format) {
    case 'whatsapp':  messages = parseWhatsApp(lines);  break;
    case 'telegram':  messages = parseTelegram(lines);   break;
    case 'instagram': messages = parseInstagram(lines);  break;
    default:          messages = parsePlainText(lines);  break;
  }

  // ── Filter system / media / deleted messages ──────────────
  messages = messages.filter(m =>
    m.text &&
    m.text.length > 0 &&
    !isSystemMessage(m.text) &&
    !isSystemMessage(m.sender) &&
    !m.sender.toLowerCase().includes('system') &&
    m.sender.trim().length > 0
  );

  // ── Sort by timestamp ─────────────────────────────────────
  messages.sort((a, b) => a.timestamp - b.timestamp);

  return { messages, format };
}

// ─── Get Top 2 Participants ────────────────────────────────────────────────────
// Ranks senders by message count, returns the top 2 real participants.
// Ignores senders with very few messages (likely system bots or quoted names).
export function getParticipants(messages) {
  if (!messages || messages.length === 0) return ['Person 1', 'Person 2'];

  // Count messages per sender
  const counts = {};
  for (const m of messages) {
    if (!m.sender || m.sender.trim().length === 0) continue;
    const s = m.sender.trim();
    counts[s] = (counts[s] || 0) + 1;
  }

  // Sort by count descending
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) return ['Person 1', 'Person 2'];

  // Filter out senders with < 3% of total messages (noise filter)
  const totalMsg = messages.length;
  const threshold = Math.max(3, Math.floor(totalMsg * 0.03));
  const real = sorted.filter(([, count]) => count >= threshold);

  // Return top 2
  const top2 = (real.length >= 2 ? real : sorted).slice(0, 2).map(([name]) => name);

  if (top2.length === 1) top2.push('Partner');
  if (top2.length === 0) return ['Person 1', 'Person 2'];

  return top2;
}

// ─── Get Participant Stats (for preview display) ───────────────────────────────
export function getParticipantStats(messages) {
  const counts = {};
  for (const m of messages) {
    if (!m.sender || m.sender.trim().length === 0) continue;
    const s = m.sender.trim();
    counts[s] = (counts[s] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / messages.length) * 100),
    }));
}
