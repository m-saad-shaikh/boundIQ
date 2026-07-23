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
  X, ExternalLink, Copy, CheckCheck, Wifi, WifiOff, Trash2, Loader2, ChevronDown,
  Shield, Lock, Monitor, Server, Github, Terminal,
} from 'lucide-react';
import LoadingScreen from '../components/analysis/LoadingScreen.jsx';
import ParticipantConfirm from '../components/analysis/ParticipantConfirm.jsx';
import { parseChat, getParticipantStats } from '../utils/chatParser.js';
import { PROVIDERS, KEY_VALIDATORS, validateApiKey, testConnection } from '../utils/ai/index.js';
import BondIQLogo from '../components/common/BondIQLogo.jsx';

// ── Per-provider API Key Guide config ─────────────────────────────────────────
const PROVIDER_GUIDES = {
  gemini: {
    name: 'Gemini (Google)',
    icon: '🧠',
    accentColor: 'cyan',
    url: 'https://aistudio.google.com/app/apikey',
    isFree: true,
    steps: [
      { number: '01', emoji: '🌐', color: 'cyan',   title: 'Open Google AI Studio',   description: 'Go to aistudio.google.com and sign in with your Google account — completely free.', link: 'https://aistudio.google.com/app/apikey', linkLabel: 'Open AI Studio →' },
      { number: '02', emoji: '🔑', color: 'gold',   title: 'Click "Get API Key"',     description: 'On the left sidebar, click "Get API Key", then click the blue "Create API Key" button.' },
      { number: '03', emoji: '📁', color: 'purple', title: 'Select a Project',         description: 'Choose an existing Google Cloud project or click "Create API key in new project".' },
      { number: '04', emoji: '📋', color: 'pink',   title: 'Copy Your Key',           description: 'Your key starts with "AIzaSy...". Click the copy icon next to it. Keep it private.' },
      { number: '05', emoji: '✅', color: 'green',  title: 'Paste it Below',          description: 'Come back here and paste your key in the Gemini API Key field below.' },
    ],
  },
  groq: {
    name: 'Groq',
    icon: '⚡',
    accentColor: 'amber',
    url: 'https://console.groq.com/keys',
    isFree: true,
    steps: [
      { number: '01', emoji: '🌐', color: 'cyan',   title: 'Open Groq Console',        description: 'Go to console.groq.com and sign up or log in — it is free, no credit card needed.', link: 'https://console.groq.com/keys', linkLabel: 'Open Groq Console →' },
      { number: '02', emoji: '🔑', color: 'gold',   title: 'Go to API Keys',           description: 'In the left sidebar, click "API Keys".' },
      { number: '03', emoji: '➕', color: 'purple', title: 'Create a New Key',         description: 'Click "Create API Key", give it any name (e.g. "BondIQ"), then click "Submit".' },
      { number: '04', emoji: '📋', color: 'pink',   title: 'Copy Your Key',           description: 'Your key starts with "gsk_...". Copy it immediately — it is only shown once!' },
      { number: '05', emoji: '✅', color: 'green',  title: 'Paste it Below',          description: 'Paste your Groq key in the API key field below and click Test Connection.' },
    ],
  },
  openrouter: {
    name: 'OpenRouter',
    icon: '🌐',
    accentColor: 'purple',
    url: 'https://openrouter.ai/keys',
    isFree: true,
    steps: [
      { number: '01', emoji: '🌐', color: 'cyan',   title: 'Open OpenRouter',          description: 'Go to openrouter.ai and sign up with Google or GitHub — free account available.', link: 'https://openrouter.ai/keys', linkLabel: 'Open OpenRouter →' },
      { number: '02', emoji: '🔑', color: 'gold',   title: 'Go to API Keys',           description: 'Click your avatar (top-right) → "API Keys", or go to openrouter.ai/keys directly.' },
      { number: '03', emoji: '➕', color: 'purple', title: 'Create a Key',             description: 'Click "Create Key", give it a name (e.g. "BondIQ"), leave credit limit blank for free models.' },
      { number: '04', emoji: '📋', color: 'pink',   title: 'Copy Your Key',           description: 'Your key starts with "sk-or-v1-...". Copy it — shown only once after creation.' },
      { number: '05', emoji: '🆓', color: 'green',  title: 'Free Models Available',   description: 'OpenRouter has free models (like Gemini 2.5 Flash free tier). No billing needed for free models.' },
      { number: '06', emoji: '✅', color: 'green',  title: 'Paste it Below',          description: 'Paste your key in the API key field below. BondIQ uses Gemini 2.5 Flash via OpenRouter.' },
    ],
  },
  openai: {
    name: 'OpenAI',
    icon: '🤖',
    accentColor: 'green',
    url: 'https://platform.openai.com/api-keys',
    isFree: false,
    steps: [
      { number: '01', emoji: '🌐', color: 'cyan',   title: 'Open OpenAI Platform',     description: 'Go to platform.openai.com and log in. You need to add billing credits (minimum ~$5).', link: 'https://platform.openai.com/api-keys', linkLabel: 'Open OpenAI Platform →' },
      { number: '02', emoji: '💳', color: 'gold',   title: 'Add Billing Credits',      description: 'Go to Settings → Billing → Add payment method. Add at least $5 credits to start.' },
      { number: '03', emoji: '🔑', color: 'purple', title: 'Go to API Keys',           description: 'Click your avatar → "API Keys" in the left sidebar, or go to platform.openai.com/api-keys.' },
      { number: '04', emoji: '➕', color: 'pink',   title: 'Create a New Secret Key',  description: 'Click "Create new secret key", give it a name, select "All" permissions.' },
      { number: '05', emoji: '📋', color: 'pink',   title: 'Copy Your Key',           description: 'Your key starts with "sk-...". Copy it immediately — shown only once!' },
      { number: '06', emoji: '✅', color: 'green',  title: 'Paste it Below',          description: 'Paste your OpenAI key below. BondIQ uses gpt-4o-mini for analysis (very cost-efficient).' },
    ],
  },
  claude: {
    name: 'Claude (Anthropic)',
    icon: '💜',
    accentColor: 'purple',
    url: 'https://console.anthropic.com/settings/keys',
    isFree: false,
    steps: [
      { number: '01', emoji: '🌐', color: 'cyan',   title: 'Open Anthropic Console',   description: 'Go to console.anthropic.com and sign up or log in. Requires billing setup.', link: 'https://console.anthropic.com/settings/keys', linkLabel: 'Open Anthropic Console →' },
      { number: '02', emoji: '💳', color: 'gold',   title: 'Add Credits',             description: 'Go to Settings → Billing → Add funds. Claude charges per token, starting from $5.' },
      { number: '03', emoji: '🔑', color: 'purple', title: 'Go to API Keys',           description: 'In the left sidebar click "API Keys" under your workspace settings.' },
      { number: '04', emoji: '➕', color: 'pink',   title: 'Create a Key',             description: 'Click "Create Key", give it a name like "BondIQ", then click "Create Key".' },
      { number: '05', emoji: '📋', color: 'pink',   title: 'Copy Your Key',           description: 'Your key starts with "sk-ant-...". Copy it now — it is only shown once.' },
      { number: '06', emoji: '✅', color: 'green',  title: 'Paste it Below',          description: 'Paste your Claude key below. BondIQ uses claude-3-haiku for deep emotional analysis.' },
    ],
  },
};

