import { Link } from 'react-router-dom'

/**
 * Reusable card component displaying a summary of an item.
 * Links directly to the item's detail view at /items/{id}.
 *
 * Design: Geniestudio daylight notebook card — Bone-white (#ffffff) surface,
 * subtle neutral image container with category glyph fallback (eliminating the noisy
 * alternating pink/green glare), elegant micro-status pills, and generous breathing room.
 *
 * @param {Object} props
 * @param {Object} props.item - The item domain object
 */
export default function ItemCard({ item }) {
  const isLost = item.type === 'LOST'
  const isResolved = item.status && item.status !== 'ACTIVE'

  // Refined category glyphs
  const categoryGlyphs = {
    'Electronics': '💻',
    'Bags & Backpacks': '🎒',
    'ID Cards & Wallets': '🪪',
    'Keys': '🔑',
    'Books & Notebooks': '📚',
    'Clothing & Apparel': '👕',
    'Jewelry & Watches': '⌚',
    'Bottles & Containers': '🧴',
    'Other': '📦',
  }
  const glyph = categoryGlyphs[item.category] || '📦'

  return (
    <Link
      to={`/items/${item.id}`}
      className="group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0069e0] border"
      style={{
        background: '#ffffff',
        borderRadius: '24px',
        borderColor: '#e8f1f8',
        boxShadow: 'rgba(4, 69, 144, 0.04) 0px 4px 16px 0px',
      }}
    >
      {/* ── Image or Elegant Neutral Placeholder ── */}
      <div
        className="h-44 sm:h-48 w-full relative overflow-hidden flex items-center justify-center transition-colors"
        style={{
          background: item.imageUrl ? '#181d27' : '#f4f8fb',
        }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 select-none">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-xs"
              style={{ background: '#ffffff', border: '1px solid #e8f1f8' }}
            >
              {glyph}
            </div>
            <span className="text-[11px] font-medium" style={{ color: '#93979f' }}>
              {item.category || 'Item'}
            </span>
          </div>
        )}

        {/* Top Floating Status Pill */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase shadow-xs backdrop-blur-md"
            style={
              isLost
                ? { background: 'rgba(255, 241, 242, 0.95)', color: '#be123c', border: '1px solid #fecdd3' }
                : { background: 'rgba(211, 246, 227, 0.95)', color: '#047857', border: '1px solid #a7f3d0' }
            }
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: isLost ? '#be123c' : '#047857' }}
            />
            {item.type}
          </span>

          {isResolved && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md"
              style={{ background: 'rgba(250, 253, 255, 0.9)', color: '#535862', border: '1px solid #e8f1f8' }}
            >
              Resolved
            </span>
          )}
        </div>

        {/* Category Pill (Top Right, if image exists) */}
        {item.imageUrl && item.category && (
          <div className="absolute top-3 right-3">
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-medium backdrop-blur-md shadow-xs"
              style={{ background: 'rgba(255, 255, 255, 0.92)', color: '#0a0d12' }}
            >
              {item.category}
            </span>
          </div>
        )}
      </div>

      {/* ── Card Body with Clean Typography ── */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-1.5">
          <h3
            className="text-sm font-semibold leading-snug line-clamp-1 group-hover:text-[#0069e0] transition-colors"
            style={{ color: '#0a0d12', letterSpacing: '-0.01em' }}
          >
            {item.title}
          </h3>

          <p
            className="text-xs line-clamp-2 leading-relaxed"
            style={{ color: '#535862' }}
          >
            {item.description || 'No additional description provided.'}
          </p>
        </div>

        {/* Card Footer: Landmark & Event Date */}
        <div
          className="pt-3 border-t flex items-center justify-between text-xs"
          style={{ borderColor: '#f1f5f9' }}
        >
          <div
            className="flex items-center gap-1.5 truncate max-w-[65%]"
            title={item.locationText || 'Campus Area'}
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: '#93979f' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="truncate text-xs font-medium" style={{ color: '#535862' }}>
              {item.locationText || 'Campus Area'}
            </span>
          </div>

          <span className="shrink-0 text-[11px] font-medium" style={{ color: '#93979f' }}>
            {item.eventDate || (item.createdAt ? item.createdAt.substring(0, 10) : '')}
          </span>
        </div>
      </div>
    </Link>
  )
}
