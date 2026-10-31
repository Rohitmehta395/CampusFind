package com.campusfind.dao;

import com.campusfind.models.Conversation;
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
 * Data Access Object for Conversation entities.
 * Interacts with the `conversations` table using plain JDBC and PreparedStatements.
 */
public class ConversationDAO {

    /**
     * DTO representing a conversation item in the caller's conversations list,
     * including other participant details, last message details, and unread count.
     */
    public static class ConversationSummary {
        private final Long id;
        private final Long itemId;
        private final LocalDateTime createdAt;

        private final Long otherUserId;
        private final String otherUserName;
        private final String otherUserEmail;

        private final String lastMessageText;
        private final Long lastMessageSenderId;
        private final LocalDateTime lastMessageCreatedAt;

        private final int unreadCount;

        public ConversationSummary(Long id, Long itemId, LocalDateTime createdAt,
                                   Long otherUserId, String otherUserName, String otherUserEmail,
                                   String lastMessageText, Long lastMessageSenderId, LocalDateTime lastMessageCreatedAt,
                                   int unreadCount) {
            this.id = id;
            this.itemId = itemId;
            this.createdAt = createdAt;
            this.otherUserId = otherUserId;
            this.otherUserName = otherUserName;
            this.otherUserEmail = otherUserEmail;
            this.lastMessageText = lastMessageText;
            this.lastMessageSenderId = lastMessageSenderId;
            this.lastMessageCreatedAt = lastMessageCreatedAt;
            this.unreadCount = unreadCount;
        }

        public Long getId() {
            return id;
        }

        public Long getItemId() {
            return itemId;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public Long getOtherUserId() {
            return otherUserId;
        }

        public String getOtherUserName() {
            return otherUserName;
        }

        public String getOtherUserEmail() {
            return otherUserEmail;
        }

        public String getLastMessageText() {
            return lastMessageText;
        }

        public Long getLastMessageSenderId() {
            return lastMessageSenderId;
        }

        public LocalDateTime getLastMessageCreatedAt() {
            return lastMessageCreatedAt;
        }

        public int getUnreadCount() {
            return unreadCount;
        }
    }

    private Conversation mapRow(ResultSet rs) throws SQLException {
        Timestamp ts = rs.getTimestamp("created_at");
        LocalDateTime createdAt = (ts != null) ? ts.toLocalDateTime() : null;
        long rawItemId = rs.getLong("item_id");
        Long itemId = rs.wasNull() ? null : rawItemId;

        return new Conversation(
                rs.getLong("id"),
                itemId,
                rs.getLong("user_a_id"),
                rs.getLong("user_b_id"),
                createdAt
        );
    }

    public Optional<Conversation> findById(Long id) throws SQLException {
        String sql = "SELECT id, item_id, user_a_id, user_b_id, created_at FROM conversations WHERE id = ?";
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

    public Optional<Conversation> findByCanonicalPairAndItem(long userAId, long userBId, Long itemId) throws SQLException {
        String sql;
        if (itemId == null) {
            sql = "SELECT id, item_id, user_a_id, user_b_id, created_at FROM conversations "
                + "WHERE user_a_id = ? AND user_b_id = ? AND item_id IS NULL";
        } else {
            sql = "SELECT id, item_id, user_a_id, user_b_id, created_at FROM conversations "
                + "WHERE user_a_id = ? AND user_b_id = ? AND item_id = ?";
        }

        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userAId);
            stmt.setLong(2, userBId);
            if (itemId != null) {
                stmt.setLong(3, itemId);
            }
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        }
        return Optional.empty();
    }