const STEP_COLORS = {
  cyan:   { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20',   text: 'text-cyan-400',   num: 'bg-cyan-500/20 text-cyan-300' },
  gold:   { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  text: 'text-amber-400',  num: 'bg-amber-500/20 text-amber-300' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', num: 'bg-purple-500/20 text-purple-300' },
  pink:   { bg: 'bg-pink-500/10',   border: 'border-pink-500/20',   text: 'text-pink-400',   num: 'bg-pink-500/20 text-pink-300' },
  green:  { bg: 'bg-emerald-500/10',border: 'border-emerald-500/20',text: 'text-emerald-400',num: 'bg-emerald-500/20 text-emerald-300' },
};

// ── API Key Guide Modal (provider-aware) ──────────────────────────────────────
function ApiKeyGuideModal({ onClose, provider }) {
  const [copied, setCopied] = useState(false);
  const guide = PROVIDER_GUIDES[provider] || PROVIDER_GUIDES.gemini;
  const { name, icon, url, isFree, steps } = guide;

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
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5"
             style={{ background: 'linear-gradient(135deg, #0d0d2b, #0a0a1e)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl">
              {icon}
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg">Get {name} API Key</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-white/30 text-xs">{steps.length} steps</p>
                {isFree
                  ? <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Free</span>
                  : <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/20">Paid</span>
                }
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* URL bar */}
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

        {/* Steps */}
        <div className="px-6 pb-6 flex flex-col gap-3 mt-2">
          {steps.map((step, i) => {
            const c = STEP_COLORS[step.color];
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className={`flex gap-4 p-4 rounded-2xl border ${c.bg} ${c.border}`}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-display ${c.num}`}>{step.number}</div>
                  {i < steps.length - 1 && <div className="w-px flex-1 bg-white/5 min-h-[20px]" />}
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

        {/* CTA */}
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

// ── Platform Export Guides ─────────────────────────────────────────────────────
const PLATFORM_GUIDES = {
  whatsapp: {
    name: 'WhatsApp',
    emoji: '💬',
    color: 'emerald',
    headerBg: 'rgba(16,185,129,0.08)',
    headerBorder: 'rgba(16,185,129,0.2)',
    note: 'Works on Android & iPhone',
    steps: [
      {
        number: '01', emoji: '📱', color: 'cyan',
        title: 'Open WhatsApp',
        description: 'Apne phone mein WhatsApp open karo aur us contact ki chat open karo jise analyze karna hai.',
      },
      {
        number: '02', emoji: '⋮', color: 'gold',
        title: 'Tap the 3-dot menu (top right)',
        description: 'Chat ke andar top-right mein 3 dots (⋮) ya iPhone pe share icon pe tap karo.',
      },
      {
        number: '03', emoji: '📤', color: 'purple',
        title: 'Select "More" → "Export Chat"',
        description: 'Menu mein "More" option pe tap karo, phir "Export chat" select karo.',
      },
      {
        number: '04', emoji: '📷', color: 'pink',
        title: 'Choose "Without Media"',
        description: '"Without Media" choose karo — sirf text chahiye, images/videos nahi. File size bhi chhoti hogi.',
      },
      {
        number: '05', emoji: '💾', color: 'pink',
        title: 'Save the .txt file',
        description: 'WhatsApp ek .txt file banayega. Ise apne Files app / Google Drive / Email mein save karo ya directly share karo.',
      },
      {
        number: '06', emoji: '⬆️', color: 'green',
        title: 'Upload here',
        description: 'Woh .txt file yahan Upload tab mein upload karo, ya file khol ke saara text copy karke Paste tab mein paste karo. Done! ✅',
      },
    ],
  },
  telegram: {
    name: 'Telegram',
    emoji: '✈️',
    color: 'cyan',
    headerBg: 'rgba(6,182,212,0.08)',
    headerBorder: 'rgba(6,182,212,0.2)',
    note: 'Desktop app recommended',
    steps: [
      {
        number: '01', emoji: '💻', color: 'cyan',
        title: 'Open Telegram Desktop',
        description: 'Telegram Desktop app kholo (telegram.org se download karo agar nahi hai). Phone se bhi ho sakta hai lekin Desktop zyada easy hai.',
      },
      {
        number: '02', emoji: '💬', color: 'gold',
        title: 'Open the chat',
        description: 'Woh chat open karo jise analyze karna hai.',
      },
      {
        number: '03', emoji: '⋮', color: 'purple',
        title: 'Click the 3-dot menu',
        description: 'Chat ke top-right mein 3 dots (⋮) ya hamburger menu pe click karo.',
      },
      {
        number: '04', emoji: '📤', color: 'pink',
        title: 'Select "Export Chat History"',
        description: '"Export Chat History" option dhundo aur click karo. Ek dialog box khulega.',
      },
      {
        number: '05', emoji: '⚙️', color: 'pink',
        title: 'Select format: JSON or Text',
        description: 'Format mein "Machine-readable JSON" ya "Human-readable text" select karo. Media sab uncheck kar do — sirf text chahiye.',
      },
      {
        number: '06', emoji: '📁', color: 'green',
        title: 'Find the exported file',
        description: 'Export hone ke baad ek folder milega. Usme "messages.html" ya "result.json" hoga. Text format mein .txt milega.',
      },
      {
        number: '07', emoji: '⬆️', color: 'green',
        title: 'Upload here',
        description: 'Woh file yahan Upload tab mein drag & drop karo, ya text copy karke Paste tab mein paste karo. ✅',
      },
    ],
  },
  instagram: {
    name: 'Instagram',
    emoji: '📸',
    color: 'pink',
    headerBg: 'rgba(236,72,153,0.08)',
    headerBorder: 'rgba(236,72,153,0.2)',
    note: 'Takes a few minutes to prepare',
    steps: [
      {
        number: '01', emoji: '📱', color: 'cyan',
        title: 'Open Instagram App',
        description: 'Instagram app kholo aur apni profile pe jao (bottom-right mein apni photo pe tap karo).',
      },
      {
        number: '02', emoji: '☰', color: 'gold',
        title: 'Go to Settings',
        description: 'Top-right mein hamburger menu (☰) tap karo → "Settings and privacy" select karo.',
      },
      {
        number: '03', emoji: '📦', color: 'purple',
        title: 'Your Activity → Download your information',
        description: '"Your activity" section mein jao → "Download your information" ya "Transfer a copy of your information" pe tap karo.',
      },
      {
        number: '04', emoji: '✉️', color: 'pink',
        title: 'Request Download',
        description: 'Apni email confirm karo, format mein "JSON" ya "HTML" select karo, date range set karo. "Request a download" pe tap karo.',
      },
      {
        number: '05', emoji: '⏳', color: 'pink',
        title: 'Wait for the email',
        description: 'Instagram kuch minutes se kuch ghante mein aapki email pe ek download link bhejega. Busy time mein zyada time lag sakta hai.',
      },
      {
        number: '06', emoji: '📬', color: 'gold',
        title: 'Download the file',
        description: 'Email mein aaye link pe click karo, file download karo aur unzip karo. "messages" folder mein tumhari DM files millengi.',
      },
      {
        number: '07', emoji: '⬆️', color: 'green',
        title: 'Upload or paste here',
        description: 'messages folder se us conversation ki file copy karo aur yahan paste karo, ya file upload karo. ✅',
      },
    ],
  },
};

// ── Platform Guide Modal ─────────────────────────────────────────────────────
function PlatformGuideModal({ onClose, platform }) {
  const guide = PLATFORM_GUIDES[platform];
  if (!guide) return null;
  const { name, emoji, steps, note, headerBg, headerBorder } = guide;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,5,16,0.88)', backdropFilter: 'blur(16px)' }}
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
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5 rounded-t-3xl"
          style={{ background: `linear-gradient(135deg, ${headerBg}, rgba(13,13,43,0.95))`, borderBottom: `1px solid ${headerBorder}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: headerBg, border: `1px solid ${headerBorder}` }}
            >
              {emoji}
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg">Export from {name}</h2>
              <p className="text-white/30 text-xs">{note} · {steps.length} steps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Steps */}
        <div className="px-6 pb-6 flex flex-col gap-3 mt-4">
          {steps.map((step, i) => {
            const c = STEP_COLORS[step.color];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`flex gap-4 p-4 rounded-2xl border ${c.bg} ${c.border}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-display flex-shrink-0 ${c.num}`}>
                    {step.number}
                  </div>
                  {i < steps.length - 1 && <div className="w-px flex-1 bg-white/5 min-h-[20px]" />}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{step.emoji}</span>
                    <p className={`font-display font-semibold text-sm ${c.text}`}>{step.title}</p>
                  </div>
                  <p className="text-white/55 text-xs leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #ff2d78)' }}
          >
            Got it — I'll export my chat! ✓
          </button>
          <p className="text-center text-white/20 text-xs mt-3">🔒 Your chat stays on your device. Nothing is uploaded to our servers.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Capacity Card (collapsible) ───────────────────────────────────────────────
function CapacityCard({ info, tc }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-4 rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* ─ Compact always-visible chip ─ */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-base">{info.icon}</span>
        <span className="text-white/70 text-xs font-mono font-semibold flex-1 text-left truncate">{info.model}</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${tc.bg} ${tc.border} ${tc.text} border flex-shrink-0`}>
          {info.tier}
        </span>
        <span className="text-white/35 text-[10px] flex-shrink-0">{info.msgs}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={13} className="text-white/25" />
        </motion.span>
      </button>

      {/* ─ Expanded details ─ */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="px-3 py-3 flex flex-col gap-2">
              {/* Bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/35 text-[10px] uppercase tracking-wider">Message Capacity</span>
                  <span className={`text-[10px] font-medium ${tc.text}`}>{info.msgsNote}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${info.barPct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full bg-gradient-to-r ${info.barColor}`}
                  />
                </div>
              </div>
              {/* Meta */}
              <div className="flex items-center justify-between">
                <span className="text-white/20 text-[10px]">Context: <span className="text-white/45 font-medium">{info.context}</span></span>
                <span className="text-white/20 text-[10px]">{info.speed}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Verify It Yourself Panel ───────────────────────────────────────────────────
function VerifyPanel() {
  const [open, setOpen] = useState(false);
  const steps = [
    { n: '1', icon: '🖥️', title: 'Open Browser DevTools', desc: 'Press F12 (Windows/Linux) or Cmd+Option+I (Mac) to open developer tools.' },
    { n: '2', icon: '📡', title: 'Go to the Network tab', desc: 'Click the "Network" tab at the top of DevTools. Check "Preserve log".' },
    { n: '3', icon: '🔍', title: 'Filter by "Fetch/XHR"', desc: 'Click the "Fetch/XHR" filter button to see only API calls.' },
    { n: '4', icon: '📋', title: 'Paste & Analyze your chat', desc: 'Come back here, paste your chat, and click "Analyze Relationship".' },
    { n: '5', icon: '🔎', title: 'Check the requests', desc: 'Look at every request. You will NOT see your chat text in any request body — only the AI provider call (if you entered an API key) will appear.' },
  ];
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)' }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        <Monitor size={13} className="text-purple-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white/70 text-xs font-semibold">Verify it yourself — open Network tab</p>
          <p className="text-white/25 text-[10px]">Prove to yourself that your chat never leaves your browser</p>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={13} className="text-white/25" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="verify-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(139,92,246,0.1)' }}
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              <p className="text-white/40 text-[10px] leading-relaxed">
                Don&apos;t trust us — <span className="text-purple-400 font-semibold">verify yourself</span>. Follow these steps to confirm your chat data never leaves your device:
              </p>
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-md bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-300 text-[9px] font-bold">{s.n}</span>
                  </div>
                  <div>
                    <p className="text-white/60 text-[11px] font-semibold">{s.icon} {s.title}</p>
                    <p className="text-white/30 text-[10px] leading-relaxed mt-0.5">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
              <div
                className="mt-1 px-3 py-2.5 rounded-lg text-[10px] text-emerald-400/80 leading-relaxed"
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
              >
                ✅ <span className="font-semibold">What you&apos;ll see:</span> Only a request to your AI provider (Gemini/Groq/etc.) if you entered an API key. The request will contain the <em>sampled</em> chat text for AI analysis only — never stored on any server.
                <br /><br />
                ❌ <span className="font-semibold">What you won&apos;t see:</span> Any request to BondIQ servers containing your chat. Because there isn&apos;t one.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  const [showPlatformGuide, setShowPlatformGuide] = useState(false);
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
        <BondIQLogo size={30} textSize="sm" />
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

          {/* Platform export guide button — for WhatsApp, Telegram, Instagram */}
          <AnimatePresence mode="wait">
            {PLATFORM_GUIDES[platform] && (
              <motion.div
                key={platform}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mb-4 -mt-2"
              >
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPlatformGuide(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group"
                  style={{
                    background: PLATFORM_GUIDES[platform].headerBg,
                    border: `1px solid ${PLATFORM_GUIDES[platform].headerBorder}`,
                  }}
                >
                  <span className="text-xl">{PLATFORM_GUIDES[platform].emoji}</span>
                  <div className="text-left flex-1">
                    <p className="text-white/80 text-sm font-semibold group-hover:text-white transition-colors">
                      How to export chat from {PLATFORM_GUIDES[platform].name}?
                    </p>
                    <p className="text-white/30 text-xs mt-0.5">
                      Step-by-step guide · {PLATFORM_GUIDES[platform].steps.length} steps · {PLATFORM_GUIDES[platform].note}
                    </p>
                  </div>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{ background: PLATFORM_GUIDES[platform].headerBorder }}
                  >
                    <span className="text-white text-xs font-bold">{PLATFORM_GUIDES[platform].steps.length}</span>
                  </div>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

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

              {/* ── Provider capacity info card (collapsible) ────────── */}
              {(() => {
                const INFO = {
                  [PROVIDERS.GEMINI]:     { model: 'gemini-2.0-flash',    tier: 'Free',             tierColor: 'emerald', icon: '🧠', msgs: '~50,000 msgs', barPct: 95, barColor: 'from-emerald-500 to-cyan-400',   context: '1M tokens',   msgsNote: 'Best for large chats',    speed: '⚡ Fast' },
                  [PROVIDERS.GROQ]:       { model: 'llama-3.1-8b-instant',tier: 'Free · limited',   tierColor: 'amber',   icon: '⚡', msgs: '~3,000 msgs',  barPct: 30, barColor: 'from-amber-500 to-orange-400', context: '128K tokens', msgsNote: 'Best for short chats',    speed: '🚀 Fastest' },
                  [PROVIDERS.OPENROUTER]: { model: 'gemini-2.5-flash',    tier: 'Free · rate limit',tierColor: 'cyan',    icon: '🌐', msgs: '~40,000 msgs', barPct: 85, barColor: 'from-cyan-500 to-purple-400',  context: '1M tokens',   msgsNote: 'Great for large chats',   speed: '⚡ Fast' },
                  [PROVIDERS.OPENAI]:     { model: 'gpt-4o-mini',         tier: 'Paid',             tierColor: 'pink',    icon: '🤖', msgs: '~10,000 msgs', barPct: 55, barColor: 'from-pink-500 to-rose-400',    context: '128K tokens', msgsNote: 'Balanced & accurate',     speed: '✅ Accurate' },
                  [PROVIDERS.CLAUDE]:     { model: 'claude-3-haiku',      tier: 'Paid',             tierColor: 'purple',  icon: '💜', msgs: '~20,000 msgs', barPct: 70, barColor: 'from-purple-500 to-violet-400',context: '200K tokens', msgsNote: 'Best emotional depth',    speed: '🔍 Deep' },
                };
                const TIER_COLORS = {
                  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
                  amber:   { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',   text: 'text-amber-400' },
                  cyan:    { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20',    text: 'text-cyan-400' },
                  pink:    { bg: 'bg-pink-500/10',   border: 'border-pink-500/20',    text: 'text-pink-400' },
                  purple:  { bg: 'bg-purple-500/10', border: 'border-purple-500/20',  text: 'text-purple-400' },
                };
                const info = INFO[provider];
                if (!info) return null;
                const tc = TIER_COLORS[info.tierColor];
                return (
                  <CapacityCard key={provider} info={info} tc={tc} />
                );
              })()}

              {/* Guide button — shown for ALL providers */}
              {(() => {
                const guide = PROVIDER_GUIDES[provider];
                if (!guide) return null;
                return (
                  <motion.button
                    key={provider}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setShowApiGuide(true)}
                    className="w-full mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/25 bg-amber-500/8 hover:bg-amber-500/12 hover:border-amber-500/40 transition-all duration-200 group"
                  >
                    <span className="text-xl">{guide.icon}</span>
                    <div className="text-left flex-1">
                      <p className="text-amber-300 text-sm font-semibold group-hover:text-amber-200 transition-colors">
                        How to get your {guide.name} API key?
                      </p>
                      <p className="text-white/30 text-xs mt-0.5">
                        Step-by-step guide · {guide.steps.length} steps · {guide.isFree ? '🆓 Free' : '💳 Paid'}
                      </p>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/25 transition-colors">
                      <span className="text-amber-400 text-xs font-bold">{guide.steps.length}</span>
                    </div>
                  </motion.button>
                );
              })()}

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
            {showApiGuide && <ApiKeyGuideModal onClose={() => setShowApiGuide(false)} provider={provider} />}
          </AnimatePresence>

          {/* Platform Export Guide Modal */}
          <AnimatePresence>
            {showPlatformGuide && <PlatformGuideModal onClose={() => setShowPlatformGuide(false)} platform={platform} />}
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

          {/* ── Trust & Privacy Section ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="mt-8"
          >
            {/* Section header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-px bg-white/5" />
              <div className="flex items-center gap-2 px-3">
                <Shield size={12} className="text-emerald-400" />
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Privacy & Trust</span>
              </div>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* What We Can't See — guarantee grid */}
            <div
              className="rounded-2xl p-4 mb-3"
              style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)' }}
            >
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <Lock size={11} />
                What We Can&apos;t See — Ever
              </p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { icon: '💬', text: 'Your chat messages', sub: 'Never sent to our servers — stays in your browser' },
                  { icon: '🔑', text: 'Your API key', sub: 'Saved only in your browser localStorage, not our DB' },
                  { icon: '👤', text: 'Your identity', sub: 'No account, no email, no name — completely anonymous' },
                  { icon: '📍', text: 'Your location or IP', sub: 'No tracking, no analytics on your personal data' },
                  { icon: '🗂️', text: 'Analysis results', sub: 'Results disappear when you close the tab' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.05 }}
                    className="flex items-start gap-3 py-1.5"
                  >
                    <span className="text-sm mt-0.5 flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-xs font-semibold">{item.text}</p>
                      <p className="text-white/30 text-[10px] leading-relaxed">{item.sub}</p>
                    </div>
                    <CheckCircle2 size={13} className="text-emerald-500/60 flex-shrink-0 mt-0.5" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Verify It Yourself — collapsible */}
            <VerifyPanel />
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
            className="text-center text-white/15 text-[10px] mt-5 mb-2">
            🔒 Analysis is ephemeral — data vanishes when you close this tab.
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
