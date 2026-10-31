package com.campusfind.services;

import com.campusfind.dao.ConversationDAO;
import com.campusfind.dao.MessageDAO;
import com.campusfind.exceptions.ForbiddenException;
import com.campusfind.exceptions.NotFoundException;
import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.Conversation;
import com.campusfind.models.Message;
import com.campusfind.models.Notification;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service managing messages within conversations, including sending, paginated retrieval,
 * marking as read, and recipient notification dispatch.
 */
public class MessageService {

    public static final int DEFAULT_PAGE = 1;
    public static final int DEFAULT_LIMIT = 20;
    public static final int MAX_LIMIT = 50;
    public static final int MAX_TEXT_LENGTH = 2000;

    private final MessageDAO messageDAO;
    private final ConversationDAO conversationDAO;
    private final NotificationService notificationService;

    public MessageService() {
        this(new MessageDAO(), new ConversationDAO(), new NotificationService());
    }

    public MessageService(MessageDAO messageDAO, ConversationDAO conversationDAO, NotificationService notificationService) {
        this.messageDAO = messageDAO;
        this.conversationDAO = conversationDAO;
        this.notificationService = notificationService;
    }

    public static class PagedMessages {
        private final List<Message> messages;
        private final int page;
        private final int limit;
        private final int total;
        private final int totalPages;

        public PagedMessages(List<Message> messages, int page, int limit, int total, int totalPages) {
            this.messages = messages;
            this.page = page;
            this.limit = limit;
            this.total = total;
            this.totalPages = totalPages;
        }

        public List<Message> getMessages() {
            return messages;
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

    private Conversation getVerifiedConversation(Long conversationId, Long callerId) throws SQLException {
        if (conversationId == null || conversationId <= 0) {
            throw new ValidationException("Invalid conversation id", "id");
        }
        Conversation conv = conversationDAO.findById(conversationId)
                .orElseThrow(() -> new NotFoundException("Conversation not found"));

        if (!callerId.equals(conv.getUserAId()) && !callerId.equals(conv.getUserBId())) {
            throw new ForbiddenException("You are not a participant in this conversation");
        }
        return conv;
    }

    /**
     * Sends a message into a conversation.
     * Enforces caller participation and message length limits.
     * Triggers a NEW_MESSAGE notification to the OTHER participant only.
     */
    public Message sendMessage(Long conversationId, Long callerId, String rawText) throws SQLException {
        Conversation conv = getVerifiedConversation(conversationId, callerId);

        if (rawText == null || rawText.trim().isEmpty()) {
            throw new ValidationException("Message text cannot be empty", "text");
        }
        String text = rawText.trim();
        if (text.length() > MAX_TEXT_LENGTH) {
            throw new ValidationException("Message text cannot exceed " + MAX_TEXT_LENGTH + " characters", "text");
        }

        Message msg = new Message();
        msg.setConversationId(conversationId);
        msg.setSenderId(callerId);
        msg.setText(text);
        msg.setRead(false);

        Message saved = messageDAO.insert(msg);

        // Notify recipient (other participant)
        long recipientId = callerId.equals(conv.getUserAId()) ? conv.getUserBId() : conv.getUserAId();
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("conversationId", conversationId);
            payload.put("messageId", saved.getId());
            notificationService.notifyUser(recipientId, Notification.TYPE_NEW_MESSAGE, payload);
        } catch (Exception e) {
            // Notification dispatch must never fail message sending
            System.err.println("MessageService.sendMessage: Failed to send NEW_MESSAGE notification: " + e.getMessage());
        }

        return saved;
    }

    /**
     * Retrieves messages for a conversation in ASCENDING order (oldest first).
     * Paginates safely with page clamping and integer overflow protection.
     */
    public PagedMessages getMessages(Long conversationId, Long callerId, Integer page, Integer limit) throws SQLException {
        getVerifiedConversation(conversationId, callerId);

        int actualPage = (page == null || page < 1) ? DEFAULT_PAGE : page;
        int actualLimit = (limit == null || limit < 1) ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);

        int total = messageDAO.countByConversation(conversationId);
        int totalPages = (total == 0) ? 0 : (int) Math.ceil((double) total / (double) actualLimit);

        int effectiveQueryPage = actualPage;
        if (totalPages > 0 && effectiveQueryPage > totalPages) {
            effectiveQueryPage = totalPages;
        }

        List<Message> list = messageDAO.findByConversation(conversationId, effectiveQueryPage, actualLimit);
        return new PagedMessages(list, actualPage, actualLimit, total, totalPages);
    }

    /**
     * Marks all unread messages sent by the counterpart in the conversation as read.
     *
     * @return the number of messages updated
     */
    public int markConversationRead(Long conversationId, Long callerId) throws SQLException {
        getVerifiedConversation(conversationId, callerId);
        return messageDAO.markMessagesRead(conversationId, callerId);
    }
}

