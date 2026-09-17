package com.campusfind.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Plain Java domain model representing an automated match between a lost item
 * and a found item in CampusFind.
 * Corresponds to the `matches` database table.
 */
public class Match {

    public static final String STATUS_SUGGESTED = "SUGGESTED";
    public static final String STATUS_DISMISSED = "DISMISSED";
    public static final String STATUS_CONFIRMED = "CONFIRMED";

    private Long id;
    private Long lostItemId;
    private Long foundItemId;
    private BigDecimal score;
    private BigDecimal imageScore;
    private BigDecimal categoryScore;
    private BigDecimal colorScore;
    private BigDecimal brandScore;
    private BigDecimal textScore;
    private BigDecimal locationScore;
    private BigDecimal dateScore;
    private String status;
    private LocalDateTime createdAt;

    /**
     * Default no-argument constructor.
     */
    public Match() {
    }

    /**
     * All-arguments constructor.
     */
    public Match(Long id, Long lostItemId, Long foundItemId, BigDecimal score,
                 BigDecimal imageScore, BigDecimal categoryScore, BigDecimal colorScore,
                 BigDecimal brandScore, BigDecimal textScore, BigDecimal locationScore,
                 BigDecimal dateScore, String status, LocalDateTime createdAt) {
        this.id = id;
        this.lostItemId = lostItemId;
        this.foundItemId = foundItemId;
        this.score = score;
        this.imageScore = imageScore;
        this.categoryScore = categoryScore;
        this.colorScore = colorScore;
        this.brandScore = brandScore;
        this.textScore = textScore;
        this.locationScore = locationScore;
        this.dateScore = dateScore;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getLostItemId() {
        return lostItemId;
    }

    public void setLostItemId(Long lostItemId) {
        this.lostItemId = lostItemId;
    }

    public Long getFoundItemId() {
        return foundItemId;
    }

    public void setFoundItemId(Long foundItemId) {
        this.foundItemId = foundItemId;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }

    public BigDecimal getImageScore() {
        return imageScore;
    }

    public void setImageScore(BigDecimal imageScore) {
        this.imageScore = imageScore;
    }

    public BigDecimal getCategoryScore() {
        return categoryScore;
    }

    public void setCategoryScore(BigDecimal categoryScore) {
        this.categoryScore = categoryScore;
    }

    public BigDecimal getColorScore() {
        return colorScore;
    }

    public void setColorScore(BigDecimal colorScore) {
        this.colorScore = colorScore;
    }

    public BigDecimal getBrandScore() {
        return brandScore;
    }

    public void setBrandScore(BigDecimal brandScore) {
        this.brandScore = brandScore;
    }

    public BigDecimal getTextScore() {
        return textScore;
    }

    public void setTextScore(BigDecimal textScore) {
        this.textScore = textScore;
    }

    public BigDecimal getLocationScore() {
        return locationScore;
    }

    public void setLocationScore(BigDecimal locationScore) {
        this.locationScore = locationScore;
    }

    public BigDecimal getDateScore() {
        return dateScore;
    }

    public void setDateScore(BigDecimal dateScore) {
        this.dateScore = dateScore;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
