package com.campusfind.services;

import com.campusfind.dao.ItemDAO;
import com.campusfind.dao.MatchDAO;
import com.campusfind.exceptions.ForbiddenException;
import com.campusfind.exceptions.NotFoundException;
import com.campusfind.exceptions.ValidationException;
import com.campusfind.matching.MatchingEngine;
import com.campusfind.models.Item;
import com.campusfind.models.Match;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Service layer handling business logic and validation for Item entities.
 */
public class ItemService {

    private final ItemDAO itemDAO;
    private final MatchDAO matchDAO;
    private final MatchingEngine matchingEngine;

    public ItemService() {
        this(new ItemDAO(), new MatchDAO(), new MatchingEngine());
    }

    public ItemService(ItemDAO itemDAO) {
        this(itemDAO, new MatchDAO(), new MatchingEngine());
    }

    public ItemService(ItemDAO itemDAO, MatchingEngine matchingEngine) {
        this(itemDAO, new MatchDAO(), matchingEngine);
    }

    public ItemService(ItemDAO itemDAO, MatchDAO matchDAO, MatchingEngine matchingEngine) {
        this.itemDAO = itemDAO;
        this.matchDAO = matchDAO;
        this.matchingEngine = matchingEngine;
    }

    /**
     * Typed container for paginated item search/filter results.
     */
    public static class PagedResult {
        private final List<Item> items;
        private final int page;
        private final int limit;
        private final int total;
        private final int totalPages;

        public PagedResult(List<Item> items, int page, int limit, int total, int totalPages) {
            this.items = items;
            this.page = page;
            this.limit = limit;
            this.total = total;
            this.totalPages = totalPages;
        }

