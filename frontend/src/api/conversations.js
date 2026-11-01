import axiosClient from './axiosClient'

/**
 * Starts a new conversation or retrieves an existing one with identical participants and item.
 *
 * @param {number|string} otherUserId - The ID of the other participant (finder or claimant)
 * @param {number|string|null} itemId - The ID of the item being discussed
 * @returns {Promise<{id: number, otherUser: {id: number, name: string, email: string}, itemId: number|null, createdAt: string}>}
 */
export async function startConversationRequest(otherUserId, itemId = null) {
  const response = await axiosClient.post('/api/conversations', {
    otherUserId: Number(otherUserId),
    itemId: itemId ? Number(itemId) : null,
  })
  return response.data
}

/**
 * Fetches all conversations for the authenticated user, ordered by most recent message.
 *
 * @returns {Promise<Array<{
 *   id: number,
 *   itemId: number|null,
 *   otherUser: {id: number, name: string, email: string},
 *   lastMessage: {text: string, senderId: number, createdAt: string}|null,
 *   unreadCount: number,
 *   createdAt: string
 * }>>}
 */
export async function getConversationsRequest() {
  const response = await axiosClient.get('/api/conversations')
  return response.data
}

/**
 * Retrieves paginated messages for a conversation in ascending order (oldest first).
 *
 * @param {number|string} conversationId - The conversation ID
 * @param {number} [page=1] - 1-based page index
 * @param {number} [limit=50] - Number of messages per page
 * @returns {Promise<{
 *   messages: Array<{id: number, conversationId: number, senderId: number, text: string, isRead: boolean, createdAt: string}>,
 *   page: number,
 *   limit: number,
 *   total: number,
 *   totalPages: number
 * }>}
 */
export async function getMessagesRequest(conversationId, page = 1, limit = 50) {
  const response = await axiosClient.get(`/api/conversations/${conversationId}/messages`, {
    params: { page, limit },
  })
  return response.data
}

/**
 * Sends a message in the specified conversation.
 *
 * @param {number|string} conversationId - The conversation ID
 * @param {string} text - Message content (max 2000 chars)
 * @returns {Promise<{id: number, conversationId: number, senderId: number, text: string, isRead: boolean, createdAt: string}>}
 */
export async function sendMessageRequest(conversationId, text) {
  const response = await axiosClient.post(`/api/conversations/${conversationId}/messages`, {
    text,
  })
  return response.data
}

/**
 * Marks unread messages in a conversation as read for the active caller.
 *
 * @param {number|string} conversationId - The conversation ID
 * @returns {Promise<{updated: number}>}
 */
export async function markConversationReadRequest(conversationId) {
  const response = await axiosClient.patch(`/api/conversations/${conversationId}/messages/read`)
  return response.data
}
