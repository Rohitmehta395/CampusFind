import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getItemByIdRequest } from '../api/items'
import { getItemMatchesRequest } from '../api/matches'
import { useAuth } from '../context/AuthContext'

/**
 * Public item detail page presenting the full metadata and description of a single item.
 * Supports public viewing at /items/:id.
 * When the currently authenticated user is the item's reporter, securely fetches and displays
 * potential matches computed by the CampusFind Smart Matching Engine.
 */
export default function ItemDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isNotFound, setIsNotFound] = useState(false)

  // Matches state (owner only)
  const [matches, setMatches] = useState([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [matchesError, setMatchesError] = useState('')

  // Determine ownership: authenticated user's ID must match item's reporterId
  const isOwner = Boolean(user && item && Number(user.id) === Number(item.reporterId))

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

  // Fetch matches only when viewer is verified as the item's reporter
  const fetchMatches = useCallback(() => {
    if (!isOwner || !item?.id) {
      setMatches([])
      setMatchesLoading(false)
      return
    }

    setMatchesLoading(true)
    setMatchesError('')

    getItemMatchesRequest(item.id)
      .then((data) => {
        setMatches(data?.matches || [])
        setMatchesLoading(false)
      })
      .catch((err) => {
        setMatchesError(err.response?.data?.error || err.message || 'Failed to load potential matches')
        setMatchesLoading(false)
      })
  }, [isOwner, item?.id])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

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

      {/* Potential Matches Section - Strictly Owner-Gated */}
      {isOwner && (
        <section className="mt-8 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Potential Matches
                </h2>
                <p className="text-xs text-slate-500">
                  Automatically generated by Smart Matching Engine
                </p>
              </div>
            </div>
            {!matchesLoading && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {matches.length} {matches.length === 1 ? 'match' : 'matches'}
              </span>
            )}
          </div>

          {matchesLoading && (
            <div className="py-8 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Scanning for potential matches...
              </div>
            </div>
          )}

          {matchesError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center justify-between">
              <span>{matchesError}</span>
              <button
                type="button"
                onClick={fetchMatches}
                className="font-semibold underline hover:no-underline text-rose-800"
              >
                Retry
              </button>
            </div>
          )}

          {!matchesLoading && !matchesError && matches.length === 0 && (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                No potential matches found yet
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                The smart matching engine continuously scans newly reported lost and found items.
                When a high-confidence counterpart is submitted, it will appear here automatically.
              </p>
            </div>
          )}

          {!matchesLoading && !matchesError && matches.length > 0 && (
            <div className="space-y-4">
              {matches.map((m) => {
                const scorePercent = Math.round((m.score || 0) * 100)
                const isStrong = (m.score || 0) >= 0.85
                const other = m.matchedItem || {}
                const isOtherLost = other.type === 'LOST'

                return (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      {/* Image Thumbnail */}
                      {other.imageUrl ? (
                        <img
                          src={other.imageUrl}
                          alt={other.title || 'Matched item'}
                          className="w-16 h-16 sm:w-18 sm:h-18 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
                          <svg
                            className="w-6 h-6 opacity-50"
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
                          <span className="text-[10px] text-slate-400 mt-0.5">No image</span>
                        </div>
                      )}

                      {/* Item Details */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                              isOtherLost
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {other.type || 'ITEM'}
                          </span>
                          {other.category && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {other.category}
                            </span>
                          )}
                          {other.brand && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                              {other.brand}
                            </span>
                          )}
                        </div>

                        <Link
                          to={`/items/${other.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors text-base truncate block"
                        >
                          {other.title || 'Untitled Item'}
                        </Link>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                          {other.color && <span>Color: {other.color}</span>}
                          {other.eventDate && <span>Date: {other.eventDate}</span>}
                          {other.locationText && <span>Location: {other.locationText}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Score Badges & Action Link */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-wide ${
                            isStrong
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {scorePercent}% Match
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isStrong
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}
                        >
                          {isStrong ? 'Strong Match' : 'Possible Match'}
                        </span>
                      </div>

                      <Link
                        to={`/items/${other.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
                      >
                        View Details
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
