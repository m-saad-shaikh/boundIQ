/**
 * AIChatCoach.jsx
 * Interactive AI Chat Coach panel for BondIQ.
 * Shown only when aiUsed === true (API key was used for analysis).
 *
 * Features:
 * - Suggested quick questions (Should I apologize? How can I communicate better? etc.)
 * - Full conversational chat UI with message history
 * - Typing indicator with animated dots
 * - Auto-scroll to latest message
 * - Error handling + quota exceeded state
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Send, Sparkles, Bot, User,
  ChevronDown, RefreshCw, X, Lightbulb,
} from 'lucide-react';
import { chatWithCoach } from '../../utils/ai/chatCoachProvider.js';

// ─── Suggested starter questions ─────────────────────────────────────────────
const SUGGESTED_QUESTIONS = [
  { icon: '🤝', text: 'Should I apologize for anything?' },
  { icon: '💬', text: 'How can I communicate better?' },
  { icon: '📉', text: 'Why did our conversations reduce?' },
  { icon: '❤️', text: 'How deep is our emotional connection?' },
  { icon: '⚠️', text: 'What are the red flags in our chats?' },
  { icon: '🌱', text: 'How can we grow closer?' },
];

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-purple-400"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// ─── Single chat bubble ───────────────────────────────────────────────────────
function ChatBubble({ message, isLast }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isUser
            ? 'bg-gradient-to-br from-pink-500 to-purple-600'
            : 'bg-gradient-to-br from-purple-600 to-cyan-500'
        }`}
      >
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/20 text-white/90 rounded-tr-sm'
            : 'bg-white/[0.05] border border-white/8 text-white/80 rounded-tl-sm'
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

// ─── Main AIChatCoach component ───────────────────────────────────────────────
export default function AIChatCoach({ aiResult, localStats, provider, apiKey }) {
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [isTyping,    setIsTyping]    = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error,       setError]       = useState('');
  const [hasStarted,  setHasStarted]  = useState(false);

  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);
  const messagesRef  = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text?.trim() || input.trim();
    if (!trimmed || isTyping) return;

    setError('');
    setHasStarted(true);
    setIsCollapsed(false);

    const userMsg = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      // Build history for the API (only user/assistant pairs)
      const history = newMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const reply = await chatWithCoach({
        provider: provider || 'gemini',
        apiKey,
        messages: history,
        aiResult,
        localStats,
      });

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: reply },
      ]);
    } catch (err) {
      const msg = err.message === 'QUOTA_EXCEEDED'
        ? 'Quota exceeded for your AI provider. Please try again later or switch providers.'
        : err.message || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsTyping(false);
    }
  }, [input, messages, isTyping, provider, apiKey, aiResult, localStats]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setError('');
    setHasStarted(false);
    setInput('');
  };

  const [p1, p2] = localStats?.participants || ['Person 1', 'Person 2'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="glass rounded-3xl overflow-hidden"
      style={{ border: '1px solid rgba(139,92,246,0.2)' }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer select-none"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.06))',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
        onClick={() => setIsCollapsed(v => !v)}
      >
        <div className="flex items-center gap-3">
          {/* Animated icon */}
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}
          >
            <MessageCircle size={18} className="text-white" fill="currentColor" />
          </motion.div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-white text-base">AI Chat Coach</h2>
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.2))',
                  border: '1px solid rgba(139,92,246,0.3)',
                  color: '#a78bfa',
                }}
              >
                <Sparkles size={9} />
                AI Powered
              </div>
            </div>
            <p className="text-white/35 text-xs">
              Ask anything about {p1} &amp; {p2}'s relationship
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasStarted && (
            <button
              onClick={(e) => { e.stopPropagation(); resetChat(); }}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              title="Reset chat"
            >
              <RefreshCw size={13} className="text-white/40" />
            </button>
          )}
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={18} className="text-white/30" />
          </motion.div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="chat-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            {/* Messages area */}
            <div
              ref={messagesRef}
              className="overflow-y-auto px-5 py-4 flex flex-col gap-4"
              style={{ maxHeight: '420px', minHeight: hasStarted ? '200px' : '0px' }}
            >
              {/* Welcome state */}
              {!hasStarted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-2"
                >
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                       style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.1))', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <Lightbulb size={22} className="text-purple-400" />
                  </div>
                  <p className="text-white/50 text-sm mb-1">Your personal relationship advisor</p>
                  <p className="text-white/25 text-xs">
                    Based on the full analysis of {p1} &amp; {p2}'s conversation
                  </p>
                </motion.div>
              )}

              {/* Chat messages */}
              {messages.map((msg, i) => (
                <ChatBubble key={i} message={msg} isLast={i === messages.length - 1} />
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                       style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-white/[0.05] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                    <TypingDots />
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20"
                >
                  <X size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300/80 text-sm leading-relaxed">{error}</p>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ── Suggested questions ──────────────────────────────────────── */}
            {!hasStarted && (
              <div className="px-5 pb-4">
                <p className="text-white/25 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Lightbulb size={11} className="text-purple-400" />
                  Suggested Questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => sendMessage(q.text)}
                      disabled={isTyping}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 disabled:opacity-40"
                      style={{
                        background: 'rgba(139,92,246,0.08)',
                        border: '1px solid rgba(139,92,246,0.2)',
                        color: 'rgba(167,139,250,0.9)',
                      }}
                    >
                      <span>{q.icon}</span>
                      <span>{q.text}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Input bar ────────────────────────────────────────────────── */}
            <div
              className="px-4 py-3 flex items-end gap-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  id="chat-coach-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about this relationship…"
                  rows={1}
                  disabled={isTyping}
                  className="w-full resize-none rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    minHeight: '46px',
                    maxHeight: '120px',
                    lineHeight: '1.5',
                  }}
                  onInput={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onFocus={e => {
                    e.target.style.border = '1px solid rgba(139,92,246,0.4)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.08)';
                  }}
                  onBlur={e => {
                    e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <motion.button
                id="chat-coach-send"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  boxShadow: input.trim() ? '0 4px 20px rgba(139,92,246,0.4)' : 'none',
                }}
              >
                <Send size={16} className="text-white" />
              </motion.button>
            </div>

            {/* Footer note */}
            <div className="px-5 py-2 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
              <p className="text-white/15 text-[10px]">
                Responses are based on the chat analysis and AI provider selected · Private &amp; not stored
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
