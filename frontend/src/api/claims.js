import axiosClient from './axiosClient'

/**
 * Submits an ownership claim against an active lost/found item.
 * Protected endpoint: authenticated claimant only.
 *
 * @param {number|string} itemId - The ID of the item being claimed
 * @param {string} evidenceText - Detailed proof or description establishing ownership (min 10 characters)
 * @returns {Promise<{id: number, itemId: number, claimantId: number, status: string, createdAt: string}>} Created claim record
 */
export async function submitClaimRequest(itemId, evidenceText) {
  const response = await axiosClient.post('/api/claims', {
    itemId,
    evidenceText,
  })
  return response.data
}

/**
 * Fetches all claims filed against a specific item.
 * Protected endpoint: only the item's reporter is authorized to view its claims (403 Forbidden otherwise).
 * Includes evidenceText for review.
 *
 * @param {number|string} itemId - The ID of the item
 * @returns {Promise<{itemId: number, totalClaims: number, claims: Array<Object>}>} Full claims list payload
 */
export async function getItemClaimsRequest(itemId) {
  const response = await axiosClient.get(`/api/items/${itemId}/claims`)
  return response.data
}

/**
 * Reviews and decides on a claim (Approve or Reject).
 * Protected endpoint: only the item's reporter is authorized to review claims against their item.
 * Approving flips the item status to RESOLVED and automatically bulk-rejects sibling pending claims.
 *
 * @param {number|string} claimId - The ID of the claim being reviewed
 * @param {'APPROVED'|'REJECTED'} decision - Decision string ('APPROVED' or 'REJECTED')
 * @returns {Promise<{id: number, itemId: number, claimantId: number, status: string, reviewedBy: number, createdAt: string, reviewedAt: string}>} Updated claim record
 */
export async function reviewClaimRequest(claimId, decision) {
  const response = await axiosClient.patch(`/api/claims/${claimId}`, {
    decision,
  })
  return response.data
}
