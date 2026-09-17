package com.campusfind.models;

import java.time.LocalDateTime;

/**
 * Plain Java domain model representing an ownership claim on an item in CampusFind.
 * Corresponds to the `claims` database table.
 */
public class Claim {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";

    private Long id;
    private Long itemId;
    private Long claimantId;
    private String evidenceText;
    private String status;
    private Long reviewedBy;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;

    /**
     * Default no-argument constructor.
     */
    public Claim() {
    }

    /**
     * All-arguments constructor.
     */
    public Claim(Long id, Long itemId, Long claimantId, String evidenceText,
                 String status, Long reviewedBy, LocalDateTime createdAt, LocalDateTime reviewedAt) {
        this.id = id;
        this.itemId = itemId;
        this.claimantId = claimantId;
        this.evidenceText = evidenceText;
        this.status = status;
        this.reviewedBy = reviewedBy;
        this.createdAt = createdAt;
        this.reviewedAt = reviewedAt;
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

    public Long getClaimantId() {
        return claimantId;
    }

    public void setClaimantId(Long claimantId) {
        this.claimantId = claimantId;
    }

    public String getEvidenceText() {
        return evidenceText;
    }

    public void setEvidenceText(String evidenceText) {
        this.evidenceText = evidenceText;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(Long reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }
}
