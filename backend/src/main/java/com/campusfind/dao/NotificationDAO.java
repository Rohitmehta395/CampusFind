package com.campusfind.dao;

import com.campusfind.models.Notification;
import com.campusfind.utils.DBConnectionUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object for Notification entities.
 * Handles database operations for the `notifications` table via plain JDBC and PreparedStatements.
 */
public class NotificationDAO {

    /**
     * Maps a single ResultSet row to a Notification domain model object.
     */
    private Notification mapRow(ResultSet rs) throws SQLException {
        Timestamp createdTs = rs.getTimestamp("created_at");
        LocalDateTime createdAt = (createdTs != null) ? createdTs.toLocalDateTime() : null;

        return new Notification(
                rs.getLong("id"),
                rs.getLong("user_id"),
                rs.getString("type"),
                rs.getString("payload"),
                rs.getBoolean("is_read"),
                createdAt
        );
    }

    /**
     * Inserts a new notification record into the notifications table.
     * Automatically retrieves and sets the generated primary key ID and populates createdAt via re-fetch.
     *
     * @param n the Notification entity to insert
     * @return the persisted Notification entity with generated id and createdAt populated
     * @throws SQLException if a database access error occurs
     */
    public Notification insert(Notification n) throws SQLException {
        String sql = "INSERT INTO notifications (user_id, type, payload, is_read) VALUES (?, ?, ?, ?)";
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setLong(1, n.getUserId());
            stmt.setString(2, n.getType());
            stmt.setString(3, n.getPayload());
            stmt.setBoolean(4, n.isRead());

            stmt.executeUpdate();

            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    n.setId(keys.getLong(1));
                }
            }
        }

        if (n.getId() != null) {
            findById(n.getId()).ifPresent(fresh -> {
                n.setCreatedAt(fresh.getCreatedAt());
            });
        }

        return n;
    }

    /**
     * Retrieves a notification by its primary key ID.
     *
     * @param id the primary key notification ID
     * @return Optional containing the Notification if found, empty Optional otherwise
     * @throws SQLException if a database access error occurs
     */
    public Optional<Notification> findById(Long id) throws SQLException {
        String sql = "SELECT id, user_id, type, payload, is_read, created_at FROM notifications WHERE id = ?";
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        }
        return Optional.empty();
    }

    /**
     * Retrieves a paginated list of notifications for a given user, ordered newest first
     * (ORDER BY created_at DESC, id DESC for deterministic tie-breaking).
     *
     * @param userId     the recipient user's ID
     * @param unreadOnly whether to filter strictly to unread notifications
     * @param page       1-based page number
     * @param limit      number of records per page
     * @return list of matching notifications
     * @throws SQLException if a database access error occurs
     */
    public List<Notification> findByUser(Long userId, boolean unreadOnly, int page, int limit) throws SQLException {
        int offset = Math.max(0, (page - 1) * limit);
        String sql = unreadOnly
                ? "SELECT id, user_id, type, payload, is_read, created_at FROM notifications WHERE user_id = ? AND is_read = FALSE ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?"
                : "SELECT id, user_id, type, payload, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?";

        List<Notification> list = new ArrayList<>();
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setInt(2, limit);
            stmt.setInt(3, offset);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    /**
     * Counts the total number of notifications for a user (optionally restricted to unread).
     *
     * @param userId     the user's ID
     * @param unreadOnly whether to count only unread notifications
     * @return total count
     * @throws SQLException if a database access error occurs
     */
    public int countByUser(Long userId, boolean unreadOnly) throws SQLException {
        String sql = unreadOnly
                ? "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = FALSE"
                : "SELECT COUNT(*) FROM notifications WHERE user_id = ?";

        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        }
        return 0;
    }

    /**
     * Counts the total number of unread notifications for a user.
     *
     * @param userId the user's ID
     * @return unread count
     * @throws SQLException if a database access error occurs
     */
    public int countUnread(Long userId) throws SQLException {
        return countByUser(userId, true);
    }

    /**
     * Marks a specific notification as read, enforcing user ownership directly in the SQL statement.
     *
     * @param id     the notification ID
     * @param userId the owner user's ID
     * @return true if a row was updated (notification existed and belonged to user), false otherwise
     * @throws SQLException if a database access error occurs
     */
    public boolean markRead(Long id, Long userId) throws SQLException {
        String sql = "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?";
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.setLong(2, userId);
            return stmt.executeUpdate() > 0;
        }
    }

    /**
     * Marks all unread notifications for a user as read.
     *
     * @param userId the owner user's ID
     * @return the number of notifications updated
     * @throws SQLException if a database access error occurs
     */
    public int markAllRead(Long userId) throws SQLException {
        String sql = "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE";
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            return stmt.executeUpdate();
        }
    }
}
