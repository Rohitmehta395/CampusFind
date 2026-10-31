/**
 * HeroIllustration - Daylight notebook style hero visual.
 * Features soft pastel floating shapes, campus map compass, notebook, and search radar.
 */
export default function HeroIllustration({ className = 'w-full max-w-[480px] h-auto' }) {
  return (
    <svg
      viewBox="0 0 540 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Soft background glow */}
        <filter id="hero-soft-shadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="16" stdDeviation="24" floodColor="#0069e0" floodOpacity="0.08" />
        </filter>
        <filter id="card-shadow" x="-5%" y="-5%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#0a0d12" floodOpacity="0.06" />
        </filter>
        <linearGradient id="iris-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#479dff" />
          <stop offset="100%" stopColor="#0069e0" />
        </linearGradient>
        <linearGradient id="solar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff9e0" />
          <stop offset="100%" stopColor="#ffeca3" />
        </linearGradient>
        <linearGradient id="lavender-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4ebff" />
          <stop offset="100%" stopColor="#e4ccff" />
        </linearGradient>
        <linearGradient id="mint-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8faf0" />
          <stop offset="100%" stopColor="#d3f6e3" />
        </linearGradient>
      </defs>

      {/* Ambient background pastel blobs */}
      <circle cx="270" cy="200" r="160" fill="#cce7ff" fillOpacity="0.45" />
      <circle cx="130" cy="120" r="70" fill="#f1e6ff" fillOpacity="0.7" />
      <circle cx="430" cy="150" r="85" fill="#d3f6e3" fillOpacity="0.65" />
      <circle cx="390" cy="300" r="60" fill="#fff2be" fillOpacity="0.75" />

      {/* Main Base Card - Daylight Notebook */}
      <g filter="url(#hero-soft-shadow)">
        <rect
          x="80"
          y="70"
          width="380"
          height="260"
          rx="32"
          fill="#fafdff"
          stroke="#e8f1f8"
          strokeWidth="2"
        />

        {/* Notebook grid lines */}
        <line x1="120" y1="130" x2="420" y2="130" stroke="#ebf5ff" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="120" y1="170" x2="420" y2="170" stroke="#ebf5ff" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="120" y1="210" x2="420" y2="210" stroke="#ebf5ff" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="120" y1="250" x2="420" y2="250" stroke="#ebf5ff" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="120" y1="290" x2="420" y2="290" stroke="#ebf5ff" strokeWidth="2" strokeDasharray="4 4" />
      </g>

      {/* Radar Map Mesh in Card */}
      <g transform="translate(110, 100)">
        {/* Radar rings */}
        <circle cx="160" cy="100" r="80" stroke="#0069e0" strokeOpacity="0.12" strokeWidth="1.5" />
        <circle cx="160" cy="100" r="50" stroke="#0069e0" strokeOpacity="0.2" strokeWidth="1.5" />
        <circle cx="160" cy="100" r="22" stroke="#0069e0" strokeOpacity="0.3" strokeWidth="1.5" fill="#cce7ff" fillOpacity="0.3" />
        <circle cx="160" cy="100" r="5" fill="#0069e0" />

        {/* Radar scan beam */}
        <path d="M160 100 L235 65 A80 80 0 0 0 160 20 Z" fill="#0069e0" fillOpacity="0.08" />

        {/* Campus Landmark nodes */}
        {/* Node 1: Library */}
        <circle cx="210" cy="70" r="7" fill="#be123c" />
        <circle cx="210" cy="70" r="14" stroke="#fecdd3" strokeWidth="2" />
        {/* Node 2: CS Hall */}
        <circle cx="120" cy="130" r="6" fill="#047857" />
        <circle cx="120" cy="130" r="12" stroke="#a7f3d0" strokeWidth="2" />
        {/* Node 3: Student Union */}
        <circle cx="130" cy="65" r="5" fill="#7c3aed" />

        {/* Proximity line */}
        <line x1="120" y1="130" x2="210" y2="70" stroke="#0069e0" strokeWidth="2" strokeDasharray="3 3" />
      </g>

      {/* Floating Card 1: 96% Match Notification (Top Right) */}
      <g filter="url(#card-shadow)" transform="translate(340, 45)">
        <rect x="0" y="0" width="165" height="66" rx="20" fill="#ffffff" stroke="#e8f1f8" strokeWidth="1.5" />
        <circle cx="28" cy="33" r="15" fill="#d3f6e3" />
        <path d="M23 33 L26 36 L33 29" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="52" y="28" fill="#0a0d12" fontSize="12" fontWeight="600" fontFamily="sans-serif">96% Proximity</text>
        <text x="52" y="44" fill="#047857" fontSize="10" fontWeight="500" fontFamily="sans-serif">High confidence match</text>
      </g>

      {/* Floating Card 2: Safe Handover Badge (Bottom Left) */}
      <g filter="url(#card-shadow)" transform="translate(35, 240)">
        <rect x="0" y="0" width="175" height="74" rx="20" fill="#ffffff" stroke="#e8f1f8" strokeWidth="1.5" />
        <rect x="14" y="18" width="36" height="36" rx="12" fill="#181d27" />
        {/* Key icon */}
        <circle cx="32" cy="32" r="6" stroke="#fff2be" strokeWidth="2" />
        <path d="M36 34 L43 41 M40 38 L42 36" stroke="#fff2be" strokeWidth="2" strokeLinecap="round" />
        <text x="58" y="34" fill="#0a0d12" fontSize="12" fontWeight="600" fontFamily="sans-serif">Key Recovered</text>
        <text x="58" y="49" fill="#93979f" fontSize="10" fontFamily="sans-serif">Main Library Desk</text>
      </g>

      {/* Floating Compass Brand Coin (Center-Bottom) */}
      <g filter="url(#card-shadow)" transform="translate(245, 290)">
        <circle cx="28" cy="28" r="28" fill="#181d27" />
        <circle cx="28" cy="28" r="24" stroke="#3b3d41" strokeWidth="1.5" />
        <circle cx="28" cy="28" r="18" stroke="#fafdff" strokeWidth="1.2" strokeDasharray="3 3" />
        <polygon points="28,14 33,26 28,24 23,26" fill="#0099ff" />
        <polygon points="28,42 33,30 28,32 23,30" fill="#fafdff" fillOpacity="0.75" />
      </g>
    </svg>
  )
}

