/**
 * KEDA Logo Component
 * Gradient K harfi — mor/mavi
 */

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="keda-grad" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="55%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      {/* Sol dikey çubuk */}
      <rect x="18" y="12" width="20" height="76" rx="10" fill="url(#keda-grad)" />
      {/* Üst çapraz kol */}
      <path
        d="M38 50 L72 14 Q80 8 84 16 L52 50Z"
        fill="url(#keda-grad)"
        opacity="0.95"
      />
      {/* Alt çapraz kol */}
      <path
        d="M38 50 L72 86 Q80 92 84 84 L52 50Z"
        fill="url(#keda-grad)"
        opacity="0.85"
      />
    </svg>
  );
}
