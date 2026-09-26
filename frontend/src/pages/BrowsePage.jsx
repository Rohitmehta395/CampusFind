import { useState, useEffect } from 'react'
import { getAllItemsRequest } from '../api/items'
import ItemCard from '../components/ItemCard'
import { CATEGORY_OPTIONS } from '../constants/categories'

export const PAGE_LIMIT = 12

/**
 * Public browse page displaying lost and found listings with search, category/type filtering,
 * and deterministic pagination controls.
 */
export default function BrowsePage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter & Search local state
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const hasActiveFilters = Boolean(appliedSearch || category || type)

  // Fetch items whenever applied search, category, type, or page changes
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError('')

    const params = {
      page,
      limit: PAGE_LIMIT,
    }
    if (appliedSearch) {
      params.q = appliedSearch
    }
    if (category) {
      params.category = category
    }
    if (type) {
      params.type = type
    }

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

    return () => {
      isMounted = false
    }
  }, [appliedSearch, category, type, page])

  // Explicit handlers that update filter state and reset page to 1
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setAppliedSearch(searchInput.trim())
    setPage(1)
  }

  const handleCategoryChange = (e) => {
    setCategory(e.target.value)
    setPage(1)
  }

  const handleTypeChange = (e) => {
    setType(e.target.value)
    setPage(1)
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setAppliedSearch('')
    setCategory('')
    setType('')
    setPage(1)
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1)
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1)
    }
  }

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
          <span
            id="browse-total-badge"
            className="self-start sm:self-auto text-xs font-medium px-3 py-1 bg-slate-100 text-slate-700 rounded-full"
          >
            {total} {total === 1 ? 'item' : 'items'} {hasActiveFilters ? 'found' : 'listed'}
          </span>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Keyword Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="search-input"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, description, or location..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Controls Cluster */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Category Dropdown */}
            <select
              id="category-filter"
              aria-label="Filter by category"
              value={category}
              onChange={handleCategoryChange}
              className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Type Dropdown */}
            <select
              id="type-filter"
              aria-label="Filter by type"
              value={type}
              onChange={handleTypeChange}
              className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            >
              <option value="">All Types</option>
              <option value="LOST">Lost</option>
              <option value="FOUND">Found</option>
            </select>

            {/* Search Submit Button */}
            <button
              id="search-submit-btn"
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              Search
            </button>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                id="clear-filters-btn"
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div id="browse-loading" className="py-16 text-center">
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

      {/* Empty State: No Matches Found vs No Items Reported */}
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
          {hasActiveFilters ? (
            <div>
              <h3 id="empty-state-title" className="text-base font-semibold text-slate-800">
                No matching items found
              </h3>
              <p id="empty-state-desc" className="mt-1 text-xs text-slate-500">
                No lost or found items match your current search or filter criteria. Try adjusting or clearing your filters.
              </p>
              <button
                id="empty-clear-filters-btn"
                type="button"
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div>
              <h3 id="empty-state-title" className="text-base font-semibold text-slate-800">
                No items reported yet
              </h3>
              <p id="empty-state-desc" className="mt-1 text-xs text-slate-500">
                Check back later or report a lost or found item to help fellow students.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Listings Grid */}
      {!loading && !error && items.length > 0 && (
        <div id="items-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && total > 0 && (
        <div id="pagination-controls" className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
          <div id="pagination-info" className="text-xs text-slate-500 font-medium">
            Showing{' '}
            <span className="font-semibold text-slate-700">
              {Math.min((page - 1) * PAGE_LIMIT + 1, total)}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(page * PAGE_LIMIT, total)}
            </span>{' '}
            of <span className="font-semibold text-slate-700">{total}</span> items
          </div>

          <div className="flex items-center gap-3">
            <button
              id="prev-page-btn"
              type="button"
              onClick={handlePrevPage}
              disabled={page <= 1}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Previous
            </button>

            <span
              id="page-indicator"
              className="text-xs font-medium text-slate-600 px-2"
            >
              Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
              <span className="font-semibold text-slate-900">{totalPages}</span>
            </span>

            <button
              id="next-page-btn"
              type="button"
              onClick={handleNextPage}
              disabled={page >= totalPages}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
