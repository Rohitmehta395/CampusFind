package com.campusfind.dao;

import com.campusfind.models.Item;
import com.campusfind.utils.DBConnectionUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object for Item entities.
 * Handles database operations for the `items` table via plain JDBC and PreparedStatements.
 */
public class ItemDAO {

    /**
     * Maps a single ResultSet row to an Item domain model object.
     */
    private Item mapRow(ResultSet rs) throws SQLException {
        Timestamp ts = rs.getTimestamp("created_at");
        LocalDateTime createdAt = (ts != null) ? ts.toLocalDateTime() : null;
        java.sql.Date eventDateSql = rs.getDate("event_date");

        return new Item(
                rs.getLong("id"),
                rs.getLong("reporter_id"),
                rs.getString("type"),
                rs.getString("title"),
                rs.getString("category"),
                rs.getString("color"),
                rs.getString("brand"),
                rs.getString("description"),
                rs.getString("image_url"),
                rs.getString("location_text"),
                rs.getBigDecimal("latitude"),
                rs.getBigDecimal("longitude"),
                eventDateSql != null ? eventDateSql.toLocalDate() : null,
                rs.getString("status"),
                createdAt
        );
    }

    /**
     * Retrieves all items from the database, ordered newest-first by created_at.
     *
     * @return list of all items ordered by created_at descending
     * @throws SQLException if a database access error occurs
     */
    public List<Item> findAll() throws SQLException {
        String sql = "SELECT id, reporter_id, type, title, category, color, brand, description, image_url, location_text, latitude, longitude, event_date, status, created_at FROM items ORDER BY created_at DESC";
        List<Item> items = new ArrayList<>();
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                items.add(mapRow(rs));
            }
        }
        return items;
    }

    /**
     * Helper holding dynamic WHERE SQL and associated parameter values.
     */
    private static class FilterQuery {
        final String whereClause;
        final List<Object> params;

        FilterQuery(String whereClause, List<Object> params) {
            this.whereClause = whereClause;
            this.params = params;
        }
    }

    /**
     * Constructs a dynamic WHERE clause and parameter list based on non-blank criteria.
     * All values use PreparedStatement placeholders, avoiding string concatenation for user inputs.
     */
    private FilterQuery buildFilterQuery(String q, String category, String type, String status) {
        List<String> conditions = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        if (q != null && !q.trim().isEmpty()) {
            conditions.add("(LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))");
            String pattern = "%" + q.trim() + "%";
            params.add(pattern);
            params.add(pattern);
        }
        if (category != null && !category.trim().isEmpty()) {
            conditions.add("category = ?");
            params.add(category.trim());
        }
        if (type != null && !type.trim().isEmpty()) {
            conditions.add("type = ?");
            params.add(type.trim());
        }
        if (status != null && !status.trim().isEmpty()) {
            conditions.add("status = ?");
            params.add(status.trim());
        }

        String where = conditions.isEmpty() ? "" : " WHERE " + String.join(" AND ", conditions);
        return new FilterQuery(where, params);
    }

    /**
     * Searches and filters items with pagination support.
     *
     * @param q        optional keyword search on title and description (case-insensitive partial match)
     * @param category optional category filter (exact match)
     * @param type     optional item type filter (LOST or FOUND)
     * @param status   optional item status filter (e.g. ACTIVE)
     * @param page     1-based page number
     * @param limit    maximum number of items to return per page
     * @return list of matching items ordered newest-first
     * @throws SQLException if a database access error occurs
     */
    public List<Item> findFiltered(String q, String category, String type, String status, int page, int limit) throws SQLException {
        FilterQuery fq = buildFilterQuery(q, category, type, status);
        String sql = "SELECT id, reporter_id, type, title, category, color, brand, description, image_url, location_text, latitude, longitude, event_date, status, created_at FROM items"
                + fq.whereClause + " ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?";

        int offset = Math.max(0, (page - 1) * limit);
        List<Item> items = new ArrayList<>();

        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            int paramIndex = 1;
            for (Object param : fq.params) {
                stmt.setObject(paramIndex++, param);
            }
            stmt.setInt(paramIndex++, limit);
            stmt.setInt(paramIndex, offset);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    items.add(mapRow(rs));
                }
            }
        }
        return items;
    }

    /**
     * Counts the total number of items matching the given search and filter parameters.
     *
     * @param q        optional keyword search on title and description
     * @param category optional category filter
     * @param type     optional item type filter
     * @param status   optional item status filter
     * @return total matching item count
     * @throws SQLException if a database access error occurs
     */
    public int countFiltered(String q, String category, String type, String status) throws SQLException {
        FilterQuery fq = buildFilterQuery(q, category, type, status);
        String sql = "SELECT COUNT(*) FROM items" + fq.whereClause;

        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            int paramIndex = 1;
            for (Object param : fq.params) {
                stmt.setObject(paramIndex++, param);
            }

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        }
        return 0;
    }

    /**
     * Retrieves all items reported by a specific user, ordered newest-first by created_at.
     *
     * @param reporterId the user's ID
     * @return list of items reported by the user ordered by created_at descending
     * @throws SQLException if a database access error occurs
     */
    public List<Item> findByReporterId(Long reporterId) throws SQLException {
        String sql = "SELECT id, reporter_id, type, title, category, color, brand, description, image_url, location_text, latitude, longitude, event_date, status, created_at FROM items WHERE reporter_id = ? ORDER BY created_at DESC";
        List<Item> items = new ArrayList<>();
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, reporterId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    items.add(mapRow(rs));
                }
            }
        }
        return items;
    }

    /**
     * Retrieves an item by its primary key ID.
     *
     * @param id the primary key ID
     * @return an Optional containing the Item if found, or empty if not
     * @throws SQLException if a database access error occurs
     */
    public Optional<Item> findById(Long id) throws SQLException {
        String sql = "SELECT id, reporter_id, type, title, category, color, brand, description, image_url, location_text, latitude, longitude, event_date, status, created_at FROM items WHERE id = ?";
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
     * Inserts a new item record into the database and populates generated ID and createdAt.
     *
     * @param item the Item domain object to insert
     * @return the Item domain object populated with generated ID and database-generated createdAt
     * @throws SQLException if a database access error occurs
     */
    public Item insert(Item item) throws SQLException {
        String sql = "INSERT INTO items (reporter_id, type, title, category, color, brand, description, image_url, location_text, latitude, longitude, event_date, status) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setLong(1, item.getReporterId());
            stmt.setString(2, item.getType());
            stmt.setString(3, item.getTitle());
            stmt.setString(4, item.getCategory());
            stmt.setString(5, item.getColor());
            stmt.setString(6, item.getBrand());
            stmt.setString(7, item.getDescription());
            stmt.setString(8, item.getImageUrl());
            stmt.setString(9, item.getLocationText());
            stmt.setBigDecimal(10, item.getLatitude());
            stmt.setBigDecimal(11, item.getLongitude());
            stmt.setDate(12, item.getEventDate() != null ? java.sql.Date.valueOf(item.getEventDate()) : null);
            stmt.setString(13, item.getStatus() != null ? item.getStatus() : Item.STATUS_ACTIVE);

            stmt.executeUpdate();

            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    item.setId(keys.getLong(1));
                }
            }
        }

        if (item.getId() != null) {
            findById(item.getId()).ifPresent(fresh -> item.setCreatedAt(fresh.getCreatedAt()));
        }

        return item;
    }

    /**
     * Finds active candidate items of the opposite type and matching category for smart matching.
     * If eventDate is non-null, candidates are pre-filtered to within [eventDate - windowDays, eventDate + windowDays]
     * (or candidates with null event_date, so missing date data on a candidate does not cause exclusion).
     * If eventDate is null on the new item, the date-window condition is skipped entirely,
     * allowing all active category-matched items to be evaluated.
     *
     * @param oppositeType 'FOUND' if new item is 'LOST', or 'LOST' if new item is 'FOUND'
     * @param category exact category string
     * @param eventDate the event date of the new item, or null if unknown
     * @param windowDays maximum day difference for pre-filtering when eventDate is present
     * @return list of active candidate items
     * @throws SQLException if a database access error occurs
     */
    public List<Item> findCandidates(String oppositeType, String category, LocalDate eventDate, int windowDays) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT id, reporter_id, type, title, category, color, brand, description, image_url, location_text, latitude, longitude, event_date, status, created_at " +
                "FROM items WHERE type = ? AND category = ? AND status = 'ACTIVE'"
        );

        if (eventDate != null) {
            sql.append(" AND (event_date BETWEEN ? AND ? OR event_date IS NULL)");
        }
        sql.append(" ORDER BY created_at DESC");

        List<Item> candidates = new ArrayList<>();
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            stmt.setString(1, oppositeType);
            stmt.setString(2, category);
            if (eventDate != null) {
                stmt.setDate(3, java.sql.Date.valueOf(eventDate.minusDays(windowDays)));
                stmt.setDate(4, java.sql.Date.valueOf(eventDate.plusDays(windowDays)));
            }

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    candidates.add(mapRow(rs));
                }
            }
        }
        return candidates;
    }
}
