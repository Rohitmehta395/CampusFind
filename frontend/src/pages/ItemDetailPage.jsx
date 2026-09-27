import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getItemByIdRequest } from '../api/items'
import { getItemMatchesRequest } from '../api/matches'
import { submitClaimRequest, getItemClaimsRequest, reviewClaimRequest } from '../api/claims'
import { useAuth } from '../context/AuthContext'

/**
 * Public item detail page presenting the full metadata and description of a single item.
 * Supports public viewing at /items/:id.
 *
 * When the viewer is a logged-in non-owner and the item is ACTIVE, provides a "Claim This Item"
 * submission form allowing users to submit ownership evidence.
 *
 * When the currently authenticated user is the item's reporter:
 * 1. Securely fetches and displays ownership claims ("Claims on This Item") with Approve/Reject actions.
 * 2. Securely fetches and displays potential matches ("Potential Matches") computed by the Smart Matching Engine.
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

  // Claims review state (owner only)
  const [claims, setClaims] = useState([])
  const [claimsLoading, setClaimsLoading] = useState(false)
  const [claimsError, setClaimsError] = useState('')
  const [reviewingClaimId, setReviewingClaimId] = useState(null)
  const [reviewActionError, setReviewActionError] = useState('')

  // Claim submission state (non-owner only)
  const [evidenceText, setEvidenceText] = useState('')
  const [claimSubmitting, setClaimSubmitting] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [claimSuccess, setClaimSuccess] = useState(false)

  // Determine ownership: authenticated user's ID must match item's reporterId
  const isOwner = Boolean(user && item && Number(user.id) === Number(item.reporterId))

  // Determine eligibility to claim: logged-in non-owner viewing an ACTIVE item
  const canClaim = Boolean(user && item && !isOwner && item.status === 'ACTIVE')

  // Logged-out visitor viewing an ACTIVE item
  const isLoggedOutViewer = Boolean(!user && item && item.status === 'ACTIVE')

  // Reusable item fetcher
  const fetchItem = useCallback(() => {
    return getItemByIdRequest(id)
      .then((data) => {
        setItem(data)
        setLoading(false)
        return data
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setIsNotFound(true)
        } else {
          setError(err.response?.data?.error || err.message || 'Failed to load item detail')
        }
        setLoading(false)
        throw err
      })
  }, [id])

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError('')
    setIsNotFound(false)

    fetchItem().catch(() => {
      // Handled in fetchItem
    })

    return () => {
      isMounted = false
    }
  }, [fetchItem])

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

  // Fetch claims only when viewer is verified as the item's reporter
  const fetchClaims = useCallback(() => {
    if (!isOwner || !item?.id) {
      setClaims([])
      setClaimsLoading(false)
      return Promise.resolve()
    }

    setClaimsLoading(true)
    setClaimsError('')

    return getItemClaimsRequest(item.id)
      .then((data) => {
        setClaims(data?.claims || [])
        setClaimsLoading(false)
      })
      .catch((err) => {
        setClaimsError(err.response?.data?.error || err.message || 'Failed to load claims')
        setClaimsLoading(false)
      })
  }, [isOwner, item?.id])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  useEffect(() => {
    fetchClaims()
  }, [fetchClaims])

  // Handle claim review action (Approve or Reject)
  const handleReviewClaim = async (claimId, decision) => {
    setReviewingClaimId(claimId)
    setReviewActionError('')
    try {
      await reviewClaimRequest(claimId, decision)
      // On successful review: refetch claims and item so UI reflects updated claim status and RESOLVED item status
      await Promise.all([fetchClaims(), fetchItem()])
    } catch (err) {
      setReviewActionError(err.response?.data?.error || err.message || 'Failed to update claim')
    } finally {
      setReviewingClaimId(null)
    }
  }

  // Handle claim submission by non-owner
  const handleClaimSubmit = async (e) => {
    e.preventDefault()
    const trimmed = evidenceText.trim()
    if (trimmed.length < 10) {
      setClaimError('Please provide at least 10 characters of evidence describing your item.')
      return
    }

    setClaimSubmitting(true)
    setClaimError('')

    try {
      await submitClaimRequest(item.id, trimmed)
      setClaimSuccess(true)
      setEvidenceText('')
    } catch (err) {
      setClaimError(err.response?.data?.error || err.message || 'Failed to submit claim. Please try again.')
    } finally {
      setClaimSubmitting(false)
    }
  }

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
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center border border-slate-200 mx-auto mt-12">
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
      <div className="max-w-md w-full bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700 mx-auto mt-12">
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
  const isResolved = item.status === 'RESOLVED'

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
                    : item.status === 'RESOLVED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
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

        {/* Visual Container */}
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

      {/* Non-Owner Claim Section: Logged-in non-owner viewing an ACTIVE item */}
      {canClaim && (
        <section className="mt-8 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Claim This Item</h2>
              <p className="text-xs text-slate-500">
                Believe this belongs to you? Submit identifying details to verify your ownership.
              </p>
            </div>
          </div>

          {claimSuccess ? (
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="text-sm">
                  <p className="font-semibold text-emerald-900">Claim submitted successfully!</p>
                  <p className="mt-1 text-emerald-700 text-xs leading-relaxed">
                    The item reporter will review your evidence. Once verified, you will be notified.
                  </p>
                  <button
                    type="button"
                    onClick={() => setClaimSuccess(false)}
                    className="mt-3 inline-flex items-center text-xs font-semibold text-emerald-900 underline hover:no-underline"
                  >
                    Submit additional evidence or another claim
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleClaimSubmit} className="space-y-4">
              {claimError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                  {claimError}
                </div>
              )}

              <div>
                <label htmlFor="evidenceText" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Ownership Evidence / Proof
                </label>
                <textarea
                  id="evidenceText"
                  rows={4}
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  placeholder="Describe unique identifying marks, serial numbers, screen wallpapers, secret compartments, exact contents, or where/when you lost it..."
                  className="w-full text-sm rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                  disabled={claimSubmitting}
                />
                <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                  <span>Only the item's reporter will see your evidence.</span>
                  <span className={evidenceText.trim().length >= 10 ? 'text-slate-400' : 'text-amber-600 font-medium'}>
                    {evidenceText.trim().length}/10 min characters
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={claimSubmitting || evidenceText.trim().length < 10}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
                >
                  {claimSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting Claim...
                    </>
                  ) : (
                    'Submit Ownership Claim'
                  )}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Logged-Out Prompt: When viewer is not authenticated on an ACTIVE item */}
      {isLoggedOutViewer && (
        <section className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-700 font-medium">
            Are you the owner of this item?
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Sign in to submit an ownership claim with identifying proof.
          </p>
          <div className="mt-4">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Sign In to Claim
            </Link>
          </div>
        </section>
      )}

      {/* Resolved Banner for Non-Owners */}
      {!isOwner && isResolved && (
        <section className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-5 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            This item has been RESOLVED and returned to its verified owner.
          </span>
        </section>
      )}

      {/* Claims on This Item Section - Strictly Owner-Gated */}
      {isOwner && (
        <section className="mt-8 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Claims on This Item
                </h2>
                <p className="text-xs text-slate-500">
                  Review ownership verification evidence submitted by claimants
                </p>
              </div>
            </div>
            {!claimsLoading && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {claims.length} {claims.length === 1 ? 'claim' : 'claims'}
              </span>
            )}
          </div>

          {claimsLoading && (
            <div className="py-8 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Loading claims...
              </div>
            </div>
          )}

          {claimsError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center justify-between">
              <span>{claimsError}</span>
              <button
                type="button"
                onClick={fetchClaims}
                className="font-semibold underline hover:no-underline text-rose-800"
              >
                Retry
              </button>
            </div>
          )}

          {reviewActionError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {reviewActionError}
            </div>
          )}

          {!claimsLoading && !claimsError && claims.length === 0 && (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                No claims submitted yet
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                When another community member files an ownership claim on this item, their submitted evidence will appear here for your review.
              </p>
            </div>
          )}

          {!claimsLoading && !claimsError && claims.length > 0 && (
            <div className="space-y-4">
              {claims.map((c) => {
                const isPending = c.status === 'PENDING'
                const isApproved = c.status === 'APPROVED'
                const isRejected = c.status === 'REJECTED'
                const isActing = reviewingClaimId === c.id

                return (
                  <div
                    key={c.id}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold">
                          #{c.claimantId}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            Claimant #{c.claimantId}
                          </div>
                          {c.createdAt && (
                            <div className="text-[11px] text-slate-400">
                              Submitted {c.createdAt.substring(0, 10)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>

                    {/* Evidence Text Box */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Submitted Evidence:
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {c.evidenceText}
                      </div>
                    </div>

                    {/* Actions / Decision Info */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      {isPending ? (
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleReviewClaim(c.id, 'APPROVED')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
                          >
                            {isActing ? (
                              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            Approve Claim
                          </button>
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleReviewClaim(c.id, 'REJECTED')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 font-semibold hover:bg-rose-50 disabled:opacity-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject Claim
                          </button>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-xs">
                          {isApproved && (
                            <span className="text-emerald-700 font-medium">
                              Approved {c.reviewedAt ? `on ${c.reviewedAt.substring(0, 10)}` : ''} — item status set to RESOLVED
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-slate-500 font-medium">
                              Rejected {c.reviewedAt ? `on ${c.reviewedAt.substring(0, 10)}` : ''}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-slate-400 text-[11px]">
                        Claim #{c.id}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Potential Matches Section - Strictly Owner-Gated */}
      {isOwner && (
        <section className="mt-8 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
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
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
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
