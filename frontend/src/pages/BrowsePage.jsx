import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAllItemsRequest } from '../api/items'
import ItemCard from '../components/ItemCard'
import ItemsMap from '../components/ItemsMap'

export const PAGE_LIMIT = 12

/**
 * Public browse directory page for CampusFind.
 *
 * Design: Geniestudio daylight notebook — Airy, uncluttered composition with:
 * - View mode switcher (Grid View vs Map View) to prevent map clutter
 * - One-tap horizontal category pill filter strip
 * - Segmented status control (All, Lost, Found)
 * - Refined search input with clear action
 * - Calm Bone-white ItemCard grid with generous breathing room
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

  // View mode: 'grid' | 'map'
  const [viewMode, setViewMode] = useState('grid')

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

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setAppliedSearch(searchInput.trim())
    setPage(1)
  }

  const handleCategorySelect = (cat) => {
    setLoading(true)
    setCategory(prev => prev === cat ? '' : cat)
    setPage(1)
  }

  const handleTypeSelect = (t) => {
    setLoading(true)
    setType(t)
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

  const categoryPills = [
    { label: 'All', value: '' },
    { label: '💻 Electronics', value: 'Electronics' },
    { label: '🎒 Bags', value: 'Bags & Backpacks' },
    { label: '🪪 Wallets & IDs', value: 'ID Cards & Wallets' },
    { label: '🔑 Keys', value: 'Keys' },
    { label: '📚 Books', value: 'Books & Notebooks' },
    { label: '👕 Clothing', value: 'Clothing & Apparel' },
    { label: '🧴 Bottles', value: 'Bottles & Containers' },
    { label: '⌚ Jewelry', value: 'Jewelry & Watches' },
  ]

  return (
    <div
      className="w-full min-h-screen px-4 sm:px-8 py-8 sm:py-12"
      style={{ background: '#ebf5ff' }}
    >
      <div className="max-w-[1200px] mx-auto space-y-8">

        {/* ── Top Header Toolbar ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl sm:text-4xl font-medium tracking-tight"
              style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
            >
              Campus Directory
            </h1>
            <p className="mt-1 text-xs sm:text-sm" style={{ color: '#535862' }}>
              Real-time database of reported lost items and verified student recoveries.
            </p>
          </div>

          {/* View Mode Switcher + Total Count */}
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="text-xs font-medium px-3.5 py-1.5 rounded-full"
              style={{ background: '#fafdff', color: '#535862', border: '1px solid #e8f1f8' }}
            >
              <strong style={{ color: '#0a0d12' }}>{total}</strong> {total === 1 ? 'item' : 'items'}
            </span>

            {/* Segmented Grid / Map Toggle */}
            <div
              className="inline-flex p-1 rounded-full border shadow-2xs"
              style={{ background: '#fafdff', borderColor: '#e8f1f8' }}
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer"
                style={{
                  background: viewMode === 'grid' ? '#181d27' : 'transparent',
                  color: viewMode === 'grid' ? '#ffffff' : '#535862',
                }}
              >
                <span>⊞</span>
                <span>Grid View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer"
                style={{
                  background: viewMode === 'map' ? '#181d27' : 'transparent',
                  color: viewMode === 'map' ? '#ffffff' : '#535862',
                }}
              >
                <span>🗺️</span>
                <span>Map View</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Console ── */}
        <div
          className="p-5 sm:p-7 rounded-[32px] border shadow-xs space-y-4"
          style={{ background: '#fafdff', borderColor: '#e8f1f8' }}
        >
          {/* Row 1: Search Bar & Type Segmented Control */}
          <div className="flex flex-col lg:flex-row items-center gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
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
                placeholder="Search by keywords (e.g. calculator, keys, wallet, blue Hydroflask)..."
                className="w-full pl-11 pr-24 py-3 text-sm focus:outline-none focus:ring-2 rounded-full transition-all"
                style={{
                  background: '#ebf5ff',
                  border: '1.5px solid #e8f1f8',
                  color: '#0a0d12',
                  outlineColor: '#0069e0',
                }}
              />
              <button
                id="search-submit-btn"
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 btn-charcoal-sm py-1.5 px-4 text-xs"
              >
                Search
              </button>
            </form>

            {/* Type Segmented Control */}
            <div
              className="inline-flex p-1 rounded-full border self-stretch sm:self-auto shrink-0 justify-center"
              style={{ background: '#ebf5ff', borderColor: '#d5e6f0' }}
            >
              {[
                { label: 'All Statuses', val: '' },
                { label: 'Lost Only', val: 'LOST' },
                { label: 'Found Only', val: 'FOUND' },
              ].map(({ label, val }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleTypeSelect(val)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer"
                  style={{
                    background: type === val ? '#181d27' : 'transparent',
                    color: type === val ? '#ffffff' : '#535862',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Category Filter Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            <span className="text-xs font-semibold uppercase tracking-wider pr-1 shrink-0" style={{ color: '#93979f' }}>
              Category:
            </span>
            {categoryPills.map(({ label, value }) => {
              const isSelected = category === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleCategorySelect(value)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-all cursor-pointer"
                  style={{
                    background: isSelected ? '#181d27' : '#ebf5ff',
                    color: isSelected ? '#ffffff' : '#535862',
                    borderColor: isSelected ? '#181d27' : '#e8f1f8',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs" style={{ borderColor: '#e8f1f8' }}>
              <span style={{ color: '#93979f' }}>Active filters:</span>
              {appliedSearch && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium"
                  style={{ background: '#ebf5ff', color: '#0a0d12' }}
                >
                  &ldquo;{appliedSearch}&rdquo;
                  <button
                    type="button"
                    onClick={() => { setLoading(true); setSearchInput(''); setAppliedSearch('') }}
                    className="hover:opacity-60 cursor-pointer"
                    title="Remove keyword filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {category && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium"
                  style={{ background: '#f1e6ff', color: '#7c3aed' }}
                >
                  {category}
                  <button
                    type="button"
                    onClick={() => handleCategorySelect('')}
                    className="hover:opacity-60 cursor-pointer"
                    title="Remove category filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {type && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium"
                  style={
                    type === 'LOST'
                      ? { background: '#fff1f2', color: '#be123c' }
                      : { background: '#d3f6e3', color: '#047857' }
                  }
                >
                  {type}
                  <button
                    type="button"
                    onClick={() => handleTypeSelect('')}
                    className="hover:opacity-60 cursor-pointer"
                    title="Remove type filter"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-medium ml-1 cursor-pointer transition-colors"
                style={{ color: '#0069e0' }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* ── View: Map View Mode ── */}
        {viewMode === 'map' && !loading && !error && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <ItemsMap items={items} />
          </div>
        )}

        {/* ── Loading Skeleton ── */}
        {loading && (
          <div id="browse-loading" className="space-y-6">
            <div className="text-center">
              <span
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium"
                style={{ background: '#fafdff', color: '#535862' }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#0069e0' }} />
                Retrieving campus listings…
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-[24px] overflow-hidden border"
                  style={{ background: '#ffffff', borderColor: '#e8f1f8', height: 320 }}
                >
                  <div className="h-44 w-full" style={{ background: '#f4f8fb' }} />
                  <div className="p-5 space-y-3">
                    <div className="h-4 rounded-full w-3/4" style={{ background: '#ebf5ff' }} />
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
            style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}
          >
            <div
              className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-lg"
              style={{ background: '#fecdd3', color: '#be123c' }}
            >
              ⚠️
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#be123c' }}>Unable to Load Directory</h3>
              <p className="mt-1 text-xs opacity-80" style={{ color: '#be123c' }}>{error}</p>
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
            className="py-16 rounded-[32px] text-center p-8 max-w-md mx-auto space-y-4 border"
            style={{
              background: '#fafdff',
              borderColor: '#e8f1f8',
              boxShadow: 'rgba(4, 69, 144, 0.04) 0px 8px 24px 0px',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl"
              style={{ background: '#ebf5ff' }}
            >
              🔍
            </div>
            {hasActiveFilters ? (
              <div className="space-y-2">
                <h3 className="text-base font-semibold" style={{ color: '#0a0d12' }}>
                  No matching campus items
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: '#93979f' }}>
                  No items match your active filters. Try adjusting your search keyword or clearing filters.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="btn-charcoal-sm mx-auto"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-base font-semibold" style={{ color: '#0a0d12' }}>
                  No items reported yet
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: '#93979f' }}>
                  The directory is currently clear. Report a lost item or log a found possession to help students.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Grid View: Clean Bone-White ItemCard Grid ── */}
        {viewMode === 'grid' && !loading && !error && items.length > 0 && (
          <div
            id="items-grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-200"
          >
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* ── Pagination Controls ── */}
        {!loading && !error && total > 0 && (
          <div
            id="pagination-controls"
            className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t"
            style={{ borderColor: '#e8f1f8' }}
          >
            <div className="text-xs font-medium" style={{ color: '#535862' }}>
              Showing{' '}
              <span className="font-semibold" style={{ color: '#0a0d12' }}>
                {Math.min((page - 1) * PAGE_LIMIT + 1, total)}
              </span>{' '}
              to{' '}
              <span className="font-semibold" style={{ color: '#0a0d12' }}>
                {Math.min(page * PAGE_LIMIT, total)}
              </span>{' '}
              of <span className="font-semibold" style={{ color: '#0a0d12' }}>{total}</span> items
            </div>

            <div className="flex items-center gap-3">
              <button
                id="prev-page-btn"
                type="button"
                onClick={handlePrevPage}
                disabled={page <= 1}
                className="px-4 py-2 text-xs font-semibold rounded-full border transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs hover:bg-white"
                style={{
                  background: '#fafdff',
                  color: '#0a0d12',
                  borderColor: '#d5e6f0',
                }}
              >
                ← Previous
              </button>

              <span
                id="page-indicator"
                className="text-xs font-medium px-2"
                style={{ color: '#535862' }}
              >
                Page <span style={{ color: '#0a0d12', fontWeight: 700 }}>{page}</span> of{' '}
                <span style={{ color: '#0a0d12', fontWeight: 700 }}>{totalPages}</span>
              </span>

              <button
                id="next-page-btn"
                type="button"
                onClick={handleNextPage}
                disabled={page >= totalPages}
                className="px-4 py-2 text-xs font-semibold rounded-full border transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs hover:bg-white"
                style={{
                  background: '#fafdff',
                  color: '#0a0d12',
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
