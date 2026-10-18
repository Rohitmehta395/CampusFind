import { Link } from 'react-router-dom'
import { useUnreadCount } from '../hooks/useUnreadCount'

/**
 * Top navigation bell icon with dynamic unread notification badge.
 * Displays unread count, badge capped at '9+' for counts > 9, and hidden at 0.
 */
export default function NotificationBell() {
  const { unreadCount } = useUnreadCount()

  const badgeText = unreadCount > 9 ? '9+' : unreadCount

  return (
    <Link
      id="notification-bell-link"
      to="/notifications"
      className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-400"
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      title="Notifications"
    >
      {/* Inline Bell SVG Icon */}
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Unread count badge (visible only when count > 0) */}
      {unreadCount > 0 && (
        <span
          id="unread-count-badge"
          className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center leading-none ring-2 ring-white shadow-xs animate-in fade-in duration-200"
        >
          {badgeText}
        </span>
      )}
    </Link>
  )
}
