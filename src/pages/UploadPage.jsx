/**
 * UploadPage.jsx
 * Chat upload/paste interface.
 * 
 * Updates:
 *   Task 5: Participant preview + confirmation step
 *   Task 8: API key show/hide, test connection, remove key (localStorage)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Clipboard, Heart, ArrowLeft, Sparkles,
  Eye, EyeOff, Key, AlertCircle, CheckCircle2, MessageSquare,
  X, ExternalLink, Copy, CheckCheck, Wifi, WifiOff, Trash2, Loader2,
} from 'lucide-react';
import LoadingScreen from '../components/analysis/LoadingScreen.jsx';
import ParticipantConfirm from '../components/analysis/ParticipantConfirm.jsx';
import { parseChat, getParticipantStats } from '../utils/chatParser.js';
import { PROVIDERS, KEY_VALIDATORS, validateApiKey, testConnection } from '../utils/ai/index.js';

// ── API Key Guide Steps ────────────────────────────────────────────────────────
const API_STEPS = [
  {
    number: '01', title: 'Open Google AI Studio',
    description: 'Go to aistudio.google.com and sign in with your Google account. It is completely free.',
    link: 'https://aistudio.google.com/app/apikey', linkLabel: 'Open AI Studio →', emoji: '🌐', color: 'cyan',
  },
  {
    number: '02', title: 'Click "Create API Key"',
    description: 'On the left sidebar click "Get API Key", then click the blue "Create API Key" button.',
    emoji: '🔑', color: 'gold',
  },
  {
    number: '03', title: 'Select a Project',
    description: 'Choose an existing Google Cloud project or click "Create API key in new project".',
    emoji: '📁', color: 'purple',
  },
  {
    number: '04', title: 'Copy Your API Key',
    description: 'Your key looks like "AIzaSy...". Click the copy icon next to it. Keep it private.',
    emoji: '📋', color: 'pink',
  },
  {
    number: '05', title: 'Paste it Below',
    description: 'Come back here and paste your key in the Gemini API Key field below.',
    emoji: '✅', color: 'green',
  },
];

const STEP_COLORS = {
  cyan:   { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20',   text: 'text-cyan-400',   num: 'bg-cyan-500/20 text-cyan-300' },
  gold:   { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  text: 'text-amber-400',  num: 'bg-amber-500/20 text-amber-300' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', num: 'bg-purple-500/20 text-purple-300' },
  pink:   { bg: 'bg-pink-500/10',   border: 'border-pink-500/20',   text: 'text-pink-400',   num: 'bg-pink-500/20 text-pink-300' },
  green:  { bg: 'bg-emerald-500/10',border: 'border-emerald-500/20',text: 'text-emerald-400',num: 'bg-emerald-500/20 text-emerald-300' },
};

// ── API Key Guide Modal ────────────────────────────────────────────────────────
function ApiKeyGuideModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const url = 'https://aistudio.google.com/app/apikey';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,5,16,0.85)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10"
        style={{ background: 'linear-gradient(135deg, #0d0d2b, #0a0a1e)' }}
      >
        <div className="sticky top-0 flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5"
             style={{ background: 'linear-gradient(135deg, #0d0d2b, #0a0a1e)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Key size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg">Get Your API Key</h2>
              <p className="text-white/30 text-xs">Free — 5 easy steps</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
            <span className="text-cyan-400 text-xs font-mono flex-1 truncate">{url}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex-shrink-0"
            >
              {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex-shrink-0">
              <ExternalLink size={13} />
              Open
            </a>
          </div>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-3 mt-2">
          {API_STEPS.map((step, i) => {
            const c = STEP_COLORS[step.color];
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                className={`flex gap-4 p-4 rounded-2xl border ${c.bg} ${c.border}`}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-display ${c.num}`}>{step.number}</div>
                  {i < API_STEPS.length - 1 && <div className="w-px flex-1 bg-white/5 min-h-[20px]" />}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{step.emoji}</span>
                    <p className={`font-display font-semibold text-sm ${c.text}`}>{step.title}</p>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">{step.description}</p>
                  {step.link && (
                    <a href={step.link} target="_blank" rel="noopener noreferrer"
                       className={`inline-flex items-center gap-1 mt-2 text-xs ${c.text} hover:opacity-80 transition-opacity font-medium`}>
                      <ExternalLink size={11} />
                      {step.linkLabel}
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ff2d78)' }}>
            Got my key — Let me paste it! ✓
          </button>
          <p className="text-center text-white/20 text-xs mt-3">🔒 Your API key is never stored on any server</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Platform Selector ──────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: 'auto',      label: 'Auto Detect', emoji: '✨' },
  { id: 'whatsapp',  label: 'WhatsApp',    emoji: '💬' },
  { id: 'telegram',  label: 'Telegram',    emoji: '✈️' },
  { id: 'instagram', label: 'Instagram',   emoji: '📸' },
  { id: 'plain',     label: 'Plain Text',  emoji: '📄' },
];

// ── Sample Chat ────────────────────────────────────────────────────────────────
const SAMPLE_CHAT = `[01/01/2024, 10:00:00 AM] Alex: Hey! Happy New Year! 🎉
[01/01/2024, 10:02:00 AM] Jordan: Happy New Year!! 🥳 Hope it's amazing for you!
[01/01/2024, 10:05:00 AM] Alex: Same to you ❤️ What are your plans for today?
[01/01/2024, 10:08:00 AM] Jordan: Just staying in with family, you?
[01/01/2024, 10:10:00 AM] Alex: Same haha. Miss you though 😊
[01/01/2024, 10:12:00 AM] Jordan: Aww miss you too! When can we meet?
[01/01/2024, 11:30:00 AM] Alex: Maybe next weekend? I'd love that
[01/01/2024, 11:35:00 AM] Jordan: YES! Let's plan something special 💕
[01/02/2024, 09:15:00 AM] Alex: Good morning! ☀️ How did you sleep?
[01/02/2024, 09:20:00 AM] Jordan: Pretty good! Dreamed about our last trip lol
[01/02/2024, 09:22:00 AM] Alex: That trip was so good 😍 We should do it again
[01/02/2024, 09:25:00 AM] Jordan: Absolutely! I've been thinking about it too
[01/02/2024, 02:00:00 PM] Alex: How's your day going?
[01/02/2024, 02:45:00 PM] Jordan: Hectic honestly. Work stuff 😮‍💨
[01/02/2024, 02:47:00 PM] Alex: Aw, hang in there! You've got this 💪
[01/02/2024, 02:50:00 PM] Jordan: Thanks, you always know what to say ❤️
[01/03/2024, 11:00:00 PM] Alex: Still awake?
[01/03/2024, 11:05:00 PM] Jordan: Yeah couldn't sleep. Thinking too much
[01/03/2024, 11:07:00 PM] Alex: Want to talk about it?
[01/03/2024, 11:10:00 PM] Jordan: Not really but thanks for checking 😊
[01/04/2024, 08:30:00 AM] Jordan: Good morning! ☀️
[01/04/2024, 08:45:00 AM] Alex: Morning! Sorry was in a meeting
[01/04/2024, 08:47:00 AM] Jordan: No worries! Hope it went well
[01/05/2024, 03:00:00 PM] Alex: Hey, I was thinking about you 💭
[01/05/2024, 03:15:00 PM] Jordan: That's sweet 🥺 What were you thinking?
[01/05/2024, 03:18:00 PM] Alex: Just how lucky I am to have you in my life
[01/05/2024, 03:20:00 PM] Jordan: Stop you're gonna make me cry 😭❤️`;

// ── Main Component ─────────────────────────────────────────────────────────────
export default function UploadPage({ analysis, apiKey, setApiKey, provider, setProvider }) {
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [chatText,          setChatText]          = useState('');
  const [platform,          setPlatform]          = useState('auto');
  const [dragOver,          setDragOver]          = useState(false);
  const [showKey,           setShowKey]           = useState(false);
  const [showApiGuide,      setShowApiGuide]      = useState(false);
  const [tab,               setTab]               = useState('paste');
  const [fileInfo,          setFileInfo]          = useState(null);
  const [testStatus,        setTestStatus]        = useState('idle'); // idle | testing | ok | fail
  const [testMsg,           setTestMsg]           = useState('');
  // Task 5: participant detection state
  const [participantStats,  setParticipantStats]  = useState(null);
  const [confirmedNames,    setConfirmedNames]    = useState(null);
  const [showParticipants,  setShowParticipants]  = useState(false);

  const { stage, progress, stageLabel, error, analyze, reset, isLoading } = analysis;

  // ── Auto-navigate when done ────────────────────────────────
  useEffect(() => {
    if (analysis.isDone) navigate('/results');
  }, [analysis.isDone, navigate]);

  // ── File handler ───────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Please use a file under 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setChatText(e.target.result);
      setFileInfo({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' });
      setTab('paste');
      // Reset participant detection when new file loaded
      setParticipantStats(null);
      setConfirmedNames(null);
      setShowParticipants(false);
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  // ── Drag & Drop ────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── Paste from clipboard ───────────────────────────────────
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setChatText(text);
      setParticipantStats(null);
      setConfirmedNames(null);
      setShowParticipants(false);
    } catch {
      alert('Unable to read clipboard. Please paste manually into the text area.');
    }
  };

  // ── Test API Key Connection (Task 8) ───────────────────────
  const handleTestConnection = async () => {
    if (!apiKey || apiKey.trim().length < 10) {
      setTestStatus('fail');
      setTestMsg('Please enter a valid API key first.');
      return;
    }

    if (!validateApiKey(provider, apiKey)) {
      setTestStatus('fail');
      setTestMsg(KEY_VALIDATORS[provider]?.errorMsg || 'Invalid key prefix.');
      return;
    }

    setTestStatus('testing');
    setTestMsg('');

    try {
      await testConnection({ provider, apiKey });
      setTestStatus('ok');
      setTestMsg(`Connection successful! ${provider.toUpperCase()} is ready.`);
    } catch (err) {
      setTestStatus('fail');
      const msg = err.message || '';
      if (msg.includes('429') || msg.includes('quota')) {
        setTestMsg('API key is valid but quota is exhausted. Try tomorrow or upgrade your plan.');
        setTestStatus('ok'); // Key is technically valid
      } else {
        setTestMsg(msg || 'Connection failed. Please check your API key.');
      }
    }
  };

  // ── Remove API Key (Task 8) ────────────────────────────────
  const handleRemoveKey = () => {
    setApiKey('');
    setTestStatus('idle');
    setTestMsg('');
  };

  // ── Pre-check participants before analysis (Task 5) ────────
  const handlePreAnalyze = () => {
    if (!chatText.trim()) return;

    // Quick parse to detect participants
    const { messages } = parseChat(chatText, platform === 'auto' ? null : platform);
    if (messages.length < 5) {
      // Not enough messages — let analyze handle the proper error
      handleAnalyze();
      return;
    }

    const stats = getParticipantStats(messages);
    setParticipantStats(stats);
    setShowParticipants(true);
  };

  // ── Confirm participants and start analysis (Task 5) ───────
  const handleParticipantConfirm = (names) => {
    setConfirmedNames(names);
    setShowParticipants(false);
    handleAnalyze(names);
  };

  // ── Submit analysis ────────────────────────────────────────
  const handleAnalyze = async (overrideParticipants) => {
    if (!chatText.trim()) return;
    reset();
    await analyze({
      rawText:              chatText,
      format:               platform === 'auto' ? null : platform,
      provider,
      apiKey,
      overrideParticipants, // passed to chatParser if confirmed
    });
  };

  const canAnalyze = chatText.trim().length > 50;

  // ── Loading screen ─────────────────────────────────────────
  if (isLoading) {
    return <LoadingScreen stage={stage} progress={progress} label={stageLabel} />;
  }

  return (
    <div
      className="min-h-screen relative flex flex-col"
      style={{ background: 'linear-gradient(180deg, #050510 0%, #0d0d2b 100%)' }}
    >
      {/* Background blob */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-10 blur-3xl"
             style={{ background: 'radial-gradient(ellipse, #8b5cf6, transparent)' }} />
      </div>

      {/* ── Header ─────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6"
      >
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #ff2d78, #8b5cf6)' }}>
            <Heart size={13} className="text-white" fill="white" />
          </div>
          <span className="font-display font-bold text-white text-sm">BondIQ</span>
        </div>
      </motion.header>

      {/* ── Main Content ────────────────────────────────────── */}
      <main className="relative z-10 flex-1 px-4 sm:px-6 md:px-12 pb-20">
        <div className="max-w-2xl mx-auto">

          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-center mb-10 mt-4">
            <h1 className="font-display font-black text-3xl md:text-4xl text-white mb-2">
              Upload Your <span className="text-gradient-pink-purple">Chat</span>
            </h1>
            <p className="text-white/40 text-sm">
              Paste or upload a one-to-one conversation to begin the analysis
            </p>
          </motion.div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Platform selector */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
            <p className="text-white/50 text-xs font-medium mb-3 uppercase tracking-wider">Chat Platform</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setPlatform(p.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    platform === p.id
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                      : 'glass border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
                  }`}>
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Participant confirmation overlay */}
          <AnimatePresence>
            {showParticipants && participantStats && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6">
                <ParticipantConfirm
                  participantStats={participantStats}
                  onConfirm={handleParticipantConfirm}
                  onCancel={() => setShowParticipants(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat input area */}
          {!showParticipants && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              {/* Tabs */}
              <div className="flex gap-1 mb-4 glass rounded-xl p-1">
                <button onClick={() => setTab('paste')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    tab === 'paste' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                  }`}>
                  <MessageSquare size={14} /> Paste Chat
                </button>
                <button onClick={() => setTab('upload')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    tab === 'upload' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                  }`}>
                  <Upload size={14} /> Upload File
                </button>
              </div>

              <AnimatePresence mode="wait">
                {tab === 'paste' ? (
                  <motion.div key="paste" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                    {fileInfo && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                        <CheckCircle2 size={13} />
                        Loaded: {fileInfo.name} ({fileInfo.size})
                      </div>
                    )}
                    <div className="relative">
                      <textarea
                        value={chatText}
                        onChange={e => { setChatText(e.target.value); setParticipantStats(null); setShowParticipants(false); }}
                        placeholder={`Paste your chat here...\n\nExample format (WhatsApp):\n[01/01/2024, 10:00 AM] Alex: Hey! How are you?\n[01/01/2024, 10:02 AM] Jordan: I'm great! You?\n\nSupports WhatsApp, Telegram, Instagram, and plain text.`}
                        className="w-full h-56 glass rounded-2xl p-4 text-sm text-white/80 placeholder-white/20 resize-none outline-none border border-white/10 focus:border-purple-500/40 transition-colors duration-200 font-mono leading-relaxed"
                        style={{ background: 'rgba(255,255,255,0.03)' }}
                      />
                      {chatText && (
                        <div className="absolute bottom-3 right-3 text-white/20 text-xs">
                          {chatText.split('\n').length} lines
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={handlePasteClipboard} className="btn-ghost text-xs px-4 py-2 flex items-center gap-1.5">
                        <Clipboard size={12} /> Paste from Clipboard
                      </button>
                      <button onClick={() => { setChatText(SAMPLE_CHAT); setFileInfo(null); setParticipantStats(null); setShowParticipants(false); }}
                        className="btn-ghost text-xs px-4 py-2 flex items-center gap-1.5">
                        <FileText size={12} /> Load Demo Chat
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="upload" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDrop}
                      onClick={() => fileRef.current?.click()}
                      className={`h-56 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${
                        dragOver ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
                      }`}>
                      <motion.div animate={{ y: dragOver ? -8 : 0 }} transition={{ duration: 0.2 }}>
                        <Upload size={36} className={dragOver ? 'text-purple-400' : 'text-white/20'} />
                      </motion.div>
                      <div className="text-center">
                        <p className="text-white/60 font-medium text-sm">{dragOver ? 'Drop it here!' : 'Drag & drop your chat file'}</p>
                        <p className="text-white/30 text-xs mt-1">.txt files supported · Max 10MB</p>
                      </div>
                      <span className="px-4 py-1.5 rounded-full glass border border-white/10 text-xs text-white/40">or click to browse</span>
                    </div>
                    <input ref={fileRef} type="file" accept=".txt,.log,.text" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── API Key Section (Task 8) ─────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="mt-6 rounded-2xl border border-amber-500/15 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(139,92,246,0.04))' }}>

            <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-white/5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                <Key size={13} className="text-amber-400" />
              </div>
              <span className="text-white/80 text-sm font-semibold">AI Settings</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Multi-provider</span>
              <span className="ml-auto text-white/25 text-xs">Enables real AI analysis</span>
            </div>

            <div className="px-5 pb-5 pt-4">
              {/* AI Provider selector */}
              <div className="mb-4">
                <label className="block text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">AI Provider</label>
                <select
                  value={provider}
                  onChange={e => { setProvider(e.target.value); setTestStatus('idle'); setTestMsg(''); }}
                  className="w-full bg-white/5 border border-white/10 focus:border-purple-500/40 rounded-xl py-3.5 px-4 text-sm text-white outline-none transition-colors appearance-none cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <option value={PROVIDERS.GEMINI} className="bg-[#0f0f20] text-white">Gemini (Google) — Free</option>
                  <option value={PROVIDERS.GROQ} className="bg-[#0f0f20] text-white">Groq (Llama-3.3) — Fast</option>
                  <option value={PROVIDERS.OPENROUTER} className="bg-[#0f0f20] text-white">OpenRouter — Multi-model</option>
                  <option value={PROVIDERS.OPENAI} className="bg-[#0f0f20] text-white">OpenAI (GPT-4o-mini) — Accurate</option>
                  <option value={PROVIDERS.CLAUDE} className="bg-[#0f0f20] text-white">Claude (Anthropic) — Deep</option>
                </select>
              </div>

              {/* How to get key (Gemini only) */}
              {provider === PROVIDERS.GEMINI && (
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowApiGuide(true)}
                  className="w-full mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/25 bg-amber-500/8 hover:bg-amber-500/12 hover:border-amber-500/40 transition-all duration-200 group">
                  <span className="text-xl">🗝️</span>
                  <div className="text-left flex-1">
                    <p className="text-amber-300 text-sm font-semibold group-hover:text-amber-200 transition-colors">How to get your free API key?</p>
                    <p className="text-white/30 text-xs mt-0.5">Step-by-step guide → takes 2 minutes</p>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/25 transition-colors">
                    <span className="text-amber-400 text-xs font-bold">5</span>
                  </div>
                </motion.button>
              )}

              {/* API key input row */}
              <div className="relative">
                <input
                  id="api-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => { setApiKey(e.target.value); setTestStatus('idle'); setTestMsg(''); }}
                  placeholder={`Paste your ${provider.charAt(0).toUpperCase() + provider.slice(1)} API key: ${KEY_VALIDATORS[provider]?.placeholder || 'sk-...'}`}
                  className="w-full rounded-xl px-4 py-3.5 pr-24 text-sm text-white/80 placeholder-white/25 outline-none border transition-all duration-200 font-mono"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: apiKey
                      ? testStatus === 'ok' ? 'rgba(16,185,129,0.4)' : testStatus === 'fail' ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'
                      : 'rgba(255,255,255,0.08)',
                  }}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {apiKey && testStatus === 'ok' && <CheckCircle2 size={13} className="text-emerald-400" />}
                  {/* Show/Hide */}
                  <button
                    onClick={() => setShowKey(v => !v)}
                    className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors rounded-lg hover:bg-white/5"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  {/* Remove key */}
                  {apiKey && (
                    <button onClick={handleRemoveKey}
                      className="w-7 h-7 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/5"
                      title="Remove key">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Test connection + status */}
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                {apiKey && (
                  <button
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      testStatus === 'testing'
                        ? 'border-white/10 text-white/30 cursor-not-allowed'
                        : 'border-white/15 text-white/50 hover:text-white hover:border-white/30 hover:bg-white/5'
                    }`}
                  >
                    {testStatus === 'testing'
                      ? <><Loader2 size={11} className="animate-spin" /> Testing...</>
                      : <><Wifi size={11} /> Test Connection</>}
                  </button>
                )}

                <div className="flex-1">
                  {testMsg ? (
                    <p className={`text-xs flex items-center gap-1.5 ${testStatus === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {testStatus === 'ok' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                      {testMsg}
                    </p>
                  ) : apiKey ? (
                    <p className="text-emerald-400 text-xs flex items-center gap-1.5">
                      <CheckCircle2 size={11} /> API key set — real {provider.charAt(0).toUpperCase() + provider.slice(1)} AI analysis will run
                    </p>
                  ) : (
                    <p className="text-white/25 text-xs">
                      No key? That's OK — runs local analysis automatically.
                    </p>
                  )}
                </div>
              </div>

              {/* LocalStorage note */}
              <p className="text-white/15 text-xs mt-2">🔒 Key saved locally in your browser only. Never sent to our servers.</p>
            </div>
          </motion.div>

          {/* API Guide Modal */}
          <AnimatePresence>
            {showApiGuide && <ApiKeyGuideModal onClose={() => setShowApiGuide(false)} />}
          </AnimatePresence>

          {/* ── Analyze Button ───────────────────────────────── */}
          {!showParticipants && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6">
              <motion.button
                whileHover={canAnalyze ? { scale: 1.02 } : {}}
                whileTap={canAnalyze ? { scale: 0.98 } : {}}
                onClick={handlePreAnalyze}
                disabled={!canAnalyze}
                id="analyze-btn"
                className={`w-full py-5 rounded-2xl font-display font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
                  canAnalyze ? 'text-white cursor-pointer' : 'opacity-30 cursor-not-allowed text-white/50 glass border border-white/10'
                }`}
                style={canAnalyze ? {
                  background: 'linear-gradient(135deg, #ff2d78, #8b5cf6)',
                  boxShadow: '0 20px 60px rgba(139,92,246,0.3)',
                } : {}}
              >
                <Sparkles size={20} />
                {canAnalyze ? 'Analyze Relationship' : 'Paste a chat to begin'}
              </motion.button>
            </motion.div>
          )}

          {/* Privacy note */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-center text-white/20 text-xs mt-4">
            🔒 Your chat is never stored. Analysis is private and ephemeral.
          </motion.p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 md:px-12 py-8 mt-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-pink-400" fill="currentColor" />
            <span className="font-display font-bold text-white/60 text-sm tracking-tight uppercase">BondIQ</span>
          </div>
          <p className="text-white/20 text-xs">Developed with ❤️ by <span className="text-white/40 font-semibold">M SAAD SHAIKH</span></p>
        </div>
      </footer>
    </div>
  );
}
