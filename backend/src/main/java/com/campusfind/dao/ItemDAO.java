package com.campusfind.dao;

import com.campusfind.models.Item;
import com.campusfind.utils.DBConnectionUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
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
}
