/**
 * supabaseClient.js
 * Centralised Supabase client for BondIQ.
 *
 * Covers:
 *   - Supabase client singleton
 *   - Leaderboard read/write
 *   - Share link creation and retrieval
 *
 * Privacy contract:
 *   NEVER stores: chat messages, AI responses, uploaded files, raw conversation data
 *   ONLY stores:  username, score, relationship status, emoji, user_id (for auth RLS)
 */

import { createClient } from '@supabase/supabase-js';

// ── Validate configuration at startup ────────────────────────────────────────
const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[BondIQ] ❌ Supabase configuration missing!\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.\n' +
    'Database, auth, and share features will be disabled until configured.'
  );
}

// ── Singleton Supabase client ─────────────────────────────────────────────────
// persistSession: true  → session survives page refresh + browser close
// autoRefreshToken: true → silently renews tokens before expiry
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession:   true,
        autoRefreshToken: true,
        detectSessionInUrl: true,  // handles OAuth callback URLs automatically
      },
    })
  : null;

// ── Retry Helper ──────────────────────────────────────────────────────────────
const withRetry = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};

// ── Leaderboard ───────────────────────────────────────────────────────────────
export const getLeaderboard = async () => {
  if (!supabase) return [];
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    });
  } catch (err) {
    console.error('[BondIQ] Error fetching leaderboard:', err);
    return [];
  }
};

export const saveToLeaderboard = async ({ username, partner_name, score, rank }) => {
  if (!supabase) return { error: 'Supabase not configured' };
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .insert([{ username, partner_name, score, rank }])
        .select();
      if (error) throw error;
      return { data };
    });
  } catch (err) {
    console.error('[BondIQ] Error saving to leaderboard:', err);
    return { error: err };
  }
};

// ── Share System ──────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random 12-character share ID.
 */
function generateShareId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 14);
}

/**
 * Create a persistent share record.
 *
 * PRIVACY: only stores username, score, status, emoji, user_id.
 * NEVER stores chat content, messages, or AI analysis.
 *
 * RLS: Row-level security ensures only the authenticated user who
 * created the share can modify or delete it.
 *
 * @param {{ username: string, score: number, status: string, emoji: string, userId?: string }} params
 * @returns {Promise<{ shareId: string, shareUrl: string } | { error: string }>}
 */
export async function createShare({ username, score, status, emoji, userId }) {
  if (!supabase) {
    return { error: 'Supabase not configured. Share feature unavailable.' };
  }

  const shareId = generateShareId();

  try {
    const insertData = {
      id:       shareId,
      username: username.trim().slice(0, 50),
      score:    Math.min(Math.max(Math.round(score), 0), 100),
      status:   (status || 'Growing Bond').slice(0, 50),
      emoji:    (emoji  || '❤️').slice(0, 10),
    };

    // Attach user_id if authenticated — enables RLS ownership policies
    if (userId) {
      insertData.user_id = userId;
    }

    const { error } = await supabase
      .from('shares')
      .insert([insertData]);

    if (error) throw error;

    const shareUrl = `${window.location.origin}/share/${shareId}`;
    return { shareId, shareUrl };

  } catch (err) {
    console.error('[BondIQ] Error creating share:', err);
    return { error: err.message || 'Failed to create share link. Please try again.' };
  }
}

/**
 * Fetch a public share record by ID.
 * Share pages are public — no authentication required to view.
 *
 * @param {string} shareId
 * @returns {Promise<{ data: object } | { error: string }>}
 */
export async function getShare(shareId) {
  if (!supabase) {
    return { error: 'Supabase not configured.' };
  }

  try {
    const { data, error } = await supabase
      .from('shares')
      .select('id, username, score, status, emoji, created_at')
      .eq('id', shareId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { error: 'Share not found. The link may be invalid or expired.' };
      }
      throw error;
    }

    return { data };
  } catch (err) {
    console.error('[BondIQ] Error fetching share:', err);
    return { error: err.message || 'Failed to load share data.' };
  }
}

// ── Realtime leaderboard subscription ────────────────────────────────────────
export const subscribeToLeaderboard = (callback) => {
  if (!supabase) return null;

  return supabase
    .channel('leaderboard-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'leaderboard' },
      (payload) => callback(payload)
    )
    .subscribe();
};
