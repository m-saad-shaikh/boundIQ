/**
 * AuthContext.jsx
 * Supabase-powered authentication context for BondIQ.
 * Replaces Firebase Auth entirely.
 *
 * Provides: { user, loading, signIn, signOut }
 *
 * Session behaviour:
 *   - Session is persisted automatically by @supabase/supabase-js (localStorage)
 *   - Restored on page refresh and after browser close/reopen
 *   - Expired sessions are handled gracefully (user set to null)
 *   - Auth state changes (login / logout / token refresh) are reactive
 *
 * Usage:
 *   const { user, loading, signIn, signOut } = useAuth();
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithGoogle,
  signOut as supabaseSignOut,
  onAuthStateChange,
  normaliseUser,
  signUpWithEmail as supabaseSignUpWithEmail,
  signInWithEmail as supabaseSignInWithEmail,
} from '../lib/supabaseAuth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user is the normalised user object ({ uid, email, displayName, photoURL }) or null
  const [user,    setUser]    = useState(null);
  // loading is true until the initial session check completes
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Supabase auth state.
    // onAuthStateChange immediately fires with the current session (if any),
    // so `loading` resolves on first call without a network round-trip.
    const unsubscribe = onAuthStateChange((supabaseUser) => {
      setUser(normaliseUser(supabaseUser));
      setLoading(false);
    });

    // Cleanup subscription when component unmounts
    return unsubscribe;
  }, []);

  /**
   * Sign in with Google.
   * Triggers Supabase OAuth redirect — page will redirect to Google and back.
   */
  const signIn = useCallback(async () => {
    await signInWithGoogle();
    // Note: the user state is set reactively via onAuthStateChange
    // after the OAuth redirect completes — no need to return a value here.
  }, []);

  /**
   * Sign up with email.
   */
  const signUpEmail = useCallback(async (email, password, displayName) => {
    const data = await supabaseSignUpWithEmail(email, password, displayName);
    return data;
  }, []);

  /**
   * Sign in with email.
   */
  const signInEmail = useCallback(async (email, password) => {
    const data = await supabaseSignInWithEmail(email, password);
    return data;
  }, []);

  /**
   * Sign out the current user.
   * Clears the Supabase session and updates local state immediately.
   */
  const signOutUser = useCallback(async () => {
    await supabaseSignOut();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    signIn,
    signUpEmail,
    signInEmail,
    signOut: signOutUser,
    // Convenience flag — true when Supabase is properly configured
    isConfigured: !!user || !loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
