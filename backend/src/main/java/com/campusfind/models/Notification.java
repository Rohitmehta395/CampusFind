package com.campusfind.models;

import java.time.LocalDateTime;

/**
 * Plain Java domain model representing a user notification in CampusFind.
 * Corresponds to the `notifications` database table.
 */
public class Notification {

    public static final String TYPE_MATCH_FOUND = "MATCH_FOUND";
    public static final String TYPE_CLAIM_SUBMITTED = "CLAIM_SUBMITTED";
    public static final String TYPE_CLAIM_APPROVED = "CLAIM_APPROVED";
    public static final String TYPE_CLAIM_REJECTED = "CLAIM_REJECTED";
    public static final String TYPE_NEW_MESSAGE = "NEW_MESSAGE";
    public static final String TYPE_ITEM_RESOLVED = "ITEM_RESOLVED";

    private Long id;
    private Long userId;
    private String type;
    private String payload;
    private boolean isRead;
    private LocalDateTime createdAt;

    /**
     * Default no-argument constructor.
     */
    public Notification() {
    }

    /**
     * All-arguments constructor.
     */
    public Notification(Long id, Long userId, String type, String payload, boolean isRead, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.payload = payload;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
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
