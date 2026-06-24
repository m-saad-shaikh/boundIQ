/**
 * ParticipantConfirm.jsx
 * Shows detected chat participants before analysis begins.
 * Allows manual correction if detection is wrong.
 * Task 5 requirement.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Edit3, Check, ChevronRight, MessageSquare, BarChart2 } from 'lucide-react';

export default function ParticipantConfirm({ participantStats, onConfirm, onCancel }) {
  // participantStats = [{ name, count, pct }, ...]
  const top = participantStats.slice(0, 2);

  // Editable name state
  const [names, setNames] = useState(top.map(p => p.name));
  const [editing, setEditing] = useState([false, false]);

  const handleNameChange = (idx, val) => {
    setNames(prev => { const n = [...prev]; n[idx] = val; return n; });
  };

  const toggleEdit = (idx) => {
    setEditing(prev => { const e = [...prev]; e[idx] = !e[idx]; return e; });
  };

  const handleConfirm = () => {
    if (!names[0]?.trim() || !names[1]?.trim()) return;
    onConfirm(names.map(n => n.trim()));
  };

  const totalMessages = participantStats.reduce((s, p) => s + p.count, 0);

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
              {/* Editable name */}
              {editing[idx] ? (
                <input
                  autoFocus
                  type="text"
                  value={names[idx]}
                  onChange={e => handleNameChange(idx, e.target.value)}
                  onBlur={() => toggleEdit(idx)}
                  onKeyDown={e => e.key === 'Enter' && toggleEdit(idx)}
                  className="w-full bg-transparent text-white text-sm font-semibold outline-none border-b border-purple-500/40 pb-0.5"
                  maxLength={30}
                />
              ) : (
                <p className="text-white text-sm font-semibold truncate">{names[idx]}</p>
              )}
              {/* Message stats */}
              <div className="flex items-center gap-2 mt-0.5">
                <MessageSquare size={10} className="text-white/25" />
                <span className="text-white/30 text-xs">{p.count} messages · {p.pct}%</span>
              </div>
            </div>

            {/* Edit button */}
            <button
              onClick={() => toggleEdit(idx)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                editing[idx]
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-white/5 text-white/30 hover:text-white hover:bg-white/10'
              }`}
            >
              {editing[idx] ? <Check size={12} /> : <Edit3 size={12} />}
            </button>
          </div>
        ))}

        {/* Others note */}
        {participantStats.length > 2 && (
          <p className="text-white/25 text-xs px-1">
            + {participantStats.length - 2} other sender{participantStats.length > 3 ? 's' : ''} detected (filtered out)
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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConfirm}
          disabled={!names[0]?.trim() || !names[1]?.trim()}
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
