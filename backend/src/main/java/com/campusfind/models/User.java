package com.campusfind.models;

import java.time.LocalDateTime;

/**
 * Plain Java domain model representing a registered user in CampusFind.
 * Corresponds to the `users` database table.
 */
public class User {

    public static final String ROLE_STUDENT = "STUDENT";
    public static final String ROLE_ADMIN = "ADMIN";

    private Long id;
    private String name;
    private String email;
    private String passwordHash;
    private String role;
    private boolean isSuspended;
    private LocalDateTime createdAt;

    /**
     * Default no-argument constructor.
     */
    public User() {
    }

    /**
     * All-arguments constructor.
     */
    public User(Long id, String name, String email, String passwordHash, String role, boolean isSuspended, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.isSuspended = isSuspended;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isSuspended() {
        return isSuspended;
    }

    public void setSuspended(boolean suspended) {
        isSuspended = suspended;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
