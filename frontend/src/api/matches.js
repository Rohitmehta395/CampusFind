import axiosClient from './axiosClient'

/**
 * Fetches potential matches for a specific item reported by the authenticated user.
 * Protected endpoint: only the item's reporter is authorized to view its matches (403 otherwise).
 *
 * @param {number|string} itemId - The ID of the item
 * @returns {Promise<{itemId: number, totalMatches: number, matches: Array<Object>}>} Full matches payload
 */
export async function getItemMatchesRequest(itemId) {
  const response = await axiosClient.get(`/api/items/${itemId}/matches`)
  return response.data
}
