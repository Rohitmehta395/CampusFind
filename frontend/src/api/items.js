import axiosClient from './axiosClient'

/**
 * Creates a new item report (Lost or Found) via the backend API.
 * Sanitizes input fields so that empty/whitespace-only values are omitted
 * rather than sent as empty strings, ensuring the database stores them as NULL.
 * Note: reporterId is never sent from the frontend; it is securely derived
 * server-side from the authenticated JWT token.
 *
 * @param {Object} itemData - Item form fields
 * @param {string} itemData.type - 'LOST' or 'FOUND'
 * @param {string} itemData.title - Descriptive title of item
 * @param {string} itemData.category - Category classification
 * @param {string} [itemData.color] - Optional color
 * @param {string} [itemData.brand] - Optional brand
 * @param {string} [itemData.description] - Optional description
 * @param {string} [itemData.locationText] - Optional location description
 * @param {string} [itemData.eventDate] - Optional date in YYYY-MM-DD format
 * @returns {Promise<Object>} The created Item object from the server
 */
export async function createItemRequest(itemData) {
  const payload = {}

  // Always include type
  if (itemData.type) {
    payload.type = itemData.type.trim()
  }

  // Sanitize and include string fields only if non-empty
  const stringFields = [
    'title',
    'category',
    'color',
    'brand',
    'description',
    'imageUrl',
    'locationText',
    'eventDate',
  ]

  for (const field of stringFields) {
    const val = itemData[field]
    if (typeof val === 'string' && val.trim() !== '') {
      payload[field] = val.trim()
    }
  }

  const response = await axiosClient.post('/api/items', payload)
  return response.data
}

/**
 * Fetches all items from the public browse endpoint.
 * Unwraps the `{"items":[...]}` response shape so callers receive a plain array.
 *
 * @returns {Promise<Array<Object>>} List of all active items ordered newest-first
 */
export async function getAllItemsRequest() {
  const response = await axiosClient.get('/api/items')
  return response.data?.items || []
}

/**
 * Fetches a single item's complete detail by its numeric ID.
 * Returns the unwrapped Item object. Throws 404 error if item does not exist.
 *
 * @param {number|string} id - The item ID
 * @returns {Promise<Object>} The item detail object
 */
export async function getItemByIdRequest(id) {
  const response = await axiosClient.get(`/api/items/${id}`)
  return response.data
}

/**
 * Fetches the authenticated user's reported items from the protected endpoint.
 * Unwraps the `{"items":[...]}` response shape so callers receive a plain array.
 *
 * @returns {Promise<Array<Object>>} List of items reported by the authenticated caller
 */
export async function getMyItemsRequest() {
  const response = await axiosClient.get('/api/items/mine')
  return response.data?.items || []
}
