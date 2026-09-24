package com.campusfind.services;

import com.campusfind.dao.ItemDAO;
import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.Item;

import java.sql.SQLException;
import java.time.LocalDate;

/**
 * Service layer handling business logic and validation for Item entities.
 */
public class ItemService {

    private final ItemDAO itemDAO;

    public ItemService() {
        this(new ItemDAO());
    }

    public ItemService(ItemDAO itemDAO) {
        this.itemDAO = itemDAO;
    }

    /**
     * Validates input and creates a new lost or found item.
     *
     * @param reporterId   the authenticated user's ID
     * @param type         the item type ('LOST' or 'FOUND')
     * @param title        the descriptive title of the item
     * @param category     the category classification (e.g. Electronics, Books)
     * @param color        optional color description
     * @param brand        optional brand description
     * @param description  optional detailed description
     * @param locationText optional text description of location
     * @param eventDate    optional date when the item was lost or found
     * @return the created and persisted Item domain object
     * @throws ValidationException if required fields are missing or invalid
     * @throws SQLException        if a database access error occurs
     */
    public Item createItem(Long reporterId, String type, String title, String category,
                           String color, String brand, String description,
                           String locationText, LocalDate eventDate) throws SQLException {
        if (reporterId == null || reporterId <= 0) {
            throw new ValidationException("Invalid reporter id", "reporterId");
        }

        // Validate type
        if (type == null || (!Item.TYPE_LOST.equals(type) && !Item.TYPE_FOUND.equals(type))) {
            throw new ValidationException("Invalid item type. Must be LOST or FOUND", "type");
        }

        // Validate title
        if (title == null || title.trim().isEmpty()) {
            throw new ValidationException("Title is required", "title");
        }
        String cleanTitle = title.trim();
        if (cleanTitle.length() > 150) {
            throw new ValidationException("Title must not exceed 150 characters", "title");
        }

        // Validate category
        if (category == null || category.trim().isEmpty()) {
            throw new ValidationException("Category is required", "category");
        }
        String cleanCategory = category.trim();
        if (cleanCategory.length() > 50) {
            throw new ValidationException("Category must not exceed 50 characters", "category");
        }

        // Clean optional fields
        String cleanColor = (color != null && !color.trim().isEmpty()) ? color.trim() : null;
        if (cleanColor != null && cleanColor.length() > 50) {
            cleanColor = cleanColor.substring(0, 50);
        }

        String cleanBrand = (brand != null && !brand.trim().isEmpty()) ? brand.trim() : null;
        if (cleanBrand != null && cleanBrand.length() > 50) {
            cleanBrand = cleanBrand.substring(0, 50);
        }

        String cleanDescription = (description != null && !description.trim().isEmpty()) ? description.trim() : null;
        String cleanLocationText = (locationText != null && !locationText.trim().isEmpty()) ? locationText.trim() : null;
        if (cleanLocationText != null && cleanLocationText.length() > 200) {
            cleanLocationText = cleanLocationText.substring(0, 200);
        }

        Item item = new Item(
                null,
                reporterId,
                type,
                cleanTitle,
                cleanCategory,
                cleanColor,
                cleanBrand,
                cleanDescription,
                null, // imageUrl left null for Phase 7
                cleanLocationText,
                null, // latitude left null for Phase 12
                null, // longitude left null for Phase 12
                eventDate,
                Item.STATUS_ACTIVE,
                null
        );

        return itemDAO.insert(item);
    }
}
