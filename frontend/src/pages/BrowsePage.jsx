import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAllItemsRequest } from '../api/items'
import ItemCard from '../components/ItemCard'
import ItemsMap from '../components/ItemsMap'

export const PAGE_LIMIT = 12

/**
 * Public browse directory page for CampusFind.
 *
 * Clean E-Commerce Layout:
 * - Left Sidebar (Desktop): Search input, Type switcher, Category filters, Reset controls
 * - Right Main Panel: Directory header, View mode toggle (Grid vs Map), Active filter chips,
 *   3-column clean ItemCard grid, and Pagination controls.
 * - Mobile: Collapsible filter drawer.
 */
export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize filter state from URL query parameters if present
  const initialQ = searchParams.get('q') || ''
  const initialCategory = searchParams.get('category') || ''
  const initialType = searchParams.get('type') || ''
  const initialPage = parseInt(searchParams.get('page') || '1', 10)
  const initialView = searchParams.get('view') === 'map' ? 'map' : 'grid'

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // View mode: 'grid' | 'map'
  const [viewMode, setViewMode] = useState(initialView)

  // Mobile filter drawer open/close
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

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
    if (viewMode === 'map') params.view = 'map'
    setSearchParams(params, { replace: true })
  }, [appliedSearch, category, type, page, viewMode, setSearchParams])

  // Fetch items whenever applied search, category, type, page, or viewMode changes
  useEffect(() => {
    let isMounted = true

    // In map view, fetch up to 100 items so all campus pins appear; in grid view, paginate by PAGE_LIMIT
    const params = {
      page: viewMode === 'map' ? 1 : page,
      limit: viewMode === 'map' ? 100 : PAGE_LIMIT,
    }
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
  }, [appliedSearch, category, type, page, viewMode])

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

  const categoryList = [
    { name: 'All Categories', value: '', icon: '🏷️' },
    { name: 'Electronics', value: 'Electronics', icon: '💻' },
    { name: 'Bags & Backpacks', value: 'Bags & Backpacks', icon: '🎒' },
    { name: 'ID Cards & Wallets', value: 'ID Cards & Wallets', icon: '🪪' },
    { name: 'Keys & Lanyards', value: 'Keys', icon: '🔑' },
    { name: 'Books & Notebooks', value: 'Books & Notebooks', icon: '📚' },
    { name: 'Clothing & Apparel', value: 'Clothing & Apparel', icon: '👕' },
    { name: 'Bottles & Tumblers', value: 'Bottles & Containers', icon: '🧴' },
    { name: 'Jewelry & Watches', value: 'Jewelry & Watches', icon: '⌚' },
    { name: 'Other Possessions', value: 'Other', icon: '📦' },
  ]

  const typeOptions = [
    { label: 'All Items', value: '', countLabel: 'All' },
    { label: 'Lost Possessions', value: 'LOST', countLabel: 'Missing' },
    { label: 'Found Possessions', value: 'FOUND', countLabel: 'Recovered' },
  ]

  return (
    <div
      className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-10"
      style={{ background: '#ebf5ff' }}
    >
      <div className="max-w-[1360px] mx-auto space-y-6">

        {/* ── Top Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: '#e8f1f8' }}>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-medium tracking-tight"
              style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
            >
              Campus Directory
            </h1>
            <p className="mt-1 text-xs sm:text-sm" style={{ color: '#535862' }}>
              Search, filter, and track lost and found possessions across campus.
            </p>
          </div>

          {/* Right Controls: View Switcher & Mobile Filter Toggle */}
          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border bg-white cursor-pointer"
              style={{ borderColor: '#d5e6f0', color: '#0a0d12' }}
            >
              <span>⚙️</span>
              <span>Filters {hasActiveFilters && '• Active'}</span>
            </button>

            {/* Segmented View Mode Switcher */}
            <div
              className="inline-flex p-1 rounded-full border shadow-2xs"
              style={{ background: '#ffffff', borderColor: '#e8f1f8' }}
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

        {/* ── Main Two-Column E-Commerce Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ══════════════════════════════════════════════════════════════════
              LEFT COLUMN: Sticky E-Commerce Filter Sidebar (3 cols)
          ══════════════════════════════════════════════════════════════════ */}
          <aside
            className={`lg:col-span-3 lg:sticky lg:top-24 space-y-6 ${
              mobileFilterOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            <div
              className="p-6 rounded-[28px] border shadow-xs space-y-6"
              style={{ background: '#ffffff', borderColor: '#e8f1f8' }}
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: '#f1f5f9' }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">🔎</span>
                  <h3 className="text-sm font-semibold" style={{ color: '#0a0d12' }}>
                    Filter Listings
                  </h3>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs font-medium hover:underline cursor-pointer"
                    style={{ color: '#0069e0' }}
                  >
                    Reset all
                  </button>
                )}
              </div>

              {/* 1. Keyword Search */}
              <div className="space-y-2">
                <label
                  htmlFor="sidebar-search"
                  className="block text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#0a0d12', letterSpacing: '0.04em' }}
                >
                  Search Keyword
                </label>
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    id="sidebar-search"
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="e.g. calculator, keys, wallet…"
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-2xl focus:outline-none focus:ring-2 transition-all"
                    style={{
                      background: '#ebf5ff',
                      border: '1.5px solid #e8f1f8',
                      color: '#0a0d12',
                      outlineColor: '#0069e0',
                    }}
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 text-slate-500 hover:text-slate-900 px-1.5 cursor-pointer"
                    title="Search"
                  >
                    ↵
                  </button>
                </form>
              </div>

              {/* 2. Item Status / Type Filter */}
              <div className="space-y-2.5">
                <label
                  className="block text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#0a0d12', letterSpacing: '0.04em' }}
                >
                  Item Status
                </label>
                <div className="space-y-1.5">
                  {typeOptions.map((opt) => {
                    const isSelected = type === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleTypeSelect(opt.value)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer text-left"
                        style={{
                          background: isSelected ? '#ebf5ff' : 'transparent',
                          color: isSelected ? '#0a0d12' : '#535862',
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              background:
                                opt.value === 'LOST'
                                  ? '#be123c'
                                  : opt.value === 'FOUND'
                                  ? '#047857'
                                  : '#0069e0',
                            }}
                          />
                          {opt.label}
                        </span>
                        <span className="text-[11px]" style={{ color: '#93979f' }}>
                          {opt.countLabel}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. Category Filter List */}
              <div className="space-y-2.5">
                <label
                  className="block text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#0a0d12', letterSpacing: '0.04em' }}
                >
                  Categories
                </label>
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1 no-scrollbar">
                  {categoryList.map((cat) => {
                    const isSelected = category === cat.value
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => handleCategorySelect(cat.value)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer text-left group"
                        style={{
                          background: isSelected ? '#181d27' : 'transparent',
                          color: isSelected ? '#ffffff' : '#535862',
                        }}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="text-sm select-none">{cat.icon}</span>
                          <span className="truncate">{cat.name}</span>
                        </span>
                        {isSelected && (
                          <span className="text-xs font-bold shrink-0">✓</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 4. Map Shortcut Card */}
              <div
                className="p-4 rounded-2xl border flex items-center justify-between gap-3"
                style={{ background: '#f8fafc', borderColor: '#e8f1f8' }}
              >
                <div>
                  <div className="text-xs font-semibold" style={{ color: '#0a0d12' }}>Campus Map</div>
                  <div className="text-[10px]" style={{ color: '#93979f' }}>View GPS landmark pins</div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'map' ? 'grid' : 'map')}
                  className="btn-charcoal-sm py-1 px-3 text-[11px]"
                >
                  {viewMode === 'map' ? 'Show Grid' : 'Open Map'}
                </button>
              </div>

            </div>
          </aside>

          {/* ══════════════════════════════════════════════════════════════════
              RIGHT COLUMN: Main Results Grid (9 cols)
          ══════════════════════════════════════════════════════════════════ */}
          <main className="lg:col-span-9 space-y-6">

            {/* Top Results Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border shadow-2xs" style={{ borderColor: '#e8f1f8' }}>
              <div className="flex items-center gap-2 text-xs font-medium" style={{ color: '#535862' }}>
                {viewMode === 'grid' ? (
                  <>
                    <span>Showing</span>
                    <span className="font-semibold" style={{ color: '#0a0d12' }}>
                      {total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, total)}
                    </span>
                    <span>of</span>
                    <span className="font-semibold" style={{ color: '#0a0d12' }}>{total}</span>
                    <span>items</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold" style={{ color: '#0a0d12' }}>Campus Map View</span>
                    <span>•</span>
                    <span>Displaying GPS landmark pins across campus</span>
                  </>
                )}
              </div>

              {/* Active Filter Chips Row */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {appliedSearch && (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium"
                      style={{ background: '#ebf5ff', color: '#0a0d12' }}
                    >
                      &ldquo;{appliedSearch}&rdquo;
                      <button
                        type="button"
                        onClick={() => { setLoading(true); setSearchInput(''); setAppliedSearch('') }}
                        className="hover:opacity-60 cursor-pointer text-xs"
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
                        className="hover:opacity-60 cursor-pointer text-xs"
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
                        className="hover:opacity-60 cursor-pointer text-xs"
                      >
                        ×
                      </button>
                    </span>
                  )}
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
                <div className="text-center py-6">
                  <span
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium"
                    style={{ background: '#ffffff', color: '#535862', border: '1px solid #e8f1f8' }}
                  >
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#0069e0' }} />
                    Retrieving campus items…
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
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
                className="p-10 rounded-[32px] text-center max-w-md mx-auto space-y-4 border"
                style={{ background: '#fff1f2', borderColor: '#fecdd3' }}
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
                className="py-16 rounded-[32px] text-center p-8 max-w-md mx-auto space-y-4 border bg-white"
                style={{
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
                      No items match your active filters. Try clearing your filters or searching another keyword.
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

            {/* ── Grid View: 3-Column Clean Bone-White ItemCard Grid ── */}
            {viewMode === 'grid' && !loading && !error && items.length > 0 && (
              <div
                id="items-grid"
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-200"
              >
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {/* ── Pagination Controls (Grid View only) ── */}
            {viewMode === 'grid' && !loading && !error && total > 0 && (
              <div
                id="pagination-controls"
                className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t"
                style={{ borderColor: '#e8f1f8' }}
              >
                <div className="text-xs font-medium" style={{ color: '#535862' }}>
                  Page <span style={{ color: '#0a0d12', fontWeight: 700 }}>{page}</span> of{' '}
                  <span style={{ color: '#0a0d12', fontWeight: 700 }}>{totalPages}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    id="prev-page-btn"
                    type="button"
                    onClick={handlePrevPage}
                    disabled={page <= 1}
                    className="px-4 py-2 text-xs font-semibold rounded-full border transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs hover:bg-white"
                    style={{
                      background: '#ffffff',
                      color: '#0a0d12',
                      borderColor: '#d5e6f0',
                    }}
                  >
                    ← Previous
                  </button>

                  <button
                    id="next-page-btn"
                    type="button"
                    onClick={handleNextPage}
                    disabled={page >= totalPages}
                    className="px-4 py-2 text-xs font-semibold rounded-full border transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs hover:bg-white"
                    style={{
                      background: '#ffffff',
                      color: '#0a0d12',
                      borderColor: '#d5e6f0',
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

          </main>

        </div>

      </div>
    </div>
  )
}
