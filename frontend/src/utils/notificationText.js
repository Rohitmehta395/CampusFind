/**
 * Pure mapping helper that converts a notification domain object into a human-readable
 * message and appropriate internal navigation link.
 *
 * Defensive against null/undefined payloads, missing keys, and unexpected types.
 *
 * @param {Object} notification - Notification record
 * @param {string} notification.type - Notification type enum
 * @param {Object|null} notification.payload - JSON payload containing IDs and numerical scores
 * @returns {{message: string, href: string}} Object with human-readable message and target URL
 */
export function getNotificationDetails(notification) {
  if (!notification) {
    return {
      message: 'You have a new notification',
      href: '/notifications',
    }
  }

  const { type, payload } = notification

  if (!payload || typeof payload !== 'object') {
    return {
      message: 'You have a new notification',
      href: '/notifications',
    }
  }

  const itemId = payload.itemId
  const targetHref = itemId ? `/items/${itemId}` : '/notifications'

  switch (type) {
    case 'MATCH_FOUND': {
      if (!itemId) {
        return { message: 'Potential match found for your item', href: '/notifications' }
      }
      const rawScore = payload.score
      if (rawScore !== undefined && rawScore !== null && !isNaN(rawScore)) {
        const scorePercent = Math.round(Number(rawScore) * 100)
        return {
          message: `Potential match found for your item #${itemId} (${scorePercent}% match)`,
          href: targetHref,
        }
      }
      return {
        message: `Potential match found for your item #${itemId}`,
        href: targetHref,
      }
    }

    case 'CLAIM_SUBMITTED': {
      if (!itemId) {
        return { message: 'Someone submitted a claim on your item', href: '/notifications' }
      }
      return {
        message: `Someone submitted a claim on your item #${itemId}`,
        href: targetHref,
      }
    }

    case 'CLAIM_APPROVED': {
      if (!itemId) {
        return { message: 'Your claim was approved', href: '/notifications' }
      }
      return {
        message: `Your claim on item #${itemId} was approved`,
        href: targetHref,
      }
    }

    case 'CLAIM_REJECTED': {
      if (!itemId) {
        return { message: 'Your claim was not approved', href: '/notifications' }
      }
      return {
        message: `Your claim on item #${itemId} was not approved`,
        href: targetHref,
      }
    }

    case 'ITEM_RESOLVED': {
      const resolvedItemId = payload.resolvedItemId
      if (!itemId || !resolvedItemId) {
        return { message: 'A matched item linked to your item was resolved', href: targetHref }
      }
      return {
        message: `A matched item (#${resolvedItemId}) linked to your item #${itemId} was resolved`,
        href: targetHref,
      }
    }

    default:
      return {
        message: 'You have a new notification',
        href: targetHref,
      }
  }
}
