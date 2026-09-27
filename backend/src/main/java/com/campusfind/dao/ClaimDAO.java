package com.campusfind.dao;

import com.campusfind.models.Claim;
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
 * Data Access Object for Claim entities.
 * Handles database operations for the `claims` table via plain JDBC and PreparedStatements.
 */
public class ClaimDAO {

    /**
     * Maps a single ResultSet row to a Claim domain model object.
     */
    private Claim mapRow(ResultSet rs) throws SQLException {
        Timestamp createdTs = rs.getTimestamp("created_at");
        LocalDateTime createdAt = (createdTs != null) ? createdTs.toLocalDateTime() : null;

        Timestamp reviewedTs = rs.getTimestamp("reviewed_at");
        LocalDateTime reviewedAt = (reviewedTs != null) ? reviewedTs.toLocalDateTime() : null;

        long reviewedByVal = rs.getLong("reviewed_by");
        Long reviewedBy = rs.wasNull() ? null : reviewedByVal;

        return new Claim(
                rs.getLong("id"),
                rs.getLong("item_id"),
                rs.getLong("claimant_id"),
                rs.getString("evidence_text"),
                rs.getString("status"),
                reviewedBy,
                createdAt,
                reviewedAt
        );
    }

    /**
     * Retrieves a claim by its primary key ID.
     *
     * @param id the primary key claim ID
     * @return Optional containing the Claim if found, empty Optional otherwise
     * @throws SQLException if a database access error occurs
     */
    public Optional<Claim> findById(Long id) throws SQLException {
        String sql = "SELECT id, item_id, claimant_id, evidence_text, status, reviewed_by, created_at, reviewed_at FROM claims WHERE id = ?";
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
     * Inserts a new claim record into the claims table.
     * Automatically retrieves and sets the generated primary key ID and createdAt timestamp.
     *
     * @param claim the Claim entity to insert
     * @return the persisted Claim entity with generated id and createdAt populated
     * @throws SQLException if a database access error occurs
     */
    public Claim insert(Claim claim) throws SQLException {
        String sql = "INSERT INTO claims (item_id, claimant_id, evidence_text, status) VALUES (?, ?, ?, ?)";
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setLong(1, claim.getItemId());
            stmt.setLong(2, claim.getClaimantId());
            stmt.setString(3, claim.getEvidenceText());
            stmt.setString(4, claim.getStatus() != null ? claim.getStatus() : Claim.STATUS_PENDING);

            stmt.executeUpdate();

            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    claim.setId(keys.getLong(1));
                }
            }
        }

        if (claim.getId() != null) {
            findById(claim.getId()).ifPresent(fresh -> {
                claim.setCreatedAt(fresh.getCreatedAt());
                if (claim.getStatus() == null) {
                    claim.setStatus(fresh.getStatus());
                }
            });
        }

        return claim;
    }

    /**
     * Retrieves all claims associated with a given item ID, ordered newest-first.
     * Built ahead of need for Sub-phase 11B (Claim Review/Approval).
     *
     * @param itemId the ID of the item
     * @return list of Claim records
     * @throws SQLException if a database access error occurs
     */
    public List<Claim> findByItemId(Long itemId) throws SQLException {
        String sql = "SELECT id, item_id, claimant_id, evidence_text, status, reviewed_by, created_at, reviewed_at FROM claims WHERE item_id = ? ORDER BY created_at DESC, id DESC";
        List<Claim> list = new ArrayList<>();
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, itemId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }
}
