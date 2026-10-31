import { Link } from 'react-router-dom'

/**
 * Reusable card component displaying a summary of an item.
 * Links directly to the item's detail view at /items/{id}.
 *
 * Design: Geniestudio bone-white card (#fafdff) at 32px radius, with
 * pill-shaped status badges, pastel washes for FOUND, rose tint for LOST.
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
      className="group flex flex-col overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0069e0] transition-transform hover:-translate-y-0.5"
      style={{
        background: '#fafdff',
        borderRadius: 32,
        boxShadow: 'rgba(4, 69, 144, 0.05) 0px 4px 16px 0px',
      }}
    >
      {/* Visual Image Container */}
      <div
        className="h-44 flex items-center justify-center relative overflow-hidden"
        style={{
          background: isLost ? '#fff1f2' : '#d3f6e3',
          borderRadius: '32px 32px 0 0',
        }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            style={{ borderRadius: '32px 32px 0 0' }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5">
            <svg
              className="w-8 h-8 opacity-30"
              fill="none"
              stroke={isLost ? '#be123c' : '#047857'}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: isLost ? '#be123c' : '#047857', opacity: 0.5 }}
            >
              No Photo
            </span>
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
            style={
              isLost
                ? { background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }
                : { background: '#d3f6e3', color: '#047857', border: '1px solid #a7f3d0' }
            }
          >
            {item.type}
          </span>

          {isResolved && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
              style={{ background: '#fafdff', color: '#93979f', border: '1px solid #e8f1f8' }}
            >
              {item.status}
            </span>
          )}
        </div>

        {/* Category chip */}
        {item.category && (
          <div className="absolute top-3 right-3">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ background: '#fafdff', color: '#535862' }}
            >
              {item.category}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h3
            className="text-sm font-medium line-clamp-1 group-hover:opacity-70 transition-opacity"
            style={{ color: '#0a0d12', letterSpacing: '-0.01em' }}
          >
            {item.title}
          </h3>
          {item.description ? (
            <p className="mt-1 text-xs line-clamp-2 leading-relaxed" style={{ color: '#93979f' }}>
              {item.description}
            </p>
          ) : (
            <p className="mt-1 text-xs italic" style={{ color: '#93979f', opacity: 0.6 }}>
              No additional description provided.
            </p>
          )}
        </div>

        {/* Meta Footer */}
        <div
          className="pt-3 border-t flex items-center justify-between text-xs"
          style={{ borderColor: '#e8f1f8' }}
        >
          <div
            className="flex items-center gap-1.5 truncate max-w-[65%]"
            title={item.locationText || 'Location unspecified'}
          >
            <svg
              className="w-3 h-3 shrink-0"
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
            <span className="truncate" style={{ color: '#535862' }}>
              {item.locationText || 'Campus Area'}
            </span>
          </div>

          <span className="shrink-0" style={{ color: '#93979f' }}>
            {item.eventDate || (item.createdAt ? item.createdAt.substring(0, 10) : '')}
          </span>
        </div>
      </div>
    </Link>
  )
}
