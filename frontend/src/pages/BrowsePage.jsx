import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAllItemsRequest } from '../api/items'
import ItemCard from '../components/ItemCard'
import ItemsMap from '../components/ItemsMap'
import { CATEGORY_OPTIONS } from '../constants/categories'

export const PAGE_LIMIT = 12

/**
 * Public browse page displaying lost and found listings with search, category/type filtering,
 * URL search parameter sync, campus map integration, and deterministic pagination controls.
 *
 * Design: Geniestudio — sky-tint canvas (#ebf5ff), bone-white (#fafdff) search console
 * at 32px radius, 16px radius inputs, charcoal CTA button, pastel filter chips.
 */
export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize filter state from URL query parameters if present
  const initialQ = searchParams.get('q') || ''
  const initialCategory = searchParams.get('category') || ''
  const initialType = searchParams.get('type') || ''
  const initialPage = parseInt(searchParams.get('page') || '1', 10)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter & Search local state
  const [searchInput, setSearchInput] = useState(initialQ)
  const [appliedSearch, setAppliedSearch] = useState(initialQ)
  const [category, setCategory] = useState(initialCategory)
  const [type, setType] = useState(initialType)
  const [page, setPage] = useState(isNaN(initialPage) ? 1 : initialPage)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const hasActiveFilters = Boolean(appliedSearch || category || type)

  // Sync state to URL params cleanly
  useEffect(() => {
    const params = {}
    if (appliedSearch) params.q = appliedSearch
    if (category) params.category = category
    if (type) params.type = type
    if (page > 1) params.page = String(page)
    setSearchParams(params, { replace: true })
  }, [appliedSearch, category, type, page, setSearchParams])

  // Fetch items whenever applied search, category, type, or page changes
  useEffect(() => {
    let isMounted = true

    const params = { page, limit: PAGE_LIMIT }
    if (appliedSearch) params.q = appliedSearch
    if (category) params.category = category
    if (type) params.type = type

    getAllItemsRequest(params)
      .then((data) => {
        if (isMounted) {
          setItems(data.items || [])
          setTotal(data.total || 0)
          setTotalPages(data.totalPages || 1)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.error || err.message || 'Failed to load items')
          setLoading(false)
        }
      })

    return () => { isMounted = false }
  }, [appliedSearch, category, type, page])

  // Explicit handlers that update filter state and reset page to 1
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setAppliedSearch(searchInput.trim())
    setPage(1)
  }

  const handleCategoryChange = (e) => {
    setLoading(true)
    setCategory(e.target.value)
    setPage(1)
  }

  const handleTypeChange = (e) => {
    setLoading(true)
    setType(e.target.value)
    setPage(1)
  }

  const handleClearFilters = () => {
    setLoading(true)
    setSearchInput('')
    setAppliedSearch('')
    setCategory('')
    setType('')
    setPage(1)
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setLoading(true)
      setPage((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      setLoading(true)
      setPage((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div
      className="w-full min-h-screen px-5 sm:px-8 py-10"
      style={{ background: '#ebf5ff' }}
    >
      <div className="max-w-[1200px] mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-medium"
              style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
            >
              Campus Lost &amp; Found Directory
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#93979f' }}>
              Real-time public database of reported lost items and verified student finds.
            </p>
          </div>

          {!loading && !error && (
            <span
              className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0"
              style={{ background: '#fafdff', color: '#535862' }}
            >
              <strong style={{ color: '#0a0d12' }}>{total}</strong>
              &nbsp;{total === 1 ? 'item' : 'items'}&nbsp;
              {hasActiveFilters ? 'matching filters' : 'registered'}
            </span>
          )}
        </div>

        {/* ── Search & Filter Console ── */}
        <div
          className="p-5 sm:p-6 space-y-4 rounded-[32px]"
          style={{ background: '#fafdff' }}
        >
          <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
            {/* Keyword Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: '#93979f' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search-input"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search keyword (e.g. calculator, keys, wallet, blue Hydroflask)..."
                className="w-full pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: '#ebf5ff',
                  borderRadius: 16,
                  color: '#0a0d12',
                  border: '1.5px solid #e8f1f8',
                  outlineColor: '#0069e0',
                }}
              />
            </div>

            {/* Filter Dropdowns & Actions */}
            <div className="grid grid-cols-2 sm:flex sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
              {/* Category Dropdown */}
              <select
                id="category-filter"
                aria-label="Filter by category"
                value={category}
                onChange={handleCategoryChange}
                className="w-full sm:w-auto text-xs sm:text-sm font-medium focus:outline-none cursor-pointer"
                style={{
                  background: '#ebf5ff',
                  borderRadius: 16,
                  color: '#535862',
                  border: '1.5px solid #e8f1f8',
                  padding: '10px 12px',
                }}
              >
                <option value="">All Categories</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Type Dropdown */}
              <select
                id="type-filter"
                aria-label="Filter by type"
                value={type}
                onChange={handleTypeChange}
                className="w-full sm:w-auto text-xs sm:text-sm font-medium focus:outline-none cursor-pointer"
                style={{
                  background: '#ebf5ff',
                  borderRadius: 16,
                  color: '#535862',
                  border: '1.5px solid #e8f1f8',
                  padding: '10px 12px',
                }}
              >
                <option value="">All Types</option>
                <option value="LOST">Lost Only</option>
                <option value="FOUND">Found Only</option>
              </select>

              {/* Search Submit Button */}
              <button
                id="search-submit-btn"
                type="submit"
                className="col-span-2 sm:col-span-1 btn-charcoal-sm justify-center"
              >
                Filter
              </button>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  id="clear-filters-btn"
                  type="button"
                  onClick={handleClearFilters}
                  className="col-span-2 sm:col-span-1 px-3 py-2 text-xs font-medium rounded-full transition-colors cursor-pointer"
                  style={{ color: '#93979f' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#0a0d12'}
                  onMouseLeave={e => e.currentTarget.style.color = '#93979f'}
                >
                  Reset
                </button>
              )}
            </div>
          </form>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs" style={{ borderColor: '#e8f1f8' }}>
              <span style={{ color: '#93979f' }}>Active filters:</span>
              {appliedSearch && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium"
                  style={{ background: '#ebf5ff', color: '#535862' }}
                >
                  Query: &ldquo;{appliedSearch}&rdquo;
                  <button
                    type="button"
                    onClick={() => { setLoading(true); setSearchInput(''); setAppliedSearch('') }}
                    className="hover:opacity-60 cursor-pointer"
                    title="Remove query filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {category && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium"
                  style={{ background: '#f1e6ff', color: '#7c3aed' }}
                >
                  {category}
                  <button
                    type="button"
                    onClick={() => { setLoading(true); setCategory('') }}
                    className="hover:opacity-60 cursor-pointer"
                    title="Remove category filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {type && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium"
                  style={
                    type === 'LOST'
                      ? { background: '#fff1f2', color: '#be123c' }
                      : { background: '#d3f6e3', color: '#047857' }
                  }
                >
                  {type}
                  <button
                    type="button"
                    onClick={() => { setLoading(true); setType('') }}
                    className="hover:opacity-60 cursor-pointer"
                    title="Remove type filter"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Campus Map View ── */}
        {!loading && !error && (
          <ItemsMap items={items} />
        )}

        {/* ── Loading Skeleton ── */}
        {loading && (
          <div id="browse-loading" className="space-y-6">
            <div className="text-center">
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
                style={{ background: '#fafdff', color: '#535862' }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#0069e0' }} />
                Retrieving campus listings…
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-[32px] overflow-hidden"
                  style={{ background: '#fafdff', height: 300 }}
                >
                  <div className="h-44 w-full" style={{ background: '#ebf5ff' }} />
                  <div className="p-5 space-y-3">
                    <div className="h-3.5 rounded-full w-3/4" style={{ background: '#ebf5ff' }} />
                    <div className="h-3 rounded-full w-1/2" style={{ background: '#ebf5ff' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error State ── */}
        {!loading && error && (
          <div
            role="alert"
            className="p-10 rounded-[32px] text-center max-w-md mx-auto space-y-4"
            style={{ background: '#fff1f2' }}
          >
            <div
              className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
              style={{ background: '#fecdd3', color: '#be123c' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-sm" style={{ color: '#be123c' }}>Unable to Load Listings</h3>
              <p className="mt-1 text-xs" style={{ color: '#be123c', opacity: 0.75 }}>{error}</p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-charcoal-sm mx-auto"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && items.length === 0 && (
          <div
            className="py-16 rounded-[32px] text-center p-8 max-w-md mx-auto space-y-4"
            style={{ background: '#fafdff' }}
          >
            <div
              className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
              style={{ background: '#ebf5ff', color: '#93979f' }}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            {hasActiveFilters ? (
              <div className="space-y-2">
                <h3
                  id="empty-state-title"
                  className="text-base font-medium"
                  style={{ color: '#0a0d12' }}
                >
                  No matching campus items
                </h3>
                <p
                  id="empty-state-desc"
                  className="text-xs leading-relaxed"
                  style={{ color: '#93979f' }}
                >
                  No items match your active filters. Try adjusting your search or resetting filters.
                </p>
                <button
                  id="empty-clear-filters-btn"
                  type="button"
                  onClick={handleClearFilters}
                  className="btn-charcoal-sm mt-2"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 id="empty-state-title" className="text-base font-medium" style={{ color: '#0a0d12' }}>
                  No items reported yet
                </h3>
                <p id="empty-state-desc" className="text-xs leading-relaxed" style={{ color: '#93979f' }}>
                  The directory is currently clear. Report a lost possession or log a found item to help fellow campus members.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Listings Grid ── */}
        {!loading && !error && items.length > 0 && (
          <div id="items-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* ── Pagination Controls ── */}
        {!loading && !error && total > 0 && (
          <div
            id="pagination-controls"
            className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t"
            style={{ borderColor: '#e8f1f8' }}
          >
            <div id="pagination-info" className="text-xs" style={{ color: '#93979f' }}>
              Showing{' '}
              <span className="font-medium" style={{ color: '#0a0d12' }}>
                {Math.min((page - 1) * PAGE_LIMIT + 1, total)}
              </span>{' '}
              to{' '}
              <span className="font-medium" style={{ color: '#0a0d12' }}>
                {Math.min(page * PAGE_LIMIT, total)}
              </span>{' '}
              of <span className="font-medium" style={{ color: '#0a0d12' }}>{total}</span> items
            </div>

            <div className="flex items-center gap-3">
              <button
                id="prev-page-btn"
                type="button"
                onClick={handlePrevPage}
                disabled={page <= 1}
                className="px-4 py-2 text-xs font-medium rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: '#fafdff',
                  color: '#535862',
                  borderColor: '#d5e6f0',
                }}
              >
                ← Previous
              </button>

              <span
                id="page-indicator"
                className="text-xs font-medium px-2"
                style={{ color: '#93979f' }}
              >
                Page <span style={{ color: '#0a0d12', fontWeight: 600 }}>{page}</span> of{' '}
                <span style={{ color: '#0a0d12', fontWeight: 600 }}>{totalPages}</span>
              </span>

              <button
                id="next-page-btn"
                type="button"
                onClick={handleNextPage}
                disabled={page >= totalPages}
                className="px-4 py-2 text-xs font-medium rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: '#fafdff',
                  color: '#535862',
                  borderColor: '#d5e6f0',
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
