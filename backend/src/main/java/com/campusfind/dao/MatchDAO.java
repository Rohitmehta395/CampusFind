package com.campusfind.dao;

import com.campusfind.models.Match;
import com.campusfind.utils.DBConnectionUtil;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for Match entities.
 * Handles database operations for the `matches` table via plain JDBC and PreparedStatements.
 */
public class MatchDAO {

    /**
     * Maps a single ResultSet row to a Match domain model object.
     */
    private Match mapRow(ResultSet rs) throws SQLException {
        Timestamp ts = rs.getTimestamp("created_at");
        LocalDateTime createdAt = (ts != null) ? ts.toLocalDateTime() : null;

        return new Match(
                rs.getLong("id"),
                rs.getLong("lost_item_id"),
                rs.getLong("found_item_id"),
                rs.getBigDecimal("score"),
                rs.getBigDecimal("image_score"),
                rs.getBigDecimal("category_score"),
                rs.getBigDecimal("color_score"),
                rs.getBigDecimal("brand_score"),
                rs.getBigDecimal("text_score"),
                rs.getBigDecimal("location_score"),
                rs.getBigDecimal("date_score"),
                rs.getString("status"),
                createdAt
        );
    }

    /**
     * Inserts a new match record into the matches table.
     * Automatically retrieves and sets the generated primary key ID.
     *
     * @param match the Match entity to insert
     * @return the persisted Match entity with its generated id populated
     * @throws SQLException if a database access error occurs
     */
    public Match insert(Match match) throws SQLException {
        String sql = "INSERT INTO matches (lost_item_id, found_item_id, score, image_score, category_score, " +
                "color_score, brand_score, text_score, location_score, date_score, status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setLong(1, match.getLostItemId());
            stmt.setLong(2, match.getFoundItemId());
            stmt.setBigDecimal(3, match.getScore());
            setBigDecimalOrNull(stmt, 4, match.getImageScore());
            setBigDecimalOrNull(stmt, 5, match.getCategoryScore());
            setBigDecimalOrNull(stmt, 6, match.getColorScore());
            setBigDecimalOrNull(stmt, 7, match.getBrandScore());
            setBigDecimalOrNull(stmt, 8, match.getTextScore());
            setBigDecimalOrNull(stmt, 9, match.getLocationScore());
            setBigDecimalOrNull(stmt, 10, match.getDateScore());
            stmt.setString(11, match.getStatus() != null ? match.getStatus() : Match.STATUS_SUGGESTED);

            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    match.setId(rs.getLong(1));
                }
            }
        }
        return match;
    }

    /**
     * Checks if a match row already exists for a specific lost and found item pair.
     * Used to prevent duplicate insert attempts on the uq_matches_lost_found unique constraint.
     *
     * @param lostItemId  the ID of the lost item
     * @param foundItemId the ID of the found item
     * @return true if a match row exists for this exact pair, false otherwise
     * @throws SQLException if a database access error occurs
     */
    public boolean existsForPair(Long lostItemId, Long foundItemId) throws SQLException {
        String sql = "SELECT 1 FROM matches WHERE lost_item_id = ? AND found_item_id = ? LIMIT 1";

        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, lostItemId);
            stmt.setLong(2, foundItemId);

            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    /**
     * Retrieves all matches involving a specific item (either as lost or found),
     * ordered by score descending.
     *
     * @param itemId the ID of the item to find matches for
     * @return list of matching records ordered highest-scoring first
     * @throws SQLException if a database access error occurs
     */
    public List<Match> findByItemId(Long itemId) throws SQLException {
        String sql = "SELECT id, lost_item_id, found_item_id, score, image_score, category_score, " +
                "color_score, brand_score, text_score, location_score, date_score, status, created_at " +
                "FROM matches WHERE lost_item_id = ? OR found_item_id = ? ORDER BY score DESC";

        List<Match> matches = new ArrayList<>();
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, itemId);
            stmt.setLong(2, itemId);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    matches.add(mapRow(rs));
                }
            }
        }
        return matches;
    }

    /**
     * Helper to set a BigDecimal value or SQL NULL on a PreparedStatement.
     */
    private void setBigDecimalOrNull(PreparedStatement stmt, int index, BigDecimal value) throws SQLException {
        if (value != null) {
            stmt.setBigDecimal(index, value);
        } else {
            stmt.setNull(index, Types.DECIMAL);
        }
    }
}
