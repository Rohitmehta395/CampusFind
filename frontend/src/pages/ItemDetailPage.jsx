import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getItemByIdRequest } from '../api/items'
import { getItemMatchesRequest } from '../api/matches'
import { submitClaimRequest, getItemClaimsRequest, reviewClaimRequest } from '../api/claims'
import { useAuth } from '../context/AuthContext'

/**
 * Public item detail page presenting the full metadata and description of a single item.
 * Supports public viewing at /items/:id with Geniestudio daylight notebook design.
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
    fetchItem().catch(() => {
      // Handled in fetchItem
    })
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
    if (isOwner && item?.id) {
      fetchMatches()
      fetchClaims()
    }
  }, [isOwner, item?.id, fetchMatches, fetchClaims])

  // Handle claim review action (Approve or Reject)
  const handleReviewClaim = async (claimId, decision) => {
    setReviewingClaimId(claimId)
    setReviewActionError('')
    try {
      await reviewClaimRequest(claimId, decision)
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
      <div className="w-full min-h-[60vh] flex items-center justify-center px-4 py-20" style={{ background: '#ebf5ff' }}>
        <div
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-medium"
          style={{ background: '#fafdff', color: '#535862' }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#0069e0' }} />
          Loading report details…
        </div>
      </div>
    )
  }

  if (isNotFound) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center px-4 py-16" style={{ background: '#ebf5ff' }}>
        <div
          className="max-w-md w-full p-8 text-center space-y-4"
          style={{ background: '#fafdff', borderRadius: '32px' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: '#fff1f2', color: '#be123c' }}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-medium" style={{ color: '#0a0d12' }}>Listing Not Found</h2>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: '#93979f' }}>
              The item with reference #{id} does not exist or may have been archived.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/browse" className="btn-charcoal-sm justify-center">
              ← Back to Public Directory
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center px-4 py-16" style={{ background: '#ebf5ff' }}>
        <div
          className="max-w-md w-full p-8 text-center space-y-3"
          style={{ background: '#fff1f2', borderRadius: '32px', color: '#be123c' }}
        >
          <h2 className="text-sm font-semibold">Error Loading Listing</h2>
          <p className="text-xs opacity-80">{error}</p>
          <div className="pt-2">
            <Link to="/browse" className="btn-charcoal-sm justify-center">
              ← Return to Browse
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!item) return null

  const isLost = item.type === 'LOST'
  const isResolved = item.status === 'RESOLVED'

  return (
    <div
      className="w-full min-h-screen px-5 sm:px-8 py-10"
      style={{ background: '#ebf5ff' }}
    >
      <div className="max-w-[1200px] mx-auto space-y-8">

        {/* Top Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/browse"
            className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: '#535862' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Directory
          </Link>

          <div className="flex items-center gap-2 text-xs font-mono" style={{ color: '#93979f' }}>
            <span>Record #{item.id}</span>
            {item.createdAt && <span>• {item.createdAt.substring(0, 10)}</span>}
          </div>
        </div>

        {/* Main Two-Column Detail View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Visual Media & Landmark Context (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div
              className="overflow-hidden"
              style={{
                background: '#fafdff',
                borderRadius: '32px',
                boxShadow: 'rgba(4, 69, 144, 0.05) 0px 4px 16px 0px',
              }}
            >
              <div
                className="h-72 sm:h-96 flex items-center justify-center relative overflow-hidden"
                style={{
                  background: isLost ? '#fff1f2' : '#d3f6e3',
                  borderRadius: '32px',
                }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg
                      className="w-12 h-12 opacity-30"
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
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ color: isLost ? '#be123c' : '#047857', opacity: 0.6 }}
                    >
                      No photograph provided
                    </span>
                  </div>
                )}

                {/* Floating Status Badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                    style={
                      isLost
                        ? { background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }
                        : { background: '#d3f6e3', color: '#047857', border: '1px solid #a7f3d0' }
                    }
                  >
                    {item.type}
                  </span>

                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                    style={
                      item.status === 'ACTIVE'
                        ? { background: '#cce7ff', color: '#0069e0', border: '1px solid #99cfff' }
                        : item.status === 'RESOLVED'
                        ? { background: '#d3f6e3', color: '#047857', border: '1px solid #a7f3d0' }
                        : { background: '#fafdff', color: '#535862', border: '1px solid #e8f1f8' }
                    }
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Campus Location Card */}
            <div
              className="p-6 space-y-3"
              style={{
                background: '#fafdff',
                borderRadius: '32px',
                boxShadow: 'rgba(4, 69, 144, 0.05) 0px 4px 16px 0px',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl" style={{ background: '#ebf5ff', color: '#0069e0' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </span>
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#0a0d12', letterSpacing: '0.04em' }}>
                  Campus Location Reference
                </h3>
              </div>
              <p className="text-sm font-medium" style={{ color: '#0a0d12' }}>
                {item.locationText || 'Campus Grounds (Unspecified Location)'}
              </p>
              {item.latitude && item.longitude && (
                <div
                  className="text-xs font-mono p-2.5 rounded-xl"
                  style={{ background: '#ebf5ff', color: '#535862' }}
                >
                  GPS: {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                </div>
              )}
              <div className="pt-2 text-xs leading-relaxed border-t" style={{ borderColor: '#e8f1f8', color: '#93979f' }}>
                💡 <strong style={{ color: '#535862' }}>Handover Safety:</strong> All physical exchanges should occur during daylight at campus reception desks or the Student Union.
              </div>
            </div>
          </div>

          {/* Right Column: Metadata, Description & Claim Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div
              className="p-8 sm:p-10 space-y-6"
              style={{
                background: '#fafdff',
                borderRadius: '32px',
                boxShadow: 'rgba(4, 69, 144, 0.05) 0px 4px 16px 0px',
              }}
            >
              {/* Title & Category Banner */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: '#ebf5ff', color: '#0a0d12' }}
                  >
                    {item.category}
                  </span>
                  {item.eventDate && (
                    <span className="text-xs" style={{ color: '#93979f' }}>
                      Event date: {item.eventDate}
                    </span>
                  )}
                </div>
                <h1
                  className="text-2xl sm:text-3xl font-medium tracking-tight"
                  style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
                >
                  {item.title}
                </h1>
              </div>

              {/* Structured Attributes Grid */}
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl"
                style={{ background: '#ebf5ff' }}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#93979f' }}>
                    Type
                  </span>
                  <p className="text-xs font-semibold" style={{ color: '#0a0d12' }}>{item.type}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#93979f' }}>
                    Color
                  </span>
                  <p className="text-xs font-semibold" style={{ color: '#0a0d12' }}>{item.color || 'Not specified'}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#93979f' }}>
                    Brand / Model
                  </span>
                  <p className="text-xs font-semibold" style={{ color: '#0a0d12' }}>{item.brand || 'Not specified'}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#93979f' }}>
                    Status
                  </span>
                  <p className="text-xs font-semibold" style={{ color: '#0a0d12' }}>{item.status}</p>
                </div>
              </div>

              {/* Description Block */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#0a0d12', letterSpacing: '0.04em' }}>
                  Detailed Description
                </h3>
                <div
                  className="text-sm leading-relaxed p-4 rounded-2xl"
                  style={{ background: '#ebf5ff', color: '#535862' }}
                >
                  {item.description ? (
                    <p className="whitespace-pre-line">{item.description}</p>
                  ) : (
                    <p className="italic" style={{ color: '#93979f' }}>No additional description provided by reporter.</p>
                  )}
                </div>
              </div>

              {/* Ownership Claim Section: Logged-in non-owner viewing ACTIVE item */}
              {canClaim && (
                <div className="pt-4 border-t space-y-4" style={{ borderColor: '#e8f1f8' }}>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ background: '#cce7ff', color: '#0069e0' }}
                    >
                      🛡️
                    </div>
                    <div>
                      <h3 className="text-sm font-medium" style={{ color: '#0a0d12' }}>Claim This Possession</h3>
                      <p className="text-xs" style={{ color: '#93979f' }}>Provide verifiable proof of ownership to the finder.</p>
                    </div>
                  </div>

                  {claimSuccess ? (
                    <div
                      className="p-5 rounded-2xl space-y-2"
                      style={{ background: '#d3f6e3', color: '#047857', border: '1px solid #a7f3d0' }}
                    >
                      <p className="font-semibold text-xs">Claim Submitted Successfully</p>
                      <p className="text-xs">
                        The finder will be notified to review your evidence. Once verified, you will receive an alert to arrange recovery.
                      </p>
                      <button
                        type="button"
                        onClick={() => setClaimSuccess(false)}
                        className="text-xs font-medium underline hover:no-underline cursor-pointer"
                        style={{ color: '#065f46' }}
                      >
                        Submit additional details
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleClaimSubmit} className="space-y-3">
                      {claimError && (
                        <div
                          className="p-3 rounded-xl text-xs"
                          style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}
                        >
                          {claimError}
                        </div>
                      )}
                      <textarea
                        rows={3}
                        value={evidenceText}
                        onChange={(e) => setEvidenceText(e.target.value)}
                        placeholder="Describe unique identifying marks (e.g., sticker on bottom, lock-screen wallpaper, serial digits, secret scratch)..."
                        className="w-full text-sm rounded-2xl p-3.5 focus:outline-none focus:ring-2 transition-all"
                        style={{
                          background: '#ebf5ff',
                          border: '1.5px solid #e8f1f8',
                          color: '#0a0d12',
                          outlineColor: '#0069e0',
                        }}
                        disabled={claimSubmitting}
                      />
                      <div className="flex items-center justify-between text-xs" style={{ color: '#93979f' }}>
                        <span>Private evidence viewed only by the reporter.</span>
                        <span style={{ color: evidenceText.trim().length >= 10 ? '#93979f' : '#be123c', fontWeight: 500 }}>
                          {evidenceText.trim().length}/10 min chars
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={claimSubmitting || evidenceText.trim().length < 10}
                          className="btn-charcoal-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {claimSubmitting ? 'Verifying…' : 'Submit Ownership Claim'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Logged-Out Prompt */}
              {isLoggedOutViewer && (
                <div
                  className="pt-4 border-t p-6 rounded-2xl text-center space-y-2"
                  style={{ borderColor: '#e8f1f8', background: '#ebf5ff' }}
                >
                  <p className="text-xs font-semibold" style={{ color: '#0a0d12' }}>Is this your item?</p>
                  <p className="text-xs" style={{ color: '#535862' }}>Sign in with your student account to submit ownership proof.</p>
                  <div className="pt-2">
                    <Link to="/login" className="btn-charcoal-sm">
                      Sign In to Claim
                    </Link>
                  </div>
                </div>
              )}

              {/* Resolved Notification */}
              {!isOwner && isResolved && (
                <div className="pt-4 border-t" style={{ borderColor: '#e8f1f8' }}>
                  <div
                    className="p-4 rounded-2xl text-xs flex items-center gap-2"
                    style={{ background: '#d3f6e3', color: '#047857', border: '1px solid #a7f3d0' }}
                  >
                    <span>✓</span>
                    <span>This listing has been officially marked as resolved and closed.</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── Owner Section 1: Claims Management ── */}
        {isOwner && (
          <section
            className="p-8 sm:p-10 space-y-6"
            style={{
              background: '#fafdff',
              borderRadius: '32px',
              boxShadow: 'rgba(4, 69, 144, 0.05) 0px 4px 16px 0px',
            }}
          >
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: '#e8f1f8' }}>
              <div>
                <h2
                  className="text-lg sm:text-xl font-medium tracking-tight"
                  style={{ color: '#0a0d12' }}
                >
                  Claims on This Item
                </h2>
                <p className="text-xs mt-0.5" style={{ color: '#93979f' }}>
                  Review ownership verification submissions from students claiming this possession.
                </p>
              </div>
              {!claimsLoading && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: '#ebf5ff', color: '#0a0d12' }}
                >
                  {claims.length} {claims.length === 1 ? 'claim' : 'claims'}
                </span>
              )}
            </div>

            {claimsLoading && (
              <div className="py-8 text-center text-xs font-medium" style={{ color: '#93979f' }}>
                Checking ownership claims…
              </div>
            )}

            {claimsError && (
              <div
                className="p-4 rounded-2xl text-xs flex items-center justify-between"
                style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}
              >
                <span>{claimsError}</span>
                <button
                  type="button"
                  onClick={fetchClaims}
                  className="font-medium underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {reviewActionError && (
              <div
                className="p-4 rounded-2xl text-xs"
                style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}
              >
                {reviewActionError}
              </div>
            )}

            {!claimsLoading && !claimsError && claims.length === 0 && (
              <div className="py-8 text-center text-xs" style={{ color: '#93979f' }}>
                No student has filed a claim on this report yet.
              </div>
            )}

            {!claimsLoading && !claimsError && claims.length > 0 && (
              <div className="space-y-4">
                {claims.map((c) => {
                  const isPending = c.status === 'PENDING'
                  const isApproved = c.status === 'APPROVED'

                  return (
                    <div
                      key={c.id}
                      className="p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                      style={{ background: '#ebf5ff' }}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                            style={
                              isPending
                                ? { background: '#fff2be', color: '#854d0e' }
                                : isApproved
                                ? { background: '#d3f6e3', color: '#047857' }
                                : { background: '#fff1f2', color: '#be123c' }
                            }
                          >
                            {c.status}
                          </span>
                          <span className="text-xs font-medium" style={{ color: '#0a0d12' }}>
                            Claimant #{c.claimantId}
                          </span>
                          {c.createdAt && (
                            <span className="text-[11px]" style={{ color: '#93979f' }}>
                              • {c.createdAt.substring(0, 10)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: '#535862' }}>
                          <strong style={{ color: '#0a0d12' }}>Evidence:</strong> &ldquo;{c.evidenceText}&rdquo;
                        </p>
                      </div>

                      {isPending && item.status === 'ACTIVE' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={reviewingClaimId === c.id}
                            onClick={() => handleReviewClaim(c.id, 'APPROVE')}
                            className="px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors"
                            style={{ background: '#181d27', color: '#ffffff' }}
                          >
                            {reviewingClaimId === c.id ? 'Processing…' : 'Approve Claim'}
                          </button>
                          <button
                            type="button"
                            disabled={reviewingClaimId === c.id}
                            onClick={() => handleReviewClaim(c.id, 'REJECT')}
                            className="px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border"
                            style={{ borderColor: '#d5e6f0', color: '#535862', background: '#fafdff' }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Owner Section 2: Smart Matching Engine Recommendations ── */}
        {isOwner && (
          <section
            className="p-8 sm:p-10 space-y-6"
            style={{
              background: '#fafdff',
              borderRadius: '32px',
              boxShadow: 'rgba(4, 69, 144, 0.05) 0px 4px 16px 0px',
            }}
          >
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: '#e8f1f8' }}>
              <div>
                <h2
                  className="text-lg sm:text-xl font-medium tracking-tight"
                  style={{ color: '#0a0d12' }}
                >
                  Smart Matching Engine Suggestions
                </h2>
                <p className="text-xs mt-0.5" style={{ color: '#93979f' }}>
                  Automated counterpart recommendations ranked by proximity, category, and keyword analysis.
                </p>
              </div>
              {!matchesLoading && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: '#cce7ff', color: '#0069e0' }}
                >
                  {matches.length} {matches.length === 1 ? 'match' : 'matches'}
                </span>
              )}
            </div>

            {matchesLoading && (
              <div className="py-8 text-center text-xs font-medium" style={{ color: '#93979f' }}>
                Scanning database for proximity matches…
              </div>
            )}

            {matchesError && (
              <div
                className="p-4 rounded-2xl text-xs flex items-center justify-between"
                style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}
              >
                <span>{matchesError}</span>
                <button
                  type="button"
                  onClick={fetchMatches}
                  className="font-medium underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {!matchesLoading && !matchesError && matches.length === 0 && (
              <div className="py-8 text-center text-xs" style={{ color: '#93979f' }}>
                No potential matches detected yet. You will receive an alert when a matching report is filed.
              </div>
            )}

            {!matchesLoading && !matchesError && matches.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((m) => {
                  const scorePercent = Math.round((m.score || 0) * 100)
                  const isStrong = (m.score || 0) >= 0.85
                  const other = m.matchedItem || {}

                  return (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-transform hover:-translate-y-0.5"
                      style={{ background: '#ebf5ff' }}
                    >
                      <div className="flex items-start gap-3.5">
                        {other.imageUrl ? (
                          <img
                            src={other.imageUrl}
                            alt={other.title || 'Matched item'}
                            className="w-16 h-16 object-cover rounded-2xl shrink-0"
                          />
                        ) : (
                          <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-xs font-semibold"
                            style={{ background: '#fafdff', color: '#93979f' }}
                          >
                            No Photo
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={
                                other.type === 'LOST'
                                  ? { background: '#fff1f2', color: '#be123c' }
                                  : { background: '#d3f6e3', color: '#047857' }
                              }
                            >
                              {other.type}
                            </span>
                            <span className="text-[10px]" style={{ color: '#93979f' }}>
                              {other.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium truncate" style={{ color: '#0a0d12' }}>
                            {other.title}
                          </h4>
                          <p className="text-xs truncate mt-0.5" style={{ color: '#535862' }}>
                            {other.locationText || 'Campus area'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: '#d5e6f0' }}>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={
                            isStrong
                              ? { background: '#d3f6e3', color: '#047857' }
                              : { background: '#cce7ff', color: '#0069e0' }
                          }
                        >
                          {scorePercent}% Match ({isStrong ? 'High' : 'Medium'})
                        </span>

                        <Link
                          to={`/items/${other.id}`}
                          className="btn-charcoal-sm"
                        >
                          Inspect Match →
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
    </div>
  )
}
