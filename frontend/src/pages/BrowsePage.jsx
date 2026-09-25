import { useState, useEffect } from 'react'
import { getAllItemsRequest } from '../api/items'
import ItemCard from '../components/ItemCard'

/**
 * Public browse page displaying all lost and found listings in a responsive grid.
 */
export default function BrowsePage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    getAllItemsRequest()
      .then((data) => {
        if (isMounted) {
          setItems(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.error || err.message || 'Failed to load items')
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="max-w-5xl w-full mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Browse Lost &amp; Found
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View all recent lost and found reports across campus
          </p>
        </div>

        {!loading && !error && (
          <span className="self-start sm:self-auto text-xs font-medium px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
            {items.length} {items.length === 1 ? 'item' : 'items'} listed
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 animate-pulse" />
            Loading campus listings...
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div
          role="alert"
          className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center text-rose-700 max-w-md mx-auto"
        >
          <p className="font-semibold text-sm">Unable to load listings</p>
          <p className="mt-1 text-xs text-rose-600">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8 max-w-md mx-auto">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            No items reported yet
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Check back later or report a lost or found item to help fellow students.
          </p>
        </div>
      )}

      {/* Listings Grid */}
      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
