import axiosClient from './axiosClient'

/**
 * Fetches paginated notifications for the authenticated user.
 *
 * @param {Object} [params] - Optional query parameters
 * @param {boolean} [params.unreadOnly] - Filter to only unread notifications
 * @param {number} [params.page=1] - Page number (1-based)
 * @param {number} [params.limit=20] - Number of items per page
 * @returns {Promise<{notifications: Array<Object>, page: number, limit: number, total: number, totalPages: number}>}
 */
export async function getNotificationsRequest(params = {}) {
  const response = await axiosClient.get('/api/notifications', { params })
  return response.data
}

/**
 * Fetches the count of unread notifications for the authenticated user.
 *
 * @returns {Promise<{unreadCount: number}>}
 */
export async function getUnreadCountRequest() {
  const response = await axiosClient.get('/api/notifications/unread-count')
  return response.data
}

/**
 * Marks a specific notification as read.
 *
 * @param {number|string} id - Notification ID
 * @returns {Promise<{id: number, isRead: boolean}>}
 */
export async function markNotificationReadRequest(id) {
  const response = await axiosClient.patch(`/api/notifications/${id}/read`)
  return response.data
}

/**
 * Marks all notifications for the authenticated user as read.
 *
 * @returns {Promise<{updated: number}>}
 */
export async function markAllReadRequest() {
  const response = await axiosClient.patch('/api/notifications/read-all')
  return response.data
}
