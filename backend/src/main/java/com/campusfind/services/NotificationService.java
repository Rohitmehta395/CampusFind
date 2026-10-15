package com.campusfind.services;

import com.campusfind.dao.NotificationDAO;
import com.campusfind.exceptions.NotFoundException;
import com.campusfind.models.Notification;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Service layer managing user notifications.
 * Provides read, count, and status-update operations for authenticated users,
 * as well as a safe, exception-free notification dispatch helper for other domain services.
 */
public class NotificationService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            Notification.TYPE_MATCH_FOUND,
            Notification.TYPE_CLAIM_SUBMITTED,
            Notification.TYPE_CLAIM_APPROVED,
            Notification.TYPE_CLAIM_REJECTED,
            Notification.TYPE_NEW_MESSAGE,
            Notification.TYPE_ITEM_RESOLVED
    );

    public static final int DEFAULT_PAGE = 1;
    public static final int DEFAULT_LIMIT = 20;
    public static final int MAX_LIMIT = 50;

    private final NotificationDAO notificationDAO;
    private final ObjectMapper objectMapper;

    /**
     * Data Transfer Object encapsulating a paginated list of notifications and pagination metadata.
     */
    public static class PagedNotifications {
        private final List<Notification> notifications;
        private final int page;
        private final int limit;
        private final int total;
        private final int totalPages;

        public PagedNotifications(List<Notification> notifications, int page, int limit, int total, int totalPages) {
            this.notifications = notifications;
            this.page = page;
            this.limit = limit;
            this.total = total;
            this.totalPages = totalPages;
        }

        public List<Notification> getNotifications() {
            return notifications;
        }

        public int getPage() {
            return page;
        }

        public int getLimit() {
            return limit;
        }

        public int getTotal() {
            return total;
        }

        public int getTotalPages() {
            return totalPages;
        }
    }

    public NotificationService() {
        this(new NotificationDAO(), new ObjectMapper());
    }

    public NotificationService(NotificationDAO notificationDAO) {
        this(notificationDAO, new ObjectMapper());
    }

    public NotificationService(NotificationDAO notificationDAO, ObjectMapper objectMapper) {
        this.notificationDAO = notificationDAO;
        this.objectMapper = objectMapper;
    }

    /**
     * Safe creation helper designed for other domain services (matching, claims, chat).
     * Must NEVER throw to its caller: wraps all operations in try-catch and logs failures to System.err.
     * To protect user privacy, payload contents are never logged.
     *
     * @param userId  the recipient user's ID
     * @param type    the notification category string (must match one of the six allowed types)
     * @param payload optional structured key-value data to serialize as JSON
     */
    public void notifyUser(Long userId, String type, Map<String, Object> payload) {
        try {
            if (userId == null || userId <= 0) {
                System.err.println("NotificationService.notifyUser: Skipping notification due to invalid userId: " + userId);
                return;
            }

            if (type == null || !ALLOWED_TYPES.contains(type)) {
                System.err.println("NotificationService.notifyUser: Skipping notification due to unknown type: " + type);
                return;
            }

            String payloadJson = null;
            if (payload != null && !payload.isEmpty()) {
                payloadJson = objectMapper.writeValueAsString(payload);
            }

            Notification notification = new Notification();
            notification.setUserId(userId);
            notification.setType(type);
            notification.setPayload(payloadJson);
            notification.setRead(false);

            notificationDAO.insert(notification);
        } catch (Exception e) {
            System.err.println("NotificationService.notifyUser: Failed to deliver notification of type "
                    + type + " to userId " + userId + ": " + e.getMessage());
        }
    }

    /**
     * Lists notifications for a given user with pagination and optional unread filter.
     * Applies standard defaulting (page 1, limit 20, max limit 50).
     *
     * @param userId     the authenticated user's ID
     * @param unreadOnly whether to filter strictly to unread notifications
     * @param page       optional 1-based page number
     * @param limit      optional page size
     * @return PagedNotifications containing results and metadata
     * @throws SQLException if a database access error occurs
     */
    public PagedNotifications list(Long userId, boolean unreadOnly, Integer page, Integer limit) throws SQLException {
        int actualPage = (page == null || page < 1) ? DEFAULT_PAGE : page;
        int actualLimit = (limit == null || limit < 1) ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);

        List<Notification> items = notificationDAO.findByUser(userId, unreadOnly, actualPage, actualLimit);
        int total = notificationDAO.countByUser(userId, unreadOnly);
        int totalPages = (total == 0) ? 0 : (int) Math.ceil((double) total / actualLimit);

        return new PagedNotifications(items, actualPage, actualLimit, total, totalPages);
    }

    /**
     * Retrieves the count of unread notifications for a user.
     *
     * @param userId the user's ID
     * @return number of unread notifications
     * @throws SQLException if a database access error occurs
     */
    public int getUnreadCount(Long userId) throws SQLException {
        return notificationDAO.countUnread(userId);
    }

    /**
     * Marks a specific notification as read.
     * Enforces ownership in SQL; if no row was affected, throws NotFoundException
     * (deliberately not 403 to prevent ID probing).
     *
     * @param notificationId the notification ID
     * @param userId         the authenticated user's ID
     * @throws NotFoundException if the notification does not exist or does not belong to the user
     * @throws SQLException      if a database access error occurs
     */
    public void markRead(Long notificationId, Long userId) throws SQLException {
        if (notificationId == null || notificationId <= 0) {
            throw new NotFoundException("Notification not found");
        }

        boolean updated = notificationDAO.markRead(notificationId, userId);
        if (!updated) {
            throw new NotFoundException("Notification not found");
        }
    }

    /**
     * Marks all unread notifications for the user as read.
     *
     * @param userId the authenticated user's ID
     * @return number of rows updated
     * @throws SQLException if a database access error occurs
     */
    public int markAllRead(Long userId) throws SQLException {
        return notificationDAO.markAllRead(userId);
    }
}
