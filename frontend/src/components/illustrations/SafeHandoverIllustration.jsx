/**
 * SafeHandoverIllustration - Daylight graphic illustrating safe campus verification and handovers.
 */
export default function SafeHandoverIllustration({ className = 'w-full max-w-[420px] h-auto' }) {
  return (
    <svg
      viewBox="0 0 460 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <filter id="handover-shadow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="12" stdDeviation="20" floodColor="#044590" floodOpacity="0.07" />
        </filter>
      </defs>

      {/* Pastel background blobs */}
      <circle cx="230" cy="170" r="130" fill="#ebf5ff" />
      <circle cx="340" cy="110" r="65" fill="#d3f6e3" fillOpacity="0.7" />
      <circle cx="110" cy="220" r="55" fill="#f1e6ff" fillOpacity="0.75" />

      {/* Campus Reception Desk Card */}
      <g filter="url(#handover-shadow)">
        <rect x="50" y="60" width="360" height="220" rx="32" fill="#fafdff" stroke="#e8f1f8" strokeWidth="2" />
      </g>

      {/* Verified Shield Badge Header */}
      <g transform="translate(198, 40)">
        <circle cx="32" cy="32" r="32" fill="#181d27" />
        <path
          d="M32 18 L42 22 V31 C42 38 37 43 32 46 C27 43 22 38 22 31 V22 Z"
          fill="#0069e0"
        />
        <path d="M28 31 L31 34 L37 28" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Interactive Verification Steps Inside Card */}
      {/* Step 1: Proof Submission */}
      <g transform="translate(80, 125)">
        <rect x="0" y="0" width="85" height="105" rx="16" fill="#ebf5ff" />
        <circle cx="42.5" cy="32" r="16" fill="#ffffff" />
        <text x="42.5" y="36" textAnchor="middle" fontSize="13">🔒</text>
        <text x="42.5" y="65" textAnchor="middle" fill="#0a0d12" fontSize="10" fontWeight="600" fontFamily="sans-serif">Private Proof</text>
        <text x="42.5" y="80" textAnchor="middle" fill="#535862" fontSize="9" fontFamily="sans-serif">Serial / Marks</text>
      </g>

      {/* Arrow 1 */}
      <path d="M175 178 L195 178" stroke="#0069e0" strokeWidth="2" strokeDasharray="3 3" />
      <polygon points="195,175 200,178 195,181" fill="#0069e0" />

      {/* Step 2: Verification Check */}
      <g transform="translate(208, 125)">
        <rect x="0" y="0" width="85" height="105" rx="16" fill="#ebf5ff" />
        <circle cx="42.5" cy="32" r="16" fill="#ffffff" />
        <text x="42.5" y="36" textAnchor="middle" fontSize="13">📋</text>
        <text x="42.5" y="65" textAnchor="middle" fill="#0a0d12" fontSize="10" fontWeight="600" fontFamily="sans-serif">Finder Verify</text>
        <text x="42.5" y="80" textAnchor="middle" fill="#535862" fontSize="9" fontFamily="sans-serif">Approve Claim</text>
      </g>

      {/* Arrow 2 */}
      <path d="M303 178 L323 178" stroke="#047857" strokeWidth="2" strokeDasharray="3 3" />
      <polygon points="323,175 328,178 323,181" fill="#047857" />

      {/* Step 3: Safe Handover */}
      <g transform="translate(335, 125)">
        <rect x="0" y="0" width="85" height="105" rx="16" fill="#d3f6e3" />
        <circle cx="42.5" cy="32" r="16" fill="#ffffff" />
        <text x="42.5" y="36" textAnchor="middle" fontSize="13">🤝</text>
        <text x="42.5" y="65" textAnchor="middle" fill="#047857" fontSize="10" fontWeight="600" fontFamily="sans-serif">Safe Return</text>
        <text x="42.5" y="80" textAnchor="middle" fill="#065f46" fontSize="9" fontFamily="sans-serif">Helpdesk Desk</text>
      </g>

      {/* Badge at Bottom */}
      <g transform="translate(145, 250)">
        <rect x="0" y="0" width="170" height="24" rx="12" fill="#181d27" />
        <text x="85" y="16" textAnchor="middle" fill="#fafdff" fontSize="10" fontWeight="500" fontFamily="sans-serif">
          100% Student Union Protocol
        </text>
      </g>
    </svg>
  )
}

