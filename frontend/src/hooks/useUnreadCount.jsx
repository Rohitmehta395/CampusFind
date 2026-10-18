import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getUnreadCountRequest } from '../api/notifications'

const UnreadCountContext = createContext(null)

const POLL_INTERVAL_MS = 30000 // 30 seconds

/**
 * Context provider that manages unread notification count and 30s background polling.
 * Follows strict polling hygiene:
 * - Runs only when user is authenticated
 * - Halts completely on logout and unmount
 * - Pauses execution when browser tab is hidden (document.visibilityState)
 * - Fires immediately upon tab regaining visibility
 * - Prevents overlapping in-flight HTTP requests
 * - Fails silently on network errors, preserving last known count
 */
export function UnreadCountProvider({ children }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const inFlightRef = useRef(false)

  const fetchCount = useCallback(async () => {
    if (!user) return
    if (inFlightRef.current) return

    inFlightRef.current = true
    try {
      const data = await getUnreadCountRequest()
      if (data && typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount)
      }
    } catch {
      // Silent failure: preserve last known count without disrupting user flow
    } finally {
      inFlightRef.current = false
    }
  }, [user])

  // Explicit refresh exposed to components (e.g. after marking notifications read)
  const refresh = useCallback(() => {
    return fetchCount()
  }, [fetchCount])

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    // Initial fetch when user becomes authenticated and tab is active
    if (document.visibilityState === 'visible') {
      fetchCount()
    }

    // 30-second polling interval
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'hidden') {
        return // Pause polling while tab is hidden
      }
      fetchCount()
    }, POLL_INTERVAL_MS)

    // Immediate refetch upon tab regaining visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCount()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, fetchCount])

  const value = {
    unreadCount,
    setUnreadCount,
    refresh,
  }

  return (
    <UnreadCountContext.Provider value={value}>
      {children}
    </UnreadCountContext.Provider>
  )
}

/**
 * Hook to consume unread notification count and manual refresh trigger.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useUnreadCount() {
  const context = useContext(UnreadCountContext)
  if (!context) {
    throw new Error('useUnreadCount must be used within an UnreadCountProvider')
  }
  return context
}

export default useUnreadCount
