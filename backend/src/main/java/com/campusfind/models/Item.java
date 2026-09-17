package com.campusfind.models;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Plain Java domain model representing a lost or found item report in CampusFind.
 * Corresponds to the `items` database table.
 */
public class Item {

    public static final String TYPE_LOST = "LOST";
    public static final String TYPE_FOUND = "FOUND";

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_RESOLVED = "RESOLVED";
    public static final String STATUS_REMOVED = "REMOVED";

    private Long id;
    private Long reporterId;
    private String type;
    private String title;
    private String category;
    private String color;
    private String brand;
    private String description;
    private String imageUrl;
    private String locationText;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private LocalDate eventDate;
    private String status;
    private LocalDateTime createdAt;

    /**
     * Default no-argument constructor.
     */
    public Item() {
    }

    /**
     * All-arguments constructor.
     */
    public Item(Long id, Long reporterId, String type, String title, String category,
                String color, String brand, String description, String imageUrl,
                String locationText, BigDecimal latitude, BigDecimal longitude,
                LocalDate eventDate, String status, LocalDateTime createdAt) {
        this.id = id;
        this.reporterId = reporterId;
        this.type = type;
        this.title = title;
        this.category = category;
        this.color = color;
        this.brand = brand;
        this.description = description;
        this.imageUrl = imageUrl;
        this.locationText = locationText;
        this.latitude = latitude;
        this.longitude = longitude;
        this.eventDate = eventDate;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getReporterId() {
        return reporterId;
    }

    public void setReporterId(Long reporterId) {
        this.reporterId = reporterId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getLocationText() {
        return locationText;
    }

    public void setLocationText(String locationText) {
        this.locationText = locationText;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
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
