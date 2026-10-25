package com.campusfind.dao;

import com.campusfind.models.User;
import com.campusfind.utils.DBConnectionUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for Admin dashboard and moderation operations.
 * Executes conditional aggregation queries for stats and paginated user lookups.
 */
public class AdminDAO {

    /**
     * DTO representing platform-wide statistics across all entities.
     */
    public static class AdminStats {
        // users
        public int usersTotal;
        public int usersStudents;
        public int usersAdmins;
        public int usersSuspended;

        // items
        public int itemsTotal;
        public int itemsActive;
        public int itemsResolved;
        public int itemsRemoved;
        public int itemsLost;
        public int itemsFound;

        // claims
        public int claimsTotal;
        public int claimsPending;
        public int claimsApproved;
        public int claimsRejected;

        // matches
        public int matchesTotal;

        // notifications
        public int notificationsUnread;
    }

    /**
     * Executes conditional aggregation queries to compute system-wide platform statistics.
     * Uses COALESCE(..., 0) so empty tables return 0 rather than NULL.
     *
     * @return populated AdminStats entity
     * @throws SQLException if a database access error occurs
     */
    public AdminStats getStats() throws SQLException {
        AdminStats stats = new AdminStats();

        String usersSql = "SELECT "
                + "COUNT(*) AS total, "
                + "COALESCE(SUM(CASE WHEN role = 'STUDENT' THEN 1 ELSE 0 END), 0) AS students, "
                + "COALESCE(SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END), 0) AS admins, "
                + "COALESCE(SUM(CASE WHEN is_suspended = 1 THEN 1 ELSE 0 END), 0) AS suspended "
                + "FROM users";

        String itemsSql = "SELECT "
                + "COUNT(*) AS total, "
                + "COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END), 0) AS active, "
                + "COALESCE(SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END), 0) AS resolved, "
                + "COALESCE(SUM(CASE WHEN status = 'REMOVED' THEN 1 ELSE 0 END), 0) AS removed, "
                + "COALESCE(SUM(CASE WHEN type = 'LOST' THEN 1 ELSE 0 END), 0) AS lost, "
                + "COALESCE(SUM(CASE WHEN type = 'FOUND' THEN 1 ELSE 0 END), 0) AS found "
                + "FROM items";

        String claimsSql = "SELECT "
                + "COUNT(*) AS total, "
                + "COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pending, "
                + "COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END), 0) AS approved, "
                + "COALESCE(SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END), 0) AS rejected "
                + "FROM claims";

        String matchesSql = "SELECT COUNT(*) AS total FROM matches";

        String notificationsSql = "SELECT COALESCE(SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END), 0) AS unread FROM notifications";

        try (Connection conn = DBConnectionUtil.getConnection()) {
            try (PreparedStatement stmt = conn.prepareStatement(usersSql);
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    stats.usersTotal = rs.getInt("total");
                    stats.usersStudents = rs.getInt("students");
                    stats.usersAdmins = rs.getInt("admins");
                    stats.usersSuspended = rs.getInt("suspended");
                }
            }

            try (PreparedStatement stmt = conn.prepareStatement(itemsSql);
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    stats.itemsTotal = rs.getInt("total");
                    stats.itemsActive = rs.getInt("active");
                    stats.itemsResolved = rs.getInt("resolved");
                    stats.itemsRemoved = rs.getInt("removed");
                    stats.itemsLost = rs.getInt("lost");
                    stats.itemsFound = rs.getInt("found");
                }
            }

