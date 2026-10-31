package com.campusfind.services;

import com.campusfind.dao.ConversationDAO;
import com.campusfind.dao.ItemDAO;
import com.campusfind.dao.UserDAO;
import com.campusfind.exceptions.NotFoundException;
import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.Conversation;
import com.campusfind.models.User;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

/**
 * Service handling conversation creation, lookups, and listing.
 */
public class ConversationService {

    private final ConversationDAO conversationDAO;
    private final UserDAO userDAO;
    private final ItemDAO itemDAO;

    public ConversationService() {
        this(new ConversationDAO(), new UserDAO(), new ItemDAO());
    }

    public ConversationService(ConversationDAO conversationDAO, UserDAO userDAO, ItemDAO itemDAO) {
        this.conversationDAO = conversationDAO;
        this.userDAO = userDAO;
        this.itemDAO = itemDAO;
    }

    /**
     * Result of starting or retrieving a conversation.
     * Indicates whether the conversation was newly created (true -> 201) or existed previously (false -> 200).
     */
    public static class StartConversationResult {
        private final Conversation conversation;
        private final User otherUser;
        private final boolean newlyCreated;

        public StartConversationResult(Conversation conversation, User otherUser, boolean newlyCreated) {
            this.conversation = conversation;
            this.otherUser = otherUser;
            this.newlyCreated = newlyCreated;
        }

        public Conversation getConversation() {
            return conversation;
        }

        public User getOtherUser() {
            return otherUser;
        }

        public boolean isNewlyCreated() {
            return newlyCreated;
        }
    }

    /**
     * Starts a new conversation or retrieves an existing one with identical canonical participants and itemId.
     *
     * @param callerId    the active user's ID
     * @param otherUserId the other participant's ID
     * @param itemId      optional item ID (or null)
     * @return StartConversationResult containing the conversation, other user profile, and creation status
     * @throws ValidationException if IDs are invalid or callerId == otherUserId
     * @throws NotFoundException   if otherUser or item does not exist
     * @throws SQLException        if a database error occurs
     */
    public StartConversationResult getOrCreateConversation(Long callerId, Long otherUserId, Long itemId) throws SQLException {
        if (otherUserId == null || otherUserId <= 0) {
            throw new ValidationException("otherUserId must be a positive integer", "otherUserId");
        }
        if (otherUserId.equals(callerId)) {
            throw new ValidationException("Cannot start conversation with yourself", "otherUserId");
        }

        // Verify other user exists
        User otherUser = userDAO.findById(otherUserId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // If itemId is provided, verify it is positive and item exists
        if (itemId != null) {
            if (itemId <= 0) {
                throw new ValidationException("itemId must be a positive integer", "itemId");
            }
            itemDAO.findById(itemId)
                    .orElseThrow(() -> new NotFoundException("Item not found"));
        }

        // Canonical ordering
        long userAId = Math.min(callerId, otherUserId);
        long userBId = Math.max(callerId, otherUserId);

        Optional<Conversation> existing = conversationDAO.findByCanonicalPairAndItem(userAId, userBId, itemId);
        if (existing.isPresent()) {
            return new StartConversationResult(existing.get(), otherUser, false);
        }

        // Create new conversation
        Conversation conv = new Conversation();
        conv.setItemId(itemId);
        conv.setUserAId(userAId);
        conv.setUserBId(userBId);
        Conversation created = conversationDAO.insert(conv);

        return new StartConversationResult(created, otherUser, true);
    }

    /**
     * Retrieves all conversation summaries for a user, ordered by most recent activity.
     */
    public List<ConversationDAO.ConversationSummary> getConversationsForUser(Long userId) throws SQLException {
        return conversationDAO.findSummariesForUser(userId);
    }

    /**
     * Retrieves a conversation by ID.
     */
    public Conversation getConversationById(Long conversationId) throws SQLException {
        if (conversationId == null || conversationId <= 0) {
            throw new ValidationException("Invalid conversation id", "id");
        }
        return conversationDAO.findById(conversationId)
                .orElseThrow(() -> new NotFoundException("Conversation not found"));
    }
}

