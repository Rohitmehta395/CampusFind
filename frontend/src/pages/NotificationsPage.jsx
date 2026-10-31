import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getNotificationsRequest,
  markNotificationReadRequest,
  markAllReadRequest,
} from '../api/notifications'
import { useUnreadCount } from '../hooks/useUnreadCount'
import { getNotificationDetails } from '../utils/notificationText'

export const NOTIFICATIONS_PER_PAGE = 10

/**
 * Formats notification ISO timestamp into human-readable date and time.
 * Handles missing seconds and invalid strings safely without throwing.
 */
function formatNotificationDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return dateStr
  }
}

/**
 * Notification list page displaying user alerts with filters, pagination,
 * and bulk/individual read toggling.
 *
 * Design: Geniestudio daylight notebook style — Bone-white cards on sky-tint canvas,
 * iris-blue unread badges, charcoal CTAs.
 */
export default function NotificationsPage() {
  const navigate = useNavigate()
  const { unreadCount, refresh: refreshUnreadBadge } = useUnreadCount()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [markingAll, setMarkingAll] = useState(false)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const triggerRefetch = useCallback(() => {
    setRefetchTrigger((t) => t + 1)
  }, [])

  useEffect(() => {
    let ignore = false

    getNotificationsRequest({
      unreadOnly,
      page,
      limit: NOTIFICATIONS_PER_PAGE,
    })
      .then((data) => {
        if (ignore) return
        const items = data.notifications || []
        const totalCount = data.total || 0
        const totalPageCount = data.totalPages || 1

        if (totalCount > 0 && items.length === 0 && page > totalPageCount) {
          setPage(totalPageCount)
          return
        }

        setNotifications(items)
        setTotal(totalCount)
        setTotalPages(totalPageCount)
        setError('')
      })
      .catch((err) => {
        if (ignore) return
        setError(
          err.response?.data?.error || err.message || 'Failed to load notifications'
        )
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [unreadOnly, page, refetchTrigger])

  // Handle Mark All As Read
  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return
    setMarkingAll(true)
    try {
      await markAllReadRequest()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      )
      await refreshUnreadBadge()
      if (unreadOnly) {
        setPage(1)
        triggerRefetch()
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to mark all as read'
      )
    } finally {
      setMarkingAll(false)
    }
  }

  const handleItemClick = (notification, href) => {
    if (!notification.isRead) {
      markNotificationReadRequest(notification.id)
        .then(() => refreshUnreadBadge())
        .catch(() => {})

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      )
    }

    if (href) {
      navigate(href)
    }
  }

  const handleMarkSingleRead = async (e, notificationId) => {
    e.stopPropagation()
    try {
      await markNotificationReadRequest(notificationId)
      await refreshUnreadBadge()

      if (unreadOnly) {
        if (notifications.length === 1 && page > 1) {
          setPage((p) => Math.max(1, p - 1))
        } else {
          triggerRefetch()
        }
      } else {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        )
      }
    } catch {
      // Ignore
    }
  }

  return (
    <div
      className="w-full min-h-screen px-5 sm:px-8 py-10"
      style={{ background: '#ebf5ff' }}
    >
      <div className="max-w-[900px] mx-auto space-y-6">

        {/* Header with Title and Global Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b" style={{ borderColor: '#e8f1f8' }}>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-medium tracking-tight"
              style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
            >
              Activity Alerts &amp; Notifications
            </h1>
            <p className="text-xs sm:text-sm mt-1" style={{ color: '#93979f' }}>
              Stay updated on Smart Matches, ownership claim reviews, and report resolutions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="unread-only-toggle"
              className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none px-3.5 py-1.5 rounded-full border transition-colors"
              style={{ background: '#fafdff', color: '#535862', borderColor: '#d5e6f0' }}
            >
              <input
                id="unread-only-toggle"
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => {
                  setLoading(true)
                  setUnreadOnly(e.target.checked)
                  setPage(1)
                }}
                className="w-3.5 h-3.5 rounded cursor-pointer"
                style={{ accentColor: '#181d27' }}
              />
              <span>Unread only</span>
            </label>

            <button
              id="mark-all-read-btn"
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markingAll}
              className="btn-charcoal-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {markingAll ? 'Updating…' : 'Mark all read'}
            </button>
          </div>
        </div>

        {/* Main Content State Handling */}
        {loading ? (
          <div id="notifications-loading" className="py-20 text-center space-y-3">
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium"
              style={{ background: '#fafdff', color: '#535862' }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#0069e0' }} />
              Loading notifications…
            </div>
          </div>
        ) : error ? (
          <div id="notifications-error" className="py-12 text-center">
            <div
              className="p-5 rounded-2xl max-w-md mx-auto text-xs mb-4"
              style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}
            >
              {error}
            </div>
            <button
              id="notifications-retry-btn"
              type="button"
              onClick={triggerRefetch}
              className="btn-charcoal-sm"
            >
              Retry Connection
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div
            id="notifications-empty"
            className="py-16 text-center p-8 max-w-md mx-auto space-y-3 rounded-[32px]"
            style={{
              background: '#fafdff',
              boxShadow: 'rgba(4, 69, 144, 0.05) 0px 4px 16px 0px',
            }}
          >
            <div
              className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
              style={{ background: '#ebf5ff', color: '#93979f' }}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-base font-medium" style={{ color: '#0a0d12' }}>All caught up</h3>
            <p className="text-xs leading-relaxed max-w-xs mx-auto" style={{ color: '#93979f' }}>
              {unreadOnly
                ? "You don't have any unread notifications right now."
                : 'You have no alerts yet. Check back when your items have matches or verification claims.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const { message, href } = getNotificationDetails(notification)
              const isUnread = !notification.isRead

              return (
                <div
                  key={notification.id}
                  id={`notification-item-${notification.id}`}
                  onClick={() => handleItemClick(notification, href)}
                  className="p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4"
                  style={{
                    background: '#fafdff',
                    borderColor: isUnread ? '#cce7ff' : '#e8f1f8',
                    boxShadow: isUnread ? 'rgba(0, 105, 224, 0.08) 0px 4px 12px 0px' : 'none',
                  }}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="pt-1.5 shrink-0">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{
                          background: isUnread ? '#0069e0' : '#d5e6f0',
                        }}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <p
                        className="text-sm leading-snug break-words"
                        style={{
                          color: '#0a0d12',
                          fontWeight: isUnread ? 600 : 400,
                        }}
                      >
                        {message}
                      </p>
                      <span className="text-[11px] block" style={{ color: '#93979f' }}>
                        {formatNotificationDate(notification.createdAt)}
                      </span>
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      type="button"
                      title="Mark as read"
                      onClick={(e) => handleMarkSingleRead(e, notification.id)}
                      className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                      style={{ background: '#ebf5ff', color: '#535862' }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && totalPages > 1 && (
          <div
            id="notifications-pagination"
            className="mt-8 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
            style={{ borderColor: '#e8f1f8', color: '#93979f' }}
          >
            <div>
              Showing page <span className="font-semibold" style={{ color: '#0a0d12' }}>{page}</span> of{' '}
              <span className="font-semibold" style={{ color: '#0a0d12' }}>{totalPages}</span> ({total} alerts)
            </div>

            <div className="flex items-center gap-3">
              <button
                id="notifications-prev-btn"
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3.5 py-1.5 text-xs font-medium rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: '#fafdff', color: '#535862', borderColor: '#d5e6f0' }}
              >
                Previous
              </button>

              <span className="text-xs px-2" style={{ color: '#93979f' }}>
                Page <span style={{ color: '#0a0d12', fontWeight: 600 }}>{page}</span> / {totalPages}
              </span>

              <button
                id="notifications-next-btn"
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3.5 py-1.5 text-xs font-medium rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: '#fafdff', color: '#535862', borderColor: '#d5e6f0' }}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
