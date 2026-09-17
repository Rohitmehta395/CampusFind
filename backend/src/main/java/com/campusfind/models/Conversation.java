package com.campusfind.models;

import java.time.LocalDateTime;

/**
 * Plain Java domain model representing a direct conversation between two users in CampusFind.
 * Corresponds to the `conversations` database table.
 */
public class Conversation {

    private Long id;
    private Long itemId;
    private Long userAId;
    private Long userBId;
    private LocalDateTime createdAt;

    /**
     * Default no-argument constructor.
     */
    public Conversation() {
    }

    /**
     * All-arguments constructor.
     */
    public Conversation(Long id, Long itemId, Long userAId, Long userBId, LocalDateTime createdAt) {
        this.id = id;
        this.itemId = itemId;
        this.userAId = userAId;
        this.userBId = userBId;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public Long getUserAId() {
        return userAId;
    }

    public void setUserAId(Long userAId) {
        this.userAId = userAId;
    }

    public Long getUserBId() {
        return userBId;
    }

    public void setUserBId(Long userBId) {
        this.userBId = userBId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