    public Conversation insert(Conversation conversation) throws SQLException {
        String sql = "INSERT INTO conversations (item_id, user_a_id, user_b_id) VALUES (?, ?, ?)";
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            if (conversation.getItemId() != null) {
                stmt.setLong(1, conversation.getItemId());
            } else {
                stmt.setNull(1, java.sql.Types.BIGINT);
            }
            stmt.setLong(2, conversation.getUserAId());
            stmt.setLong(3, conversation.getUserBId());
            stmt.executeUpdate();

            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    conversation.setId(keys.getLong(1));
                }
            }
        }

        if (conversation.getId() != null) {
            findById(conversation.getId()).ifPresent(fresh -> conversation.setCreatedAt(fresh.getCreatedAt()));
        }
        return conversation;
    }

    public List<ConversationSummary> findSummariesForUser(long userId) throws SQLException {
        String sql =
            "SELECT "
            + "    c.id AS conv_id, "
            + "    c.item_id AS conv_item_id, "
            + "    c.created_at AS conv_created_at, "
            + "    u.id AS other_user_id, "
            + "    u.name AS other_user_name, "
            + "    u.email AS other_user_email, "
            + "    lm.text AS last_msg_text, "
            + "    lm.sender_id AS last_msg_sender_id, "
            + "    lm.created_at AS last_msg_created_at, "
            + "    COALESCE(unr.unread_cnt, 0) AS unread_count "
            + "FROM conversations c "
            + "JOIN users u ON u.id = CASE WHEN c.user_a_id = ? THEN c.user_b_id ELSE c.user_a_id END "
            + "LEFT JOIN ( "
            + "    SELECT m1.conversation_id, m1.text, m1.sender_id, m1.created_at "
            + "    FROM messages m1 "
            + "    JOIN ( "
            + "        SELECT conversation_id, MAX(id) AS max_id "
            + "        FROM messages "
            + "        GROUP BY conversation_id "
            + "    ) m2 ON m1.id = m2.max_id "
            + ") lm ON lm.conversation_id = c.id "
            + "LEFT JOIN ( "
            + "    SELECT conversation_id, COUNT(*) AS unread_cnt "
            + "    FROM messages "
            + "    WHERE sender_id != ? AND is_read = 0 "
            + "    GROUP BY conversation_id "
            + ") unr ON unr.conversation_id = c.id "
            + "WHERE c.user_a_id = ? OR c.user_b_id = ? "
            + "ORDER BY "
            + "    CASE WHEN lm.created_at IS NOT NULL THEN 0 ELSE 1 END ASC, "
            + "    lm.created_at DESC, "
            + "    c.created_at DESC, "
            + "    c.id DESC";

        List<ConversationSummary> list = new ArrayList<>();
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setLong(2, userId);
            stmt.setLong(3, userId);
            stmt.setLong(4, userId);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    long convId = rs.getLong("conv_id");
                    long rawItemId = rs.getLong("conv_item_id");
                    Long convItemId = rs.wasNull() ? null : rawItemId;

                    Timestamp convCreatedTs = rs.getTimestamp("conv_created_at");
                    LocalDateTime convCreatedAt = (convCreatedTs != null) ? convCreatedTs.toLocalDateTime() : null;

                    long otherUserId = rs.getLong("other_user_id");
                    String otherUserName = rs.getString("other_user_name");
                    String otherUserEmail = rs.getString("other_user_email");

                    String lastMsgText = rs.getString("last_msg_text");
                    long rawSenderId = rs.getLong("last_msg_sender_id");
                    Long lastMsgSenderId = rs.wasNull() ? null : rawSenderId;

                    Timestamp lastMsgCreatedTs = rs.getTimestamp("last_msg_created_at");
                    LocalDateTime lastMsgCreatedAt = (lastMsgCreatedTs != null) ? lastMsgCreatedTs.toLocalDateTime() : null;

                    int unreadCount = rs.getInt("unread_count");

                    list.add(new ConversationSummary(
                            convId,
                            convItemId,
                            convCreatedAt,
                            otherUserId,
                            otherUserName,
                            otherUserEmail,
                            lastMsgText,
                            lastMsgSenderId,
                            lastMsgCreatedAt,
                            unreadCount
                    ));
                }
            }
        }
        return list;
    }
}

