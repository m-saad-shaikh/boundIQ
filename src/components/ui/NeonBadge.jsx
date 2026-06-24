/**
 * NeonBadge.jsx — Small pill badge with neon color variants
 */

const variants = {
  pink:   'bg-pink-500/10 text-pink-400 border-pink-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  cyan:   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  gold:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  green:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  gray:   'bg-white/5 text-white/50 border-white/10',
};

export default function NeonBadge({ children, color = 'purple', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${variants[color]} ${className}`}
    >
      {children}
    </span>
  );
}
