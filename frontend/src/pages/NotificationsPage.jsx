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

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getNotificationsRequest({
        unreadOnly,
        page,
        limit: NOTIFICATIONS_PER_PAGE,
      })
      setNotifications(data.notifications || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || 'Failed to load notifications'
      )
    } finally {
      setLoading(false)
    }
  }, [unreadOnly, page])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Handle Mark All As Read
  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return
    setMarkingAll(true)
    try {
      await markAllReadRequest()
      // Optimistically mark all visible items as read in UI
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      )
      // Immediately refresh top nav badge
      await refreshUnreadBadge()
      // If filtering by unread-only, re-fetch list to show empty state
      if (unreadOnly) {
        fetchNotifications()
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

  // Handle clicking a notification item: marks read, updates badge, and navigates
  const handleItemClick = (notification, href) => {
    if (!notification.isRead) {
      // Fire-and-forget read request
      markNotificationReadRequest(notification.id)
        .then(() => refreshUnreadBadge())
        .catch(() => {})

      // Optimistically mark as read in local list
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

  // Handle individual "Mark as read" button click without navigating
  const handleMarkSingleRead = async (e, notificationId) => {
    e.stopPropagation()
    try {
      await markNotificationReadRequest(notificationId)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      )
      await refreshUnreadBadge()
      if (unreadOnly) {
        fetchNotifications()
      }
    } catch {
      // Ignore or silently fail
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-6">
      {/* Header with Title and Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay updated on item matches, claims, and activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Unread Only Toggle */}
          <label
            htmlFor="unread-only-toggle"
            className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none"
          >
            <input
              id="unread-only-toggle"
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => {
                setUnreadOnly(e.target.checked)
                setPage(1) // Reset to first page on filter toggle
              }}
              className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-500 cursor-pointer"
            />
            <span className="font-medium">Unread only</span>
          </label>

          {/* Mark All As Read Button */}
          <button
            id="mark-all-read-btn"
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || markingAll}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
          >
            {markingAll ? 'Marking...' : 'Mark all as read'}
          </button>
        </div>
      </div>

      {/* Main Content State Handling */}
      {loading ? (
        <div id="notifications-loading" className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-3 border-slate-300 border-t-slate-800 rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-slate-500 font-medium">Loading notifications...</p>
        </div>
      ) : error ? (
        <div id="notifications-error" className="py-12 text-center">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl max-w-md mx-auto text-rose-700 text-sm mb-4">
            {error}
          </div>
          <button
            id="notifications-retry-btn"
            type="button"
            onClick={fetchNotifications}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div id="notifications-empty" className="py-16 text-center">
          <div className="w-12 h-12 mx-auto mb-3 text-slate-400 bg-slate-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-800">No notifications</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            {unreadOnly
              ? "You don't have any unread notifications right now."
              : 'You have no notifications yet. Check back when your items have matches or claims.'}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {notifications.map((notification) => {
            const { message, href } = getNotificationDetails(notification)
            const isUnread = !notification.isRead

            return (
              <div
                key={notification.id}
                id={`notification-item-${notification.id}`}
                onClick={() => handleItemClick(notification, href)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  isUnread
                    ? 'bg-white border-blue-200 shadow-xs hover:border-blue-400 ring-1 ring-blue-100'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Indicator Dot */}
                  <div className="pt-1 flex-shrink-0">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        isUnread ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Message & Timestamp */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm tracking-tight leading-snug break-words ${
                        isUnread
                          ? 'font-semibold text-slate-900'
                          : 'font-normal text-slate-700'
                      }`}
                    >
                      {message}
                    </p>
                    <span className="text-xs text-slate-500 mt-1 inline-block">
                      {formatNotificationDate(notification.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Right Action: Mark as read button for unread items */}
                {isUnread && (
                  <button
                    type="button"
                    title="Mark as read"
                    onClick={(e) => handleMarkSingleRead(e, notification.id)}
                    className="flex-shrink-0 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
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
          className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-600"
        >
          <div className="text-xs text-slate-500">
            Showing page <span className="font-semibold text-slate-700">{page}</span> of{' '}
            <span className="font-semibold text-slate-700">{totalPages}</span> ({total} notifications)
          </div>

          <div className="flex items-center gap-3">
            <button
              id="notifications-prev-btn"
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              Previous
            </button>

            <span className="text-xs font-medium text-slate-600 px-2">
              Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
              <span className="font-semibold text-slate-900">{totalPages}</span>
            </span>

            <button
              id="notifications-next-btn"
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
