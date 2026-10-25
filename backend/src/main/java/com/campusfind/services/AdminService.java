package com.campusfind.services;

import com.campusfind.dao.AdminDAO;
import com.campusfind.dao.AdminDAO.AdminStats;
import com.campusfind.dao.ItemDAO;
import com.campusfind.dao.UserDAO;
import com.campusfind.exceptions.ConflictException;
import com.campusfind.exceptions.NotFoundException;
import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.Claim;
import com.campusfind.models.Item;
import com.campusfind.models.User;

import java.sql.SQLException;
import java.util.Collections;
import java.util.List;

/**
 * Service orchestrating administrative dashboard queries, data moderation statistics,
 * user suspension enforcement, item moderation, and claim decision overrides.
 */
public class AdminService {

    public static final int DEFAULT_LIMIT = 20;
    public static final int MAX_LIMIT = 50;
    public static final int DEFAULT_PAGE = 1;

    private final AdminDAO adminDAO;
    private final UserDAO userDAO;
    private final ItemDAO itemDAO;
    private final ClaimService claimService;

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
        this(new AdminDAO(), new UserDAO(), new ItemDAO(), new ClaimService());
    }

    public AdminService(AdminDAO adminDAO) {
        this(adminDAO, new UserDAO(), new ItemDAO(), new ClaimService());
    }

    public AdminService(AdminDAO adminDAO, UserDAO userDAO, ItemDAO itemDAO, ClaimService claimService) {
        this.adminDAO = adminDAO;
        this.userDAO = userDAO;
        this.itemDAO = itemDAO;
        this.claimService = claimService;
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
     * Counts active, non-suspended users with the ADMIN role.
     * Helper for last-admin safeguard.
     */
    private int countActiveAdmins() throws SQLException {
        return adminDAO.countActiveAdmins();
    }

    /**
     * Suspends a user account (sets is_suspended = 1).
     * Enforces the "last active admin" safeguard (D2): if the target user is an active admin,
     * the action is rejected with 409 Conflict if suspending them would leave zero active admins.
     * Operation is idempotent: suspending an already-suspended user returns the unchanged state.
     *
     * @param targetUserId the ID of the user to suspend
     * @param actingAdminId the ID of the authenticated admin making the request
     * @return the refreshed User entity
     * @throws ValidationException if targetUserId is invalid
     * @throws NotFoundException if the target user does not exist
     * @throws ConflictException if suspending this user would leave zero active admins
     * @throws SQLException if a database access error occurs
     */
    public User suspendUser(Long targetUserId, Long actingAdminId) throws SQLException {
        if (targetUserId == null || targetUserId <= 0) {
            throw new ValidationException("Invalid user id", "id");
        }
        User target = userDAO.findById(targetUserId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (target.isSuspended()) {
            return target; // Idempotent
        }

        if (User.ROLE_ADMIN.equals(target.getRole())) {
            int activeAdmins = countActiveAdmins();
            if (activeAdmins <= 1) {
                throw new ConflictException("Cannot remove the last active admin");
            }
        }

        adminDAO.updateUserSuspended(targetUserId, true);
        return userDAO.findById(targetUserId)
                .orElseThrow(() -> new NotFoundException("User not found after update"));
    }

    /**
     * Unsuspends a user account (sets is_suspended = 0).
     * Operation is idempotent: unsuspending an already-active user returns the unchanged state.
     *
     * @param targetUserId the ID of the user to unsuspend
     * @return the refreshed User entity
     * @throws ValidationException if targetUserId is invalid
     * @throws NotFoundException if the target user does not exist
     * @throws SQLException if a database access error occurs
     */
    public User unsuspendUser(Long targetUserId) throws SQLException {
        if (targetUserId == null || targetUserId <= 0) {
            throw new ValidationException("Invalid user id", "id");
        }
        User target = userDAO.findById(targetUserId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!target.isSuspended()) {
            return target; // Idempotent
        }

        adminDAO.updateUserSuspended(targetUserId, false);
        return userDAO.findById(targetUserId)
                .orElseThrow(() -> new NotFoundException("User not found after update"));
    }

    /**
     * Moderates an item by setting its status to REMOVED or ACTIVE (RESTORE).
     * Enforces the resolved-item restore safeguard: attempting to restore an item that is
     * currently RESOLVED or was previously RESOLVED before being REMOVED is rejected with 409 Conflict.
     *
     * @param itemId the ID of the item
     * @param action "REMOVE" or "RESTORE"
     * @return the updated Item entity
     * @throws ValidationException if parameters are invalid
     * @throws NotFoundException if the item does not exist
     * @throws ConflictException if restoring a resolved item
     * @throws SQLException if a database access error occurs
     */
    public Item moderateItem(Long itemId, String action) throws SQLException {
        if (itemId == null || itemId <= 0) {
            throw new ValidationException("Invalid item id", "id");
        }
        if (action == null || action.trim().isEmpty()) {
            throw new ValidationException("Action is required", "action");
        }
        String cleanAction = action.trim();
        if (!"REMOVE".equals(cleanAction) && !"RESTORE".equals(cleanAction)) {
            throw new ValidationException("Invalid action: " + action + ". Expected REMOVE or RESTORE", "action");
        }

        Item item = itemDAO.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        if ("REMOVE".equals(cleanAction)) {
            if (Item.STATUS_REMOVED.equals(item.getStatus())) {
                return item; // Idempotent
            }
            itemDAO.updateStatus(itemId, Item.STATUS_REMOVED);
            item.setStatus(Item.STATUS_REMOVED);
            return item;
        } else {
            // RESTORE
            if (Item.STATUS_RESOLVED.equals(item.getStatus()) || adminDAO.hasApprovedClaim(itemId)) {
                throw new ConflictException("Cannot restore a resolved item");
            }
            if (Item.STATUS_ACTIVE.equals(item.getStatus())) {
                return item; // Idempotent
            }
            itemDAO.updateStatus(itemId, Item.STATUS_ACTIVE);
            item.setStatus(Item.STATUS_ACTIVE);
            return item;
        }
    }

    /**
     * Overrides a claim decision as an administrator.
     * Reuses existing ClaimService decision logic and enforces terminal state rules.
     *
     * @param claimId the ID of the claim
     * @param adminId the authenticated admin's ID
     * @param decision "APPROVED" or "REJECTED"
     * @return the updated Claim entity
     * @throws ValidationException if parameters are invalid
     * @throws NotFoundException if the claim or item does not exist
     * @throws ConflictException if attempting to flip an already-decided claim
     * @throws SQLException if a database access error occurs
     */
    public Claim overrideClaim(Long claimId, Long adminId, String decision) throws SQLException {
        if (claimId == null || claimId <= 0) {
            throw new ValidationException("Invalid claim id", "id");
        }
        if (decision == null || decision.trim().isEmpty()) {
            throw new ValidationException("Decision is required", "decision");
        }
        String cleanDecision = decision.trim();
        boolean approve;
        if ("APPROVED".equals(cleanDecision)) {
            approve = true;
        } else if ("REJECTED".equals(cleanDecision)) {
            approve = false;
        } else {
            throw new ValidationException("Invalid decision: " + decision + ". Expected APPROVED or REJECTED", "decision");
        }

        return claimService.reviewClaimAsAdmin(claimId, adminId, approve);
    }

    /**
     * Searches and paginates users for admin management.
     * Follows the existing ItemService convention for validation and bounds:
     * - Default limit 20, max 50 (clamped).
     * - Page defaults to 1 (min 1).
     * - q trimmed; blank means no filter; > 100 characters throws ValidationException with field "q".
     * - totalPages computed as (total == 0) ? 0 : ceil(total / limit).
     * - D6 fix: clamps effective query page to totalPages (or returns empty list if totalPages == 0)
     *   preventing any 32-bit offset overflow when large page numbers like 2147483647 are passed.
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

        int actualPage = (page == null || page < 1) ? DEFAULT_PAGE : page;
        int actualLimit = (limit == null || limit < 1) ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);

        int total = adminDAO.countUsers(cleanQ);
        int totalPages = (total == 0) ? 0 : (int) Math.ceil((double) total / actualLimit);

        List<User> users;
        if (totalPages == 0) {
            users = Collections.emptyList();
        } else {
            int effectivePage = Math.min(actualPage, totalPages);
            users = adminDAO.findUsers(cleanQ, effectivePage, actualLimit);
        }

        return new PagedUsers(users, actualPage, actualLimit, total, totalPages);
    }
}
