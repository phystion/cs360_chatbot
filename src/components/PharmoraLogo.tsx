interface Props {
  size?: number;
  className?: string;
  white?: boolean;
}

export function PharmoraLogo({ size = 40, className, white = false }: Props) {
  if (white) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Pharmora"
      >
        <g fill="white">
          <rect x="3" y="27" width="8" height="10" rx="2" />
          <rect x="9" y="11" width="8" height="9" rx="2" transform="rotate(-35 13 15)" />
          <rect x="9" y="44" width="8" height="9" rx="2" transform="rotate(35 13 49)" />
        </g>
        <circle cx="32" cy="32" r="20" fill="white" />
        <circle cx="32" cy="32" r="11" fill="#7c3aed" />
        <path d="M44 44 Q52 50 56 56 L48 56 Q42 52 40 48 Z" fill="white" />
        <g transform="translate(48 14)">
          <rect x="-3" y="-9" width="6" height="18" rx="2" fill="white" />
          <rect x="-9" y="-3" width="18" height="6" rx="2" fill="white" />
        </g>
        <path d="M14 42 L24 42 L19 50 Z" fill="white" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Pharmora"
    >
      <defs>
        <linearGradient id="pl-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b5cf6" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="pl-purple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="pl-pink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f9a8d4" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="pl-teal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
        <radialGradient id="pl-shine" cx="0.3" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* Gear teeth (left) */}
      <g fill="url(#pl-blue)">
        <rect x="3" y="27" width="8" height="10" rx="2" />
        <rect x="9" y="11" width="8" height="9" rx="2" transform="rotate(-35 13 15)" />
        <rect x="9" y="44" width="8" height="9" rx="2" transform="rotate(35 13 49)" />
      </g>

      {/* Main ring — left half blue, right half purple */}
      <circle cx="32" cy="32" r="20" fill="url(#pl-blue)" />
      <path
        d="M32 12 A20 20 0 0 1 32 52 L32 32 Z"
        fill="url(#pl-purple)"
      />

      {/* Inner cutout */}
      <circle cx="32" cy="32" r="11" fill="#f1f5f9" />

      {/* Lower-right tail (the Q-leg) */}
      <path
        d="M44 44 Q52 50 56 56 L48 56 Q42 52 40 48 Z"
        fill="url(#pl-purple)"
      />

      {/* Pink plus (top-right) */}
      <g transform="translate(48 14)">
        <rect x="-3" y="-9" width="6" height="18" rx="2" fill="url(#pl-pink)" />
        <rect x="-9" y="-3" width="18" height="6" rx="2" fill="url(#pl-pink)" />
      </g>

      {/* Teal triangle accent (bottom-left) */}
      <path d="M14 42 L24 42 L19 50 Z" fill="url(#pl-teal)" />

      {/* Subtle shine highlight */}
      <circle cx="32" cy="32" r="20" fill="url(#pl-shine)" />
    </svg>
  );
}