        public List<Item> getItems() {
            return items;
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

    /**
     * Searches, filters, and paginates items with validation and defaulting.
     *
     * @param q        optional keyword search on title and description
     * @param category optional category filter (e.g. Electronics, Books)
     * @param type     optional item type filter ('LOST' or 'FOUND')
     * @param status   optional item status filter (defaults to 'ACTIVE' if omitted)
     * @param page     optional 1-based page number (defaults to 1)
     * @param limit    optional page size limit (defaults to 12, clamped to max 50)
     * @return PagedResult containing matching items and pagination metadata
     * @throws ValidationException if type or status is invalid
     * @throws SQLException        if a database access error occurs
     */
    public PagedResult getFilteredItems(String q, String category, String type, String status,
                                        Integer page, Integer limit) throws SQLException {
        // 1. Status handling: defaults to ACTIVE if omitted/blank; validate if provided
        String cleanStatus;
        if (status == null || status.trim().isEmpty()) {
            cleanStatus = Item.STATUS_ACTIVE;
        } else {
            cleanStatus = status.trim().toUpperCase();
            if (!Item.STATUS_ACTIVE.equals(cleanStatus)
                    && !Item.STATUS_RESOLVED.equals(cleanStatus)
                    && !Item.STATUS_REMOVED.equals(cleanStatus)) {
                throw new ValidationException("Invalid item status. Must be ACTIVE, RESOLVED, or REMOVED", "status");
            }
        }

        // 2. Type validation: optional, but must be LOST or FOUND if provided
        String cleanType = null;
        if (type != null && !type.trim().isEmpty()) {
            cleanType = type.trim().toUpperCase();
            if (!Item.TYPE_LOST.equals(cleanType) && !Item.TYPE_FOUND.equals(cleanType)) {
                throw new ValidationException("Invalid item type. Must be LOST or FOUND", "type");
            }
        }

        // 3. Category & Keyword trimming
        String cleanCategory = (category != null && !category.trim().isEmpty()) ? category.trim() : null;
        String cleanQ = (q != null && !q.trim().isEmpty()) ? q.trim() : null;

        // 4. Pagination bounds: page defaults to 1 (min 1); limit defaults to 12, max 50
        int actualPage = (page == null || page < 1) ? 1 : page;
        int actualLimit = (limit == null || limit < 1) ? 12 : Math.min(limit, 50);

        // 5. Query execution
        List<Item> items = itemDAO.findFiltered(cleanQ, cleanCategory, cleanType, cleanStatus, actualPage, actualLimit);
        int total = itemDAO.countFiltered(cleanQ, cleanCategory, cleanType, cleanStatus);
        int totalPages = (total == 0) ? 0 : (int) Math.ceil((double) total / actualLimit);

        return new PagedResult(items, actualPage, actualLimit, total, totalPages);
    }

    /**
     * Retrieves all items from the system ordered newest-first.
     *
     * @return list of all Item records
     * @throws SQLException if a database access error occurs
     */
    public List<Item> getAllItems() throws SQLException {
        return itemDAO.findAll();
    }

    /**
     * Retrieves all items reported by a specific user ordered newest-first.
     *
     * @param reporterId the user's primary key ID
     * @return list of Item records reported by the user
     * @throws ValidationException if reporterId is null or invalid
     * @throws SQLException        if a database access error occurs
     */
    public List<Item> getItemsByReporter(Long reporterId) throws SQLException {
        if (reporterId == null || reporterId <= 0) {
            throw new ValidationException("Invalid reporter id", "reporterId");
        }
        return itemDAO.findByReporterId(reporterId);
    }

    /**
     * Retrieves a single item by its ID.
     *
     * @param id the primary key item ID
     * @return the Item record
     * @throws ValidationException if id is null or invalid
     * @throws NotFoundException   if no item exists with the specified ID
     * @throws SQLException        if a database access error occurs
     */
    public Item getItemById(Long id) throws SQLException {
        if (id == null || id <= 0) {
            throw new ValidationException("Invalid item id", "id");
        }
        return itemDAO.findById(id)
                .orElseThrow(() -> new NotFoundException("Item not found"));
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
     * @param imageUrl     optional image URL from Cloudinary (max 500 characters)
     * @param locationText optional text description of location
     * @param eventDate    optional date when the item was lost or found
     * @return the created and persisted Item domain object
     * @throws ValidationException if required fields are missing or invalid
     * @throws SQLException        if a database access error occurs
     */
    public Item createItem(Long reporterId, String type, String title, String category,
                           String color, String brand, String description,
                           String locationText, LocalDate eventDate) throws SQLException {
        return createItem(reporterId, type, title, category, color, brand, description, null, locationText, eventDate);
    }

    /**
     * Validates input and creates a new lost or found item including optional image URL.
     */
    public Item createItem(Long reporterId, String type, String title, String category,
                           String color, String brand, String description, String imageUrl,
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

        // Validate and clean imageUrl (VARCHAR(500) limit, non-silent rejection on overflow)
        String cleanImageUrl = null;
        if (imageUrl != null && !imageUrl.trim().isEmpty()) {
            cleanImageUrl = imageUrl.trim();
            if (cleanImageUrl.length() > 500) {
                throw new ValidationException("Image URL is too long", "imageUrl");
            }
        }

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
                cleanImageUrl,
                cleanLocationText,
                null, // latitude left null for Phase 12
                null, // longitude left null for Phase 12
                eventDate,
                Item.STATUS_ACTIVE,
                null
        );

        Item createdItem = itemDAO.insert(item);

        // Synchronously run smart matching with safety boundary
        try {
            matchingEngine.processNewItem(createdItem);
        } catch (Exception e) {
            System.err.println("[ItemService] Non-fatal error during matching for item " + createdItem.getId() + ": " + e.getMessage());
        }

        return createdItem;
    }

    /**
     * View container holding a Match and the counterparty item's details.
     */
    public static class ItemMatchView {
        private final Match match;
        private final Item matchedItem;

        public ItemMatchView(Match match, Item matchedItem) {
            this.match = match;
            this.matchedItem = matchedItem;
        }

        public Match getMatch() {
            return match;
        }

        public Item getMatchedItem() {
            return matchedItem;
        }
    }

    /**
     * Retrieves all suggested matches for a specific item, restricted to the item's reporter.
     *
     * @param itemId the ID of the item
     * @param authenticatedUserId the ID of the authenticated caller
     * @return list of ItemMatchView records ordered by score descending
     * @throws ValidationException if itemId is null or invalid
     * @throws NotFoundException if the item does not exist
     * @throws ForbiddenException if the caller is not the item's reporter
     * @throws SQLException if a database access error occurs
     */
    public List<ItemMatchView> getMatchesForItem(Long itemId, Long authenticatedUserId) throws SQLException {
        if (itemId == null || itemId <= 0) {
            throw new ValidationException("Invalid item id", "id");
        }

        Item item = getItemById(itemId);
        if (!item.getReporterId().equals(authenticatedUserId)) {
            throw new ForbiddenException("You are not authorized to view matches for this item");
        }

        List<Match> matches = matchDAO.findByItemId(itemId);
        List<ItemMatchView> views = new ArrayList<>();
        for (Match match : matches) {
            Long otherItemId = match.getLostItemId().equals(itemId) ? match.getFoundItemId() : match.getLostItemId();
            Item otherItem = itemDAO.findById(otherItemId).orElse(null);
            views.add(new ItemMatchView(match, otherItem));
        }
        return views;
    }
}
