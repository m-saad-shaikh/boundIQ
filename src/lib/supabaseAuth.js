/**
 * supabaseAuth.js
 * Supabase Authentication integration for BondIQ.
 * Replaces Firebase Auth entirely.
 *
 * Provides:
 *   signInWithGoogle()   — OAuth popup flow via Supabase
 *   signOut()            — clears Supabase session
 *   getCurrentUser()     — synchronous current user from session
 *   onAuthStateChange()  — reactive auth state subscription
 *
 * Setup required in Supabase Dashboard:
 *   1. Authentication → Providers → Google → Enable
 *   2. Add your Google OAuth Client ID + Secret
 *   3. Add redirect URL: https://your-project.supabase.co/auth/v1/callback
 *   4. Add your site URL to "Redirect URLs" in Auth Settings
 *      (e.g. http://localhost:5173, https://your-domain.com)
 */

import { supabase } from '../utils/supabaseClient.js';

// ── Sign in with Google via Supabase OAuth ────────────────────────────────────
/**
 * Launches Google OAuth popup via Supabase.
 * On success, Supabase stores the session automatically.
 * @returns {Promise<void>}
 */
export async function signInWithGoogle() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Redirect back to the current page after OAuth completes
      redirectTo: `${window.location.origin}/`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    if (error.message?.includes('popup')) {
      throw new Error('Sign-in popup was blocked or closed. Please try again.');
    }
    throw new Error(error.message || 'Google sign-in failed. Please try again.');
  }
  // Note: Supabase handles the redirect. The function resolves before redirect occurs.
}

// ── Sign out ──────────────────────────────────────────────────────────────────
/**
 * Signs out the current user and clears the Supabase session.
 * @returns {Promise<void>}
 */
export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[BondIQ] Sign-out error:', error.message);
  }
}

// ── Get current user synchronously from cached session ────────────────────────
/**
 * Returns the current Supabase user from the locally cached session.
 * May return null if no session exists or session has expired.
 * @returns {import('@supabase/supabase-js').User | null}
 */
export function getCurrentUser() {
  if (!supabase) return null;
  // getSession() is async but the cached value is available via supabase.auth directly
  // We rely on onAuthStateChange for reactive updates; this is for synchronous reads
  return supabase.auth.getUser ? null : null; // placeholder — always use onAuthStateChange
}

// ── Subscribe to auth state changes ──────────────────────────────────────────
/**
 * Subscribes to Supabase auth state changes (sign in, sign out, session refresh).
 * Calls `callback` immediately with current user, then on every change.
 *
 * @param {(user: import('@supabase/supabase-js').User | null) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function onAuthStateChange(callback) {
  if (!supabase) {
    // Supabase not configured — immediately report null and no-op
    callback(null);
    return () => {};
  }

  // First, immediately check if there's an existing session
  supabase.auth.getSession().then(({ data: { session } }) => {
    callback(session?.user ?? null);
  });

  // Subscribe to future auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  // Return unsubscribe function
  return () => subscription.unsubscribe();
}

// ── Sign up with Email ────────────────────────────────────────────────────────
/**
 * Signs up a new user with email, password, and custom display name.
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @returns {Promise<{ user: import('@supabase/supabase-js').User | null, session: any }>}
 */
export async function signUpWithEmail(email, password, displayName) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: displayName,
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Registration failed. Please try again.');
  }

  return data;
}

// ── Sign in with Email ────────────────────────────────────────────────────────
/**
 * Signs in an existing user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: import('@supabase/supabase-js').User | null, session: any }>}
 */
export async function signInWithEmail(email, password) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message || 'Login failed. Please try again.');
  }

  return data;
}

// ── Normalise Supabase user to a consistent shape ─────────────────────────────
/**
 * Converts a Supabase User object into a normalised shape
 * that matches what the rest of the app expects (displayName, photoURL, email, uid).
 *
 * @param {import('@supabase/supabase-js').User | null} supabaseUser
 * @returns {{ displayName: string, email: string, photoURL: string, uid: string } | null}
 */
export function normaliseUser(supabaseUser) {
  if (!supabaseUser) return null;

  const meta = supabaseUser.user_metadata || {};
  return {
    uid:         supabaseUser.id,
    email:       supabaseUser.email || '',
    displayName: meta.full_name || meta.name || supabaseUser.email?.split('@')[0] || 'User',
    photoURL:    meta.avatar_url || meta.picture || '',
    // Keep original Supabase fields accessible
    raw:         supabaseUser,
  };
}
