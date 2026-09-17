package com.campusfind.models;

import java.time.LocalDateTime;

/**
 * Plain Java domain model representing a message within a conversation in CampusFind.
 * Corresponds to the `messages` database table.
 */
public class Message {

    private Long id;
    private Long conversationId;
    private Long senderId;
    private String text;
    private boolean isRead;
    private LocalDateTime createdAt;

    /**
     * Default no-argument constructor.
     */
    public Message() {
    }

    /**
     * All-arguments constructor.
     */
    public Message(Long id, Long conversationId, Long senderId, String text, boolean isRead, LocalDateTime createdAt) {
        this.id = id;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.text = text;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
