/**
 * ParticipantConfirm.jsx
 * Shows detected chat participants before analysis begins.
 * Allows manual correction if detection is wrong.
 * Task 5 requirement.
 * Updated: Better UX — click name to edit, auto-select, clear button, inline hints.
 */

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Edit3, Check, ChevronRight, MessageSquare, X } from 'lucide-react';

export default function ParticipantConfirm({ participantStats, onConfirm, onCancel }) {
  // participantStats = [{ name, count, pct }, ...]
  const top = participantStats.slice(0, 2);

  // Editable name state
  const [names,   setNames]   = useState(top.map(p => p.name));
  const [editing, setEditing] = useState([false, false]);
  const inputRefs = [useRef(null), useRef(null)];

  const handleNameChange = (idx, val) => {
    setNames(prev => { const n = [...prev]; n[idx] = val; return n; });
  };

  const openEdit = (idx) => {
    setEditing(prev => { const e = [...prev]; e[idx] = true; return e; });
    // auto-select text after next render
    setTimeout(() => {
      inputRefs[idx].current?.select();
    }, 50);
  };

  const closeEdit = (idx) => {
    setEditing(prev => { const e = [...prev]; e[idx] = false; return e; });
  };

  const clearName = (idx) => {
    setNames(prev => { const n = [...prev]; n[idx] = ''; return n; });
    inputRefs[idx].current?.focus();
  };

  const handleConfirm = () => {
    if (!names[0]?.trim() || !names[1]?.trim()) return;
    onConfirm(names.map(n => n.trim()));
  };

  const totalMessages = participantStats.reduce((s, p) => s + p.count, 0);
  const canConfirm = names[0]?.trim().length > 0 && names[1]?.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full rounded-2xl border border-purple-500/20 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(255,45,120,0.04))' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
          <Users size={16} className="text-purple-400" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold">Participants Detected</p>
          <p className="text-white/30 text-xs">
            Found {participantStats.length} senders · {totalMessages.toLocaleString()} messages
            <span className="text-purple-400/60 ml-2">· Tap a name to edit ✏️</span>
          </p>
        </div>
      </div>

      {/* Participant cards */}
      <div className="px-5 py-4 space-y-3">
        {top.map((p, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              idx === 0
                ? 'border-pink-500/20 bg-pink-500/5'
                : 'border-purple-500/20 bg-purple-500/5'
            }`}
          >
            {/* Avatar initial */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                idx === 0 ? 'bg-pink-500/20 text-pink-300' : 'bg-purple-500/20 text-purple-300'
              }`}
            >
              {(names[idx]?.[0] || '?').toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              {/* Editable name — click to edit */}
              {editing[idx] ? (
                <div className="relative flex items-center">
                  <input
                    ref={inputRefs[idx]}
                    autoFocus
                    type="text"
                    value={names[idx]}
                    onChange={e => handleNameChange(idx, e.target.value)}
                    onBlur={() => closeEdit(idx)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') closeEdit(idx);
                      if (e.key === 'Escape') { handleNameChange(idx, top[idx].name); closeEdit(idx); }
                    }}
                    className="w-full bg-transparent text-white text-sm font-semibold outline-none border-b border-purple-500/50 pb-0.5 pr-6"
                    maxLength={30}
                    placeholder="Enter name…"
                  />
                  {names[idx] && (
                    <button
                      onMouseDown={e => { e.preventDefault(); clearName(idx); }}
                      className="absolute right-0 text-white/30 hover:text-white/60"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openEdit(idx)}
                  className="text-white text-sm font-semibold truncate text-left w-full hover:text-purple-300 transition-colors group flex items-center gap-1.5"
                  title="Click to edit name"
                >
                  {names[idx] || <span className="text-white/30 italic">Enter name…</span>}
                  <Edit3 size={10} className="text-white/20 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                </button>
              )}
              {/* Message stats */}
              <div className="flex items-center gap-2 mt-0.5">
                <MessageSquare size={10} className="text-white/25" />
                <span className="text-white/30 text-xs">{p.count} messages · {p.pct}%</span>
              </div>
              {/* Inline validation */}
              {!names[idx]?.trim() && (
                <p className="text-red-400/70 text-[10px] mt-0.5">Name cannot be empty</p>
              )}
            </div>

            {/* Edit/Done button */}
            <button
              onClick={() => editing[idx] ? closeEdit(idx) : openEdit(idx)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                editing[idx]
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-white/5 text-white/30 hover:text-white hover:bg-white/10'
              }`}
              title={editing[idx] ? 'Save name' : 'Edit name'}
            >
              {editing[idx] ? <Check size={12} /> : <Edit3 size={12} />}
            </button>
          </div>
        ))}

        {/* Others note */}
        {participantStats.length > 2 && (
          <p className="text-white/25 text-xs px-1">
            + {participantStats.length - 2} other sender{participantStats.length > 3 ? 's' : ''} detected (filtered out as minor participants)
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-3">
        <button
          onClick={onCancel}
          className="btn-ghost text-xs px-4 py-2.5"
        >
          Go Back
        </button>
        <motion.button
          whileHover={canConfirm ? { scale: 1.02 } : {}}
          whileTap={canConfirm ? { scale: 0.98 } : {}}
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #ff2d78)' }}
        >
          Confirm &amp; Analyze
          <ChevronRight size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
}

