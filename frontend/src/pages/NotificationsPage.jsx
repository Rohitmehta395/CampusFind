import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  getNotificationsRequest,
  markNotificationReadRequest,
  markAllReadRequest,
} from '../api/notifications'
import { getConversationsRequest } from '../api/conversations'
import { useUnreadCount } from '../hooks/useUnreadCount'
import { getNotificationDetails } from '../utils/notificationText'
import ChatModal from '../components/ChatModal'

export const NOTIFICATIONS_PER_PAGE = 10

/**
 * Formats notification ISO timestamp into human-readable date and time.
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
 * Unified Activity & Messaging Hub.
 * Provides WhatsApp / Instagram Direct-style person-to-person chats alongside system alerts.
 */
export default function NotificationsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { unreadCount, refresh: refreshUnreadBadge } = useUnreadCount()

  // Tabs: 'chats' (Direct Messages) vs 'alerts' (Activity Alerts)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'chats')

  // Conversations state (WhatsApp/Instagram style)
  const [conversations, setConversations] = useState([])
  const [conversationsLoading, setConversationsLoading] = useState(true)

  // System Notifications state
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [markingAll, setMarkingAll] = useState(false)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  // Direct Chat Modal state
  const [chatModalOpen, setChatModalOpen] = useState(false)
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [selectedOtherUserId, setSelectedOtherUserId] = useState(null)

  const triggerRefetch = useCallback(() => {
    setRefetchTrigger((t) => t + 1)
  }, [])

  // Fetch conversations (WhatsApp / Instagram chats)
  const fetchConversations = useCallback(async () => {
    try {
      setConversationsLoading(true)
      const data = await getConversationsRequest()
      setConversations(data || [])
    } catch {
      // Non-critical fallback
    } finally {
      setConversationsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations, refetchTrigger])

  // Fetch system notifications
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

  // Calculate total unread chat messages
  const totalUnreadMessages = conversations.reduce(
    (acc, c) => acc + (c.unreadCount || 0),
    0
  )

  // Filter out raw individual NEW_MESSAGE pings from the alerts tab to prevent spam
  const systemAlerts = notifications.filter((n) => n.type !== 'NEW_MESSAGE')

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

  // Open direct chat modal for a conversation
  const handleOpenChat = (conv) => {
    setSelectedConversationId(conv.id)
    setSelectedOtherUserId(conv.otherUser?.id || null)
    setChatModalOpen(true)
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

    if (notification.type === 'NEW_MESSAGE' && notification.payload?.conversationId) {
      setSelectedConversationId(notification.payload.conversationId)
      setSelectedOtherUserId(null)
      setChatModalOpen(true)
      return
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

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  return (
    <div
      className="w-full min-h-screen px-4 sm:px-8 py-8"
      style={{ background: '#ebf5ff' }}
    >
      <div className="max-w-[900px] mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b" style={{ borderColor: '#e8f1f8' }}>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-semibold tracking-tight"
              style={{ color: '#0a0d12' }}
            >
              Messages &amp; Activity
            </h1>
            <p className="text-xs sm:text-sm mt-1" style={{ color: '#535862' }}>
              Chat directly with students to coordinate recovery and review ownership claims.
            </p>
          </div>

          {activeTab === 'alerts' && (
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
          )}
        </div>

        {/* ── WhatsApp / Instagram Style Segmented Tabs ── */}
        <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: '#e8f1f8' }}>
          <button
            type="button"
            onClick={() => handleTabChange('chats')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'chats'
                ? 'bg-[#181d27] text-white shadow-sm'
                : 'bg-white text-[#535862] hover:text-[#0a0d12] hover:bg-white/80 border border-[#e8f1f8]'
            }`}
          >
            <span>💬 Direct Chats</span>
            {totalUnreadMessages > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: activeTab === 'chats' ? '#0069e0' : '#181d27',
                  color: '#ffffff',
                }}
              >
                {totalUnreadMessages}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('alerts')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'alerts'
                ? 'bg-[#181d27] text-white shadow-sm'
                : 'bg-white text-[#535862] hover:text-[#0a0d12] hover:bg-white/80 border border-[#e8f1f8]'
            }`}
          >
            <span>🔔 Activity Alerts</span>
            {systemAlerts.some((a) => !a.isRead) && (
              <span className="w-2 h-2 rounded-full bg-[#0069e0]" />
            )}
          </button>
        </div>

        {/* ── TAB 1: WhatsApp / Instagram Direct Chats ── */}
        {activeTab === 'chats' && (
          <div className="space-y-3">
            {conversationsLoading && (
              <div className="py-16 text-center text-xs font-medium" style={{ color: '#93979f' }}>
                Loading student chats…
              </div>
            )}

            {!conversationsLoading && conversations.length === 0 && (
              <div
                className="py-16 text-center p-8 max-w-md mx-auto space-y-3 rounded-[32px]"
                style={{
                  background: '#fafdff',
                  boxShadow: 'rgba(4, 69, 144, 0.05) 0px 4px 16px 0px',
                }}
              >
                <div
                  className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: '#ebf5ff', color: '#0069e0' }}
                >
                  💬
                </div>
                <h3 className="text-base font-semibold" style={{ color: '#0a0d12' }}>
                  No active conversations yet
                </h3>
                <p className="text-xs leading-relaxed max-w-xs mx-auto" style={{ color: '#535862' }}>
                  When someone files a claim on your report or you claim an item, you can message each other directly here like WhatsApp or Instagram.
                </p>
              </div>
            )}

            {!conversationsLoading &&
              conversations.map((c) => {
                const initials = c.otherUser?.name
                  ? c.otherUser.name.slice(0, 2).toUpperCase()
                  : 'ST'
                const hasUnread = c.unreadCount > 0

                return (
                  <div
                    key={c.id}
                    onClick={() => handleOpenChat(c)}
                    className="p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 hover:shadow-md"
                    style={{
                      background: '#ffffff',
                      borderColor: hasUnread ? '#cce7ff' : '#e8f1f8',
                      boxShadow: hasUnread
                        ? 'rgba(0, 105, 224, 0.08) 0px 4px 14px 0px'
                        : 'rgba(4, 69, 144, 0.02) 0px 2px 8px 0px',
                    }}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Avatar with initial & online indicator */}
                      <div className="relative shrink-0">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm tracking-wider shadow-sm"
                          style={{
                            background: 'linear-gradient(135deg, #181d27 0%, #2d3748 100%)',
                            color: '#ffffff',
                          }}
                        >
                          {initials}
                        </div>
                        <span
                          className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white bg-emerald-500"
                          title="Online"
                        />
                      </div>

                      {/* Info: Name, Role, Item chip, Message snippet */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <h3 className="font-semibold text-sm sm:text-base truncate" style={{ color: '#0a0d12' }}>
                              {c.otherUser?.name || 'Student'}
                            </h3>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ background: '#d3f6e3', color: '#047857' }}
                            >
                              Verified Student
                            </span>
                            {c.itemId && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium truncate max-w-[120px]"
                                style={{ background: '#ebf5ff', color: '#0069e0' }}
                              >
                                Item #{c.itemId}
                              </span>
                            )}
                          </div>
                          {c.lastMessage?.createdAt && (
                            <span className="text-[11px] shrink-0" style={{ color: '#93979f' }}>
                              {formatNotificationDate(c.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>

                        <p
                          className="text-xs sm:text-sm truncate"
                          style={{
                            color: hasUnread ? '#0a0d12' : '#535862',
                            fontWeight: hasUnread ? 600 : 400,
                          }}
                        >
                          {c.lastMessage?.text || 'Started a conversation'}
                        </p>
                      </div>
                    </div>

                    {/* Unread Pill or Chat button */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {hasUnread && (
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-bold shadow-xs"
                          style={{ background: '#0069e0', color: '#ffffff' }}
                        >
                          {c.unreadCount} new
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn-charcoal-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>💬</span>
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* ── TAB 2: Activity Alerts (Filtered to prevent spam) ── */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {/* Direct message banner in alerts if there are unread messages */}
            {totalUnreadMessages > 0 && (
              <div
                onClick={() => handleTabChange('chats')}
                className="p-4 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all border shadow-xs"
                style={{ background: '#ebf5ff', borderColor: '#cce7ff', color: '#0069e0' }}
              >
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                  <span className="text-base">💬</span>
                  <span>
                    You have {totalUnreadMessages} unread message{totalUnreadMessages > 1 ? 's' : ''} from students.
                  </span>
                </div>
                <span className="text-xs font-semibold underline">Open Chats →</span>
              </div>
            )}

            {loading ? (
              <div id="notifications-loading" className="py-20 text-center space-y-3">
                <div
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium"
                  style={{ background: '#fafdff', color: '#535862' }}
                >
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#0069e0' }} />
                  Loading alerts…
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
            ) : systemAlerts.length === 0 ? (
              <div
                id="notifications-empty"
                className="py-16 text-center p-8 max-w-md mx-auto space-y-3 rounded-[32px]"
                style={{
                  background: '#fafdff',
                  boxShadow: 'rgba(4, 69, 144, 0.05) 0px 4px 16px 0px',
                }}
              >
                <div
                  className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: '#ebf5ff', color: '#93979f' }}
                >
                  🔔
                </div>
                <h3 className="text-base font-medium" style={{ color: '#0a0d12' }}>All caught up</h3>
                <p className="text-xs leading-relaxed max-w-xs mx-auto" style={{ color: '#93979f' }}>
                  {unreadOnly
                    ? "You don't have any unread alerts right now."
                    : 'You have no system alerts yet. Check back when your items have matches or verification claims.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {systemAlerts.map((notification) => {
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
        )}

      </div>

      {/* ── Direct Chat Modal (opens instantly when clicking any chat card) ── */}
      <ChatModal
        isOpen={chatModalOpen}
        onClose={() => {
          setChatModalOpen(false)
          fetchConversations()
          refreshUnreadBadge()
        }}
        conversationId={selectedConversationId}
        otherUserId={selectedOtherUserId}
      />
    </div>
  )
}
