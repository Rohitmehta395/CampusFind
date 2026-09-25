import { Link } from 'react-router-dom'

/**
 * Reusable card component displaying a summary of an item.
 * Links directly to the item's detail view at /items/{id}.
 * Prepared for Phase 7 image upload integration with a placeholder visual container.
 *
 * @param {Object} props
 * @param {Object} props.item - The item domain object
 */
export default function ItemCard({ item }) {
  const isLost = item.type === 'LOST'
  const isResolved = item.status && item.status !== 'ACTIVE'

  return (
    <Link
      to={`/items/${item.id}`}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      {/* Visual Placeholder / Image Area (Phase 7 ready) */}
      <div className="h-36 bg-slate-100 flex items-center justify-center text-slate-400 relative border-b border-slate-100 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
            <svg
              className="w-8 h-8 opacity-60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs font-medium text-slate-400">No Image</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
              isLost
                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            {item.type}
          </span>

          {isResolved && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-200 text-slate-700 border border-slate-300">
              {item.status}
            </span>
          )}
        </div>

        {/* Category Badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/90 text-slate-700 shadow-xs backdrop-blur-xs">
            {item.category}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {item.title}
          </h3>

          {item.description && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Meta Footer */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 truncate max-w-[65%]">
            <svg
              className="w-3.5 h-3.5 text-slate-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
            <span className="truncate">
              {item.locationText || 'Location unspecified'}
            </span>
          </div>

          <div className="text-right text-slate-400 shrink-0">
            {item.eventDate || (item.createdAt ? item.createdAt.substring(0, 10) : '')}
          </div>
        </div>
      </div>
    </Link>
  )
}
