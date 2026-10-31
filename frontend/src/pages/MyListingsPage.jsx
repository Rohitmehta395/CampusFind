import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyItemsRequest } from '../api/items'
import ItemCard from '../components/ItemCard'

/**
 * Protected My Listings page displaying all items reported by the authenticated user.
 * Formatted with Geniestudio pastel telemetry cards, clean typography, and responsive grid.
 */
export default function MyListingsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    getMyItemsRequest()
      .then((data) => {
        if (isMounted) {
          setItems(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.error || err.message || 'Failed to load your listings')
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const lostCount = items.filter((i) => i.type === 'LOST').length
  const foundCount = items.filter((i) => i.type === 'FOUND').length
  const resolvedCount = items.filter((i) => i.status === 'RESOLVED').length

  return (
    <div
      className="w-full min-h-screen px-5 sm:px-8 py-10"
      style={{ background: '#ebf5ff' }}
    >
      <div className="max-w-[1200px] mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b" style={{ borderColor: '#e8f1f8' }}>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-medium tracking-tight"
              style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
            >
              My Reported Possessions
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#93979f' }}>
              Monitor and manage your campus lost and found submissions, claims, and automated matches.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/report-lost"
              className="btn-charcoal-sm"
            >
              + Report Lost
            </Link>
            <Link
              to="/report-found"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-colors hover:bg-white"
              style={{ borderColor: '#d5e6f0', color: '#535862', background: '#fafdff' }}
            >
              + Report Found
            </Link>
          </div>
        </div>

        {/* Quick Summary Telemetry */}
        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              className="p-6 rounded-[24px]"
              style={{ background: '#f1e6ff' }}
            >
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#7c3aed' }}>
                Total Listings
              </span>
              <p
                className="text-3xl font-medium mt-1"
                style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
              >
                {items.length}
              </p>
            </div>

            <div
              className="p-6 rounded-[24px]"
              style={{ background: '#fff1f2' }}
            >
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#be123c' }}>
                Lost Items
              </span>
              <p
                className="text-3xl font-medium mt-1"
                style={{ color: '#be123c', letterSpacing: '-0.02em' }}
              >
                {lostCount}
              </p>
            </div>

            <div
              className="p-6 rounded-[24px]"
              style={{ background: '#d3f6e3' }}
            >
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#047857' }}>
                Found Items
              </span>
              <p
                className="text-3xl font-medium mt-1"
                style={{ color: '#047857', letterSpacing: '-0.02em' }}
              >
                {foundCount}
              </p>
            </div>

            <div
              className="p-6 rounded-[24px]"
              style={{ background: '#cce7ff' }}
            >
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#0069e0' }}>
                Resolved Returns
              </span>
              <p
                className="text-3xl font-medium mt-1"
                style={{ color: '#0069e0', letterSpacing: '-0.02em' }}
              >
                {resolvedCount}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-4">
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium"
              style={{ background: '#fafdff', color: '#535862' }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#0069e0' }} />
              Loading your reported items…
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            role="alert"
            className="p-8 rounded-[32px] text-center max-w-md mx-auto space-y-2"
            style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}
          >
            <p className="font-semibold text-sm">Unable to Load Your Listings</p>
            <p className="text-xs opacity-80">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <div
            className="py-16 text-center p-8 max-w-md mx-auto space-y-4 rounded-[32px]"
            style={{
              background: '#fafdff',
              boxShadow: 'rgba(4, 69, 144, 0.05) 0px 4px 16px 0px',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: '#ebf5ff', color: '#93979f' }}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-medium" style={{ color: '#0a0d12' }}>
                No reported possessions yet
              </h3>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: '#93979f' }}>
                When you post a lost report or log a found possession, it will be organized here with automated match alerts.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link to="/report-lost" className="btn-charcoal-sm">
                Report Lost Item
              </Link>
              <Link
                to="/report-found"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-colors hover:bg-white"
                style={{ borderColor: '#d5e6f0', color: '#535862', background: '#fafdff' }}
              >
                Report Found Item
              </Link>
            </div>
          </div>
        )}

        {/* Listings Grid */}
        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
