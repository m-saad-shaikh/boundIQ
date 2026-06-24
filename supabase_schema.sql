-- ═══════════════════════════════════════════════════════════════════════════
-- BondIQ — Supabase Schema & Row Level Security Migration
-- Run this in Supabase SQL Editor: https://app.supabase.com/ → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. LEADERBOARD TABLE ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaderboard (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  username     text        NOT NULL,
  partner_name text,
  score        integer     NOT NULL CHECK (score >= 0 AND score <= 100),
  rank         text,
  created_at   timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read the leaderboard (public scoreboard)
DROP POLICY IF EXISTS "leaderboard_public_read" ON leaderboard;
CREATE POLICY "leaderboard_public_read"
  ON leaderboard FOR SELECT
  USING (true);

-- Policy: anyone can add an entry (no account needed for leaderboard)
DROP POLICY IF EXISTS "leaderboard_public_insert" ON leaderboard;
CREATE POLICY "leaderboard_public_insert"
  ON leaderboard FOR INSERT
  WITH CHECK (true);

-- ── 2. SHARES TABLE ─────────────────────────────────────────────────────────
-- PRIVACY: stores ONLY the minimum data required to render a public share card.
-- NEVER stores: chat messages, AI responses, uploaded files, raw conversation data.
CREATE TABLE IF NOT EXISTS shares (
  id          text        PRIMARY KEY,               -- short 12-char random ID
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  username    text        NOT NULL,                   -- display name (e.g. "Alex & Jordan")
  score       integer     NOT NULL CHECK (score >= 0 AND score <= 100),
  status      text        NOT NULL,                   -- e.g. "Emotionally Strong"
  emoji       text        DEFAULT '❤️',
  created_at  timestamptz DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS shares_user_id_idx ON shares(user_id);
CREATE INDEX IF NOT EXISTS shares_created_at_idx ON shares(created_at DESC);

-- Enable Row Level Security
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- ── 2a. SHARES RLS POLICIES ───────────────────────────────────────────────────

-- Policy: public can VIEW any share (share pages are public URLs)
DROP POLICY IF EXISTS "shares_public_read" ON shares;
CREATE POLICY "shares_public_read"
  ON shares FOR SELECT
  USING (true);

-- Policy: authenticated users can CREATE their own shares
DROP POLICY IF EXISTS "shares_authenticated_insert" ON shares;
CREATE POLICY "shares_authenticated_insert"
  ON shares FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Ensure the user_id column matches the logged-in user
    auth.uid() = user_id
  );

-- Policy: anonymous/unauthenticated inserts are allowed for shares WITHOUT user_id
-- (fallback for users who share before authentication)
DROP POLICY IF EXISTS "shares_anon_insert" ON shares;
CREATE POLICY "shares_anon_insert"
  ON shares FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL
  );

-- Policy: authenticated users can DELETE only their own shares
DROP POLICY IF EXISTS "shares_owner_delete" ON shares;
CREATE POLICY "shares_owner_delete"
  ON shares FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
  );

-- Policy: authenticated users can UPDATE only their own shares
DROP POLICY IF EXISTS "shares_owner_update" ON shares;
CREATE POLICY "shares_owner_update"
  ON shares FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- ── 3. OPTIONAL: AUTO-DELETE OLD SHARES (requires pg_cron extension) ─────────
-- Uncomment to enable automatic cleanup of shares older than 90 days:
-- SELECT cron.schedule(
--   'delete-old-shares',
--   '0 0 * * *',
--   $$DELETE FROM shares WHERE created_at < now() - interval '90 days'$$
-- );

-- ── 4. VERIFY POLICIES ───────────────────────────────────────────────────────
-- Run this query to confirm policies are active:
-- SELECT tablename, policyname, cmd, roles FROM pg_policies
-- WHERE tablename IN ('shares', 'leaderboard')
-- ORDER BY tablename, policyname;
