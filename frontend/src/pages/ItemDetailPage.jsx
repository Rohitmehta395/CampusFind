import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getItemByIdRequest } from '../api/items'

/**
 * Public item detail page presenting the full metadata and description of a single item.
 * Supports public viewing at /items/:id.
 */
export default function ItemDetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isNotFound, setIsNotFound] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError('')
    setIsNotFound(false)

    getItemByIdRequest(id)
      .then((data) => {
        if (isMounted) {
          setItem(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (err.response?.status === 404) {
            setIsNotFound(true)
          } else {
            setError(err.response?.data?.error || err.message || 'Failed to load item detail')
          }
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 animate-pulse" />
          Loading item details...
        </div>
      </div>
    )
  }

  if (isNotFound) {
    return (
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center border border-slate-200">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Item Not Found</h2>
        <p className="mt-1 text-sm text-slate-500">
          The item with ID #{id} does not exist or may have been removed.
        </p>
        <div className="mt-6">
          <Link
            to="/browse"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md w-full bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700">
        <h2 className="text-base font-semibold">Error Loading Item</h2>
        <p className="mt-1 text-xs text-rose-600">{error}</p>
        <div className="mt-4">
          <Link
            to="/browse"
            className="text-xs font-semibold text-rose-800 hover:underline"
          >
            &larr; Return to Browse
          </Link>
        </div>
      </div>
    )
  }

  if (!item) return null

  const isLost = item.type === 'LOST'

  return (
    <div className="max-w-3xl w-full mx-auto py-4">
      {/* Breadcrumb / Back Link */}
      <div className="mb-4">
        <Link
          to="/browse"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Browse
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        {/* Header / Type Banner */}
        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  isLost
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                {item.type} ITEM
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {item.category}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  item.status === 'ACTIVE'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {item.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {item.title}
            </h1>
          </div>

          <div className="text-right text-xs text-slate-400 shrink-0">
            <div>Report #{item.id}</div>
            {item.createdAt && (
              <div className="mt-0.5">
                Reported {item.createdAt.substring(0, 10)}
              </div>
            )}
          </div>
        </div>

        {/* Visual Container (Phase 7 Image Ready) */}
        <div className="h-64 sm:h-80 bg-slate-50 border-b border-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
              <svg
                className="w-12 h-12 opacity-40"
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
              <span className="text-xs font-medium text-slate-400">
                No photo uploaded for this report
              </span>
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                Location
              </span>
              <span className="text-slate-800 font-medium">
                {item.locationText || 'Not specified'}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                Date {isLost ? 'Lost' : 'Found'}
              </span>
              <span className="text-slate-800 font-medium">
                {item.eventDate || 'Not specified'}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                Color
              </span>
              <span className="text-slate-800 font-medium">
                {item.color || 'Not specified'}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                Brand / Manufacturer
              </span>
              <span className="text-slate-800 font-medium">
                {item.brand || 'Not specified'}
              </span>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Item Description
            </h3>
            <div className="text-sm text-slate-700 leading-relaxed bg-white border border-slate-100 p-4 rounded-lg">
              {item.description ? (
                <p className="whitespace-pre-line">{item.description}</p>
              ) : (
                <p className="text-slate-400 italic">No additional description provided.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
