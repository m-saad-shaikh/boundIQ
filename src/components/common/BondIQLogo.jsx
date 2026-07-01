/**
 * BondIQLogo.jsx
 * Reusable BondIQ brand logo component — glowing AI heart with circuit nodes.
 * Matches the app icon design exactly.
 */

/**
 * @param {number} size   - pixel size of the square icon (default 32)
 * @param {boolean} showText - show "BondIQ" text next to icon (default true)
 * @param {'sm'|'md'|'lg'} textSize - text size variant
 */
export default function BondIQLogo({ size = 32, showText = true, textSize = 'md' }) {
  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-2.5" style={{ userSelect: 'none' }}>
      {/* Icon */}
      <div style={{ width: size, height: size, flexShrink: 0 }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          width={size}
          height={size}
        >
          <defs>
            <radialGradient id="bgG" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a0a2e" />
              <stop offset="100%" stopColor="#050510" />
            </radialGradient>
            <radialGradient id="hG" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ff6eb0" />
              <stop offset="50%" stopColor="#ff2d78" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </radialGradient>
            <radialGradient id="aG" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff2d78" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>
            <filter id="sg" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Background */}
          <circle cx="50" cy="50" r="50" fill="url(#bgG)" />
          <circle cx="50" cy="50" r="46" fill="url(#aG)" />

          {/* Circuit lines */}
          <g opacity="0.45" stroke="#8b5cf6" strokeWidth="0.7" fill="none">
            <line x1="50" y1="22" x2="50" y2="14" />
            <line x1="50" y1="14" x2="44" y2="10" />
            <line x1="50" y1="14" x2="56" y2="10" />
            <line x1="34" y1="30" x2="24" y2="24" />
            <line x1="24" y1="24" x2="20" y2="18" />
            <line x1="66" y1="30" x2="76" y2="24" />
            <line x1="76" y1="24" x2="80" y2="18" />
            <line x1="28" y1="55" x2="18" y2="55" />
            <line x1="18" y1="55" x2="14" y2="50" />
            <line x1="72" y1="55" x2="82" y2="55" />
            <line x1="82" y1="55" x2="86" y2="50" />
            <line x1="50" y1="75" x2="50" y2="86" />
            <line x1="50" y1="86" x2="44" y2="90" />
            <line x1="50" y1="86" x2="56" y2="90" />
          </g>

          {/* Purple nodes */}
          <g fill="#8b5cf6" opacity="0.7">
            <circle cx="44" cy="10" r="1.5" />
            <circle cx="56" cy="10" r="1.5" />
            <circle cx="20" cy="18" r="1.5" />
            <circle cx="80" cy="18" r="1.5" />
            <circle cx="14" cy="50" r="1.5" />
            <circle cx="86" cy="50" r="1.5" />
            <circle cx="44" cy="90" r="1.5" />
            <circle cx="56" cy="90" r="1.5" />
          </g>

          {/* Pink accent nodes */}
          <g fill="#ff2d78" opacity="0.8">
            <circle cx="24" cy="24" r="2" />
            <circle cx="76" cy="24" r="2" />
            <circle cx="18" cy="55" r="2" />
            <circle cx="82" cy="55" r="2" />
            <circle cx="50" cy="86" r="2" />
          </g>

          {/* Glowing Heart */}
          <g filter="url(#sg)">
            <path
              d="M50 72 C50 72 26 57 26 40 C26 31 33 25 41 25 C45.5 25 49 27.5 50 29 C51 27.5 54.5 25 59 25 C67 25 74 31 74 40 C74 57 50 72 50 72Z"
              fill="url(#hG)"
              opacity="0.95"
            />
          </g>

          {/* Heart shine highlight */}
          <path
            d="M41 30 C38 32 36 36 36.5 40"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.35"
          />
        </svg>
      </div>

      {/* Brand text */}
      {showText && (
        <span
          className={`font-display font-bold text-white ${textSizeMap[textSize]}`}
          style={{
            background: 'linear-gradient(90deg, #ffffff 0%, #e8d5ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          BondIQ
        </span>
      )}
    </div>
  );
}
