interface ZklyLogoProps {
  className?: string;
  compact?: boolean;
}

export default function ZklyLogo({ className = '', compact = false }: ZklyLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        aria-hidden="true"
        viewBox="0 0 44 44"
        className="h-10 w-10 shrink-0"
        fill="none"
      >
        <rect x="4" y="4" width="36" height="36" rx="12" fill="url(#zkly-bg)" />
        <path
          d="M13 15.5h18L20 28.5h11"
          stroke="white"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 29c3.5-5 7.5-9.5 12-13.5"
          stroke="#F9D66B"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.95"
        />
        <defs>
          <linearGradient id="zkly-bg" x1="4" y1="4" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0f766e" />
            <stop offset="1" stopColor="#155e75" />
          </linearGradient>
        </defs>
      </svg>

      {!compact && (
        <div className="leading-none">
          <span className="block text-lg font-semibold tracking-[0.18em] text-teal-950">
            ZKLY
          </span>
          <span className="block pt-1 text-[10px] uppercase tracking-[0.3em] text-stone-400">
            Bitcoin proofs
          </span>
        </div>
      )}
    </div>
  );
}