            try (PreparedStatement stmt = conn.prepareStatement(claimsSql);
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    stats.claimsTotal = rs.getInt("total");
                    stats.claimsPending = rs.getInt("pending");
                    stats.claimsApproved = rs.getInt("approved");
                    stats.claimsRejected = rs.getInt("rejected");
                }
            }

            try (PreparedStatement stmt = conn.prepareStatement(matchesSql);
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    stats.matchesTotal = rs.getInt("total");
                }
            }

            try (PreparedStatement stmt = conn.prepareStatement(notificationsSql);
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    stats.notificationsUnread = rs.getInt("unread");
                }
            }
        }

        return stats;
    }

    /**
     * Escapes LIKE wildcards (backslash, %, _) so they match literal characters.
     *
     * @param input the raw query string
     * @return string with wildcards escaped
     */
    public static String escapeLike(String input) {
        if (input == null) {
            return null;
        }
        return input.replace("\\", "\\\\")
                    .replace("%", "\\%")
                    .replace("_", "\\_");
    }

    /**
     * Queries users with optional keyword search across name or email,
     * ordered by created_at DESC, id DESC with pagination.
     * Note: Explicit columns selected; password_hash is strictly never selected.
     *
     * @param q     optional trimmed search keyword
     * @param page  1-based page number
     * @param limit page size
     * @return list of matching User objects
     * @throws SQLException if a database access error occurs
     */
    public List<User> findUsers(String q, int page, int limit) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT id, name, email, role, is_suspended, created_at FROM users "
        );
        boolean hasFilter = (q != null && !q.trim().isEmpty());
        if (hasFilter) {
            sql.append("WHERE (name LIKE ? OR email LIKE ?) ");
        }
        sql.append("ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?");

        List<User> list = new ArrayList<>();
        long offsetLong = ((long) page - 1) * (long) limit;
        if (offsetLong < 0) {
            offsetLong = 0;
        }
        long maxOffset = 100_000_000L;
        if (offsetLong > maxOffset) {
            offsetLong = maxOffset;
        }
        int offset = (int) offsetLong;

        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            int paramIndex = 1;
            if (hasFilter) {
                String pattern = "%" + escapeLike(q.trim()) + "%";
                stmt.setString(paramIndex++, pattern);
                stmt.setString(paramIndex++, pattern);
            }
            stmt.setInt(paramIndex++, limit);
            stmt.setInt(paramIndex++, offset);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Timestamp ts = rs.getTimestamp("created_at");
                    LocalDateTime createdAt = (ts != null) ? ts.toLocalDateTime() : null;
                    User u = new User(
                            rs.getLong("id"),
                            rs.getString("name"),
                            rs.getString("email"),
                            null, // password_hash never selected or loaded
                            rs.getString("role"),
                            rs.getBoolean("is_suspended"),
                            createdAt
                    );
                    list.add(u);
                }
            }
        }
        return list;
    }

    /**
     * Counts users matching the optional keyword search query.
     *
     * @param q optional trimmed search keyword
     * @return total count of matching user rows
     * @throws SQLException if a database access error occurs
     */
    public int countUsers(String q) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) AS total FROM users ");
        boolean hasFilter = (q != null && !q.trim().isEmpty());
        if (hasFilter) {
            sql.append("WHERE (name LIKE ? OR email LIKE ?) ");
        }

        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            if (hasFilter) {
                String pattern = "%" + escapeLike(q.trim()) + "%";
                stmt.setString(1, pattern);
                stmt.setString(2, pattern);
            }
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("total");
                }
            }
        }
        return 0;
    }

    /**
     * Updates the suspension status of a user.
     *
     * @param userId      the primary key ID of the user
     * @param isSuspended true to suspend, false to unsuspend
     * @throws SQLException if a database access error occurs
     */
    public void updateUserSuspended(Long userId, boolean isSuspended) throws SQLException {
        String sql = "UPDATE users SET is_suspended = ? WHERE id = ?";
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, isSuspended ? 1 : 0);
            stmt.setLong(2, userId);
            stmt.executeUpdate();
        }
    }

    /**
     * Counts the number of active, non-suspended users with the ADMIN role.
     * Used for the "last admin" safeguard.
     *
     * @return number of active admins
     * @throws SQLException if a database access error occurs
     */
    public int countActiveAdmins() throws SQLException {
        String sql = "SELECT COUNT(*) AS total FROM users WHERE role = 'ADMIN' AND is_suspended = 0";
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                return rs.getInt("total");
            }
        }
        return 0;
    }

    /**
     * Checks if an item has any claim that was APPROVED.
     * Used to verify whether a REMOVED item was previously in a RESOLVED state.
     *
     * @param itemId the primary key ID of the item
     * @return true if an approved claim exists for this item
     * @throws SQLException if a database access error occurs
     */
    public boolean hasApprovedClaim(Long itemId) throws SQLException {
        String sql = "SELECT COUNT(*) AS total FROM claims WHERE item_id = ? AND status = 'APPROVED'";
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, itemId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("total") > 0;
                }
            }
        }
        return false;
    }
}
