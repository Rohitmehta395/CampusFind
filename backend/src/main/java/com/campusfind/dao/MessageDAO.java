package com.campusfind.dao;

import com.campusfind.models.Message;
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
 * Data Access Object for Message entities.
 * Interacts with the `messages` table using plain JDBC and PreparedStatements.
 */
public class MessageDAO {

    private Message mapRow(ResultSet rs) throws SQLException {
        Timestamp ts = rs.getTimestamp("created_at");
        LocalDateTime createdAt = (ts != null) ? ts.toLocalDateTime() : null;

        return new Message(
                rs.getLong("id"),
                rs.getLong("conversation_id"),
                rs.getLong("sender_id"),
                rs.getString("text"),
                rs.getBoolean("is_read"),
                createdAt
        );
    }

    public Message insert(Message message) throws SQLException {
        String sql = "INSERT INTO messages (conversation_id, sender_id, text, is_read) VALUES (?, ?, ?, ?)";
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, message.getConversationId());
            stmt.setLong(2, message.getSenderId());
            stmt.setString(3, message.getText());
            stmt.setBoolean(4, message.isRead());
            stmt.executeUpdate();

            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    message.setId(keys.getLong(1));
                }
            }
        }

        if (message.getId() != null) {
            findById(message.getId()).ifPresent(fresh -> message.setCreatedAt(fresh.getCreatedAt()));
        }
        return message;
    }

    public Optional<Message> findById(Long id) throws SQLException {
        String sql = "SELECT id, conversation_id, sender_id, text, is_read, created_at FROM messages WHERE id = ?";
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

    public int countByConversation(long conversationId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM messages WHERE conversation_id = ?";
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, conversationId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        }
        return 0;
    }

    /**
     * Finds messages for a conversation ordered by created_at ASC (oldest first - chat-log order),
     * with id ASC as tie-breaker.
     * Uses safe long arithmetic and clamping on offset to prevent 32-bit integer overflow.
     */
    public List<Message> findByConversation(long conversationId, int page, int limit) throws SQLException {
        String sql = "SELECT id, conversation_id, sender_id, text, is_read, created_at FROM messages "
                   + "WHERE conversation_id = ? "
                   + "ORDER BY created_at ASC, id ASC "
                   + "LIMIT ? OFFSET ?";

        List<Message> list = new ArrayList<>();
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
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, conversationId);
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
     * Marks all messages in conversation where sender_id != callerId and is_read = 0 as read.
     *
     * @param conversationId the conversation ID
     * @param callerId       the authenticated user reading the messages
     * @return the number of updated message rows
     */
    public int markMessagesRead(long conversationId, long callerId) throws SQLException {
        String sql = "UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ? AND is_read = 0";
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, conversationId);
            stmt.setLong(2, callerId);
            return stmt.executeUpdate();
        }
    }
}

