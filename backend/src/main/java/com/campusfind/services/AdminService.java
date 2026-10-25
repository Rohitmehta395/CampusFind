package com.campusfind.services;

import com.campusfind.dao.AdminDAO;
import com.campusfind.dao.AdminDAO.AdminStats;
import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.User;

import java.sql.SQLException;
import java.util.List;

/**
 * Service orchestrating administrative dashboard queries, data moderation statistics,
 * and paginated user searching with input validation and clamping.
 */
public class AdminService {

    public static final int DEFAULT_LIMIT = 20;
    public static final int MAX_LIMIT = 50;
    public static final int DEFAULT_PAGE = 1;

    private final AdminDAO adminDAO;

    /**
     * DTO containing paginated user results and metadata.
     */
    public static class PagedUsers {
        private final List<User> users;
        private final int page;
        private final int limit;
        private final int total;
        private final int totalPages;

        public PagedUsers(List<User> users, int page, int limit, int total, int totalPages) {
            this.users = users;
            this.page = page;
            this.limit = limit;
            this.total = total;
            this.totalPages = totalPages;
        }

        public List<User> getUsers() {
            return users;
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

    public AdminService() {
        this(new AdminDAO());
    }

    public AdminService(AdminDAO adminDAO) {
        this.adminDAO = adminDAO;
    }

    /**
     * Retrieves aggregated system statistics across all primary entities.
     *
     * @return AdminStats entity
     * @throws SQLException if a database access error occurs
     */
    public AdminStats getStats() throws SQLException {
        return adminDAO.getStats();
    }

    /**
     * Searches and paginates users for admin management.
     * Follows the existing ItemService convention for validation and bounds:
     * - Default limit 20, max 50 (clamped).
     * - Page defaults to 1 (min 1).
     * - q trimmed; blank means no filter; > 100 characters throws ValidationException with field "q".
     * - totalPages computed as (total == 0) ? 0 : ceil(total / limit).
     *
     * @param q     optional search keyword matching name or email
     * @param page  optional 1-based page number
     * @param limit optional page size
     * @return PagedUsers containing matching users and pagination metadata
     * @throws ValidationException if q exceeds 100 characters
     * @throws SQLException        if a database access error occurs
     */
    public PagedUsers getUsers(String q, Integer page, Integer limit) throws SQLException {
        String cleanQ = (q != null) ? q.trim() : null;
        if (cleanQ != null && cleanQ.isEmpty()) {
            cleanQ = null;
        }
        if (cleanQ != null && cleanQ.length() > 100) {
            throw new ValidationException("Search query must not exceed 100 characters", "q");
        }

        // Pagination bounds: page defaults to 1 (min 1); limit defaults to 20, max 50 (clamped, matching ItemService convention)
        int actualPage = (page == null || page < 1) ? DEFAULT_PAGE : page;
        int actualLimit = (limit == null || limit < 1) ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);

        int total = adminDAO.countUsers(cleanQ);
        int totalPages = (total == 0) ? 0 : (int) Math.ceil((double) total / actualLimit);
        List<User> users = adminDAO.findUsers(cleanQ, actualPage, actualLimit);

        return new PagedUsers(users, actualPage, actualLimit, total, totalPages);
    }
}
