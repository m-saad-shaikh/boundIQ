/**
 * LoginModal.jsx
 * Google Sign-In & Email Authentication modal for BondIQ — powered by Supabase Auth.
 * Shown when a guest user tries to generate a share link.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Shield, Mail, Lock, User, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function LoginModal({ isOpen, onClose, onSuccess, title, subtitle }) {
  const { signIn, signUpEmail, signInEmail } = useAuth();
  
  // Modes: 'choice' | 'email-login' | 'email-signup' | 'verification-sent'
  const [authMode, setAuthMode] = useState('choice');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setErrorMsg('');
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    setAuthMode('choice');
    onClose?.();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await signIn();
      // OAuth redirects the browser. If it returns immediately:
      onSuccess?.();
      handleClose();
    } catch (err) {
      setErrorMsg(err.message || 'Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Inputs Validation
    if (!email.trim() || !password) {
      setErrorMsg('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      if (authMode === 'email-signup') {
        if (!displayName.trim()) {
          setErrorMsg('Please enter your name.');
          setLoading(false);
          return;
        }
        const data = await signUpEmail(email.trim(), password, displayName.trim());
        // If data.session is null/undefined, it means email confirmation is required by Supabase
        if (data && !data.session) {
          setAuthMode('verification-sent');
        } else {
          onSuccess?.(data.user);
          handleClose();
        }
      } else {
        const data = await signInEmail(email.trim(), password);
        onSuccess?.(data.user);
        handleClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check details and try again.');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-[2rem] border border-white/10 overflow-hidden z-10"
            style={{ background: 'linear-gradient(135deg, #0d0d2b 0%, #050510 100%)' }}
          >
            {/* Glow blob */}
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }}
            />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2">
              <div className="flex items-center gap-3">
                {authMode !== 'choice' && authMode !== 'verification-sent' ? (
                  <button
                    onClick={() => { setAuthMode('choice'); setErrorMsg(''); }}
                    className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={14} />
                  </button>
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #ff2d78, #8b5cf6)' }}
                  >
                    <Heart size={18} className="text-white" fill="white" />
                  </div>
                )}
                {authMode === 'choice' && (
                  <span className="font-display font-bold text-white text-base tracking-tight">BondIQ</span>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content Switcher */}
            <div className="relative z-10 px-6 pb-8 pt-2 text-center">
              
              {/* CHOICE MODE */}
              {authMode === 'choice' && (
                <div>
                  <h2 className="font-display font-black text-2xl text-white mb-2">
                    {title || 'Sign In to Share'}
                  </h2>
                  <p className="text-white/40 text-sm mb-8 leading-relaxed">
                    {subtitle || 'Create a shareable score card and challenge your friends.'}
                  </p>

                  {errorMsg && (
                    <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-left leading-relaxed">
                      {errorMsg}
                    </div>
                  )}

                  {/* Google Login */}
                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 border border-white/15 hover:border-white/30 hover:bg-white/5 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin text-white/50" />
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span className="text-white">Continue with Google</span>
                      </>
                    )}
                  </motion.button>

                  <div className="flex items-center gap-4 my-6">
                    <div className="h-px bg-white/10 flex-1" />
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">or</span>
                    <div className="h-px bg-white/10 flex-1" />
                  </div>

                  {/* Email Login Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setAuthMode('email-login'); setErrorMsg(''); }}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 border border-white/10 hover:bg-white/5 text-white/70 hover:text-white"
                  >
                    <Mail size={16} />
                    Continue with Email
                  </motion.button>
                </div>
              )}

              {/* EMAIL LOGIN OR SIGNUP MODE */}
              {(authMode === 'email-login' || authMode === 'email-signup') && (
                <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
                  <div className="text-center mb-6">
                    <h2 className="font-display font-black text-2xl text-white mb-2">
                      {authMode === 'email-login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-white/40 text-xs">
                      {authMode === 'email-login'
                        ? 'Sign in to access your saved challenges.'
                        : 'Sign up to share your score with friends.'}
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed">
                      {errorMsg}
                    </div>
                  )}

                  {authMode === 'email-signup' && (
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={16} />
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={loading}
                        className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 focus:bg-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/30 outline-none transition-all duration-300"
                        required
                      />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={16} />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 focus:bg-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/30 outline-none transition-all duration-300"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={16} />
                    <input
                      type="password"
                      placeholder="Password (min. 6 chars)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 focus:bg-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/30 outline-none transition-all duration-300"
                      required
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm text-white transition-all duration-300 mt-2 hover:opacity-95 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #ff2d78, #8b5cf6)' }}
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin text-white" />
                    ) : authMode === 'email-login' ? (
                      'Sign In'
                    ) : (
                      'Create Account'
                    )}
                  </motion.button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setAuthMode(authMode === 'email-login' ? 'email-signup' : 'email-login');
                        setErrorMsg('');
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {authMode === 'email-login'
                        ? "Don't have an account? Sign Up"
                        : 'Already have an account? Sign In'}
                    </button>
                  </div>
                </form>
              )}

              {/* VERIFICATION SENT MODE */}
              {authMode === 'verification-sent' && (
                <div className="space-y-6 pt-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto"
                  >
                    <CheckCircle className="text-emerald-400" size={32} />
                  </motion.div>

                  <div>
                    <h2 className="font-display font-black text-xl text-white mb-2">Verify Your Email</h2>
                    <p className="text-white/50 text-sm leading-relaxed">
                      We have sent a verification link to <span className="text-white font-semibold">{email}</span>.
                    </p>
                    <p className="text-white/40 text-xs mt-3 leading-relaxed">
                      Please click the link in your inbox to confirm your email address and continue.
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    className="w-full py-3 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white transition-all duration-300"
                  >
                    Got It
                  </motion.button>
                </div>
              )}

              {/* Privacy/Info note */}
              {authMode !== 'verification-sent' && (
                <div className="flex items-center gap-2 justify-center mt-5">
                  <Shield size={11} className="text-white/20" />
                  <p className="text-white/25 text-[10px]">
                    Only your name &amp; avatar are used. No private chat data is shared.
                  </p>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
