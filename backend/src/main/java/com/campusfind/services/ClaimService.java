package com.campusfind.services;

import com.campusfind.dao.ClaimDAO;
import com.campusfind.dao.ItemDAO;
import com.campusfind.dao.MatchDAO;
import com.campusfind.exceptions.ForbiddenException;
import com.campusfind.exceptions.NotFoundException;
import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.Claim;
import com.campusfind.models.Item;
import com.campusfind.models.Match;
import com.campusfind.models.Notification;

import java.sql.SQLException;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Service layer handling business logic and validation for ownership claims on items.
 */
public class ClaimService {

    public static final int MIN_EVIDENCE_LENGTH = 10;

    private final ClaimDAO claimDAO;
    private final ItemService itemService;
    private final ItemDAO itemDAO;
    private final MatchDAO matchDAO;
    private final NotificationService notificationService;

    public ClaimService() {
        this(new ClaimDAO(), new ItemService(), new ItemDAO(), new MatchDAO(), new NotificationService());
    }

    public ClaimService(ClaimDAO claimDAO, ItemService itemService) {
        this(claimDAO, itemService, new ItemDAO(), new MatchDAO(), new NotificationService());
    }

    public ClaimService(ClaimDAO claimDAO, ItemService itemService, ItemDAO itemDAO) {
        this(claimDAO, itemService, itemDAO, new MatchDAO(), new NotificationService());
    }

    public ClaimService(ClaimDAO claimDAO, ItemService itemService, ItemDAO itemDAO, NotificationService notificationService) {
        this(claimDAO, itemService, itemDAO, new MatchDAO(), notificationService);
    }

    public ClaimService(ClaimDAO claimDAO, ItemService itemService, ItemDAO itemDAO, MatchDAO matchDAO, NotificationService notificationService) {
        this.claimDAO = claimDAO;
        this.itemService = itemService;
        this.itemDAO = itemDAO;
        this.matchDAO = matchDAO;
        this.notificationService = notificationService;
    }

    /**
     * Validates and submits an ownership claim against an existing active item.
     *
     * @param claimantId   the authenticated user's ID
     * @param itemId       the ID of the item being claimed
     * @param evidenceText claimant-provided evidentiary details not visible in public listing
     * @return the created and persisted Claim domain object
     * @throws ValidationException if input parameters or business rules fail validation
     * @throws NotFoundException   if the item does not exist
     * @throws SQLException        if a database access error occurs
     */
    public Claim submitClaim(Long claimantId, Long itemId, String evidenceText) throws SQLException {
        // 1. Validate claimant ID
        if (claimantId == null || claimantId <= 0) {
            throw new ValidationException("Invalid claimant id", "claimantId");
        }

        // 2. Validate item ID and existence (itemService.getItemById throws NotFoundException if missing)
        if (itemId == null || itemId <= 0) {
            throw new ValidationException("Invalid item id", "itemId");
        }
        Item item = itemService.getItemById(itemId);

        // 3. Validate item status is ACTIVE
        if (!Item.STATUS_ACTIVE.equalsIgnoreCase(item.getStatus())) {
            throw new ValidationException("This item is no longer active and cannot be claimed", "itemId");
        }

        // 4. Validate claimant is not the item's own reporter
        if (claimantId.equals(item.getReporterId())) {
            throw new ValidationException("You cannot submit a claim on your own item", "itemId");
        }

        // 5. Validate evidence text
        if (evidenceText == null || evidenceText.trim().isEmpty()) {
            throw new ValidationException("Evidence text cannot be blank", "evidenceText");
        }
        String cleanEvidence = evidenceText.trim();
        if (cleanEvidence.length() < MIN_EVIDENCE_LENGTH) {
            throw new ValidationException("Evidence text must be at least " + MIN_EVIDENCE_LENGTH + " characters", "evidenceText");
        }

        // 6. Assemble and persist Claim entity
        Claim claim = new Claim();
        claim.setItemId(itemId);
        claim.setClaimantId(claimantId);
        claim.setEvidenceText(cleanEvidence);
        claim.setStatus(Claim.STATUS_PENDING);
        claim.setReviewedBy(null);
        claim.setReviewedAt(null);

        Claim persisted = claimDAO.insert(claim);

        // Trigger 2: CLAIM_SUBMITTED (notify item's reporter)
        try {
            Long reporterId = item.getReporterId();
            if (reporterId != null && !reporterId.equals(claimantId)) {
                Map<String, Object> payload = new LinkedHashMap<>();
                payload.put("claimId", persisted.getId());
                payload.put("itemId", itemId);
                notificationService.notifyUser(reporterId, Notification.TYPE_CLAIM_SUBMITTED, payload);
            }
        } catch (Exception ex) {
            System.err.println("[ClaimService] Non-fatal notification error for submitted claim " 
                    + persisted.getId() + ": " + ex.getMessage());
        }

        return persisted;
    }

    /**
     * Retrieves all claims submitted against a specific item.
     * Restricted to the item's reporter (HTTP 403 Forbidden for non-owners).
     *
     * @param itemId      the item ID
     * @param requesterId the ID of the authenticated user requesting the claims
     * @return list of Claim records (including evidenceText)
     * @throws ValidationException if parameters are invalid
     * @throws NotFoundException   if the item does not exist
     * @throws ForbiddenException  if the requester is not the item's reporter
     * @throws SQLException        if a database access error occurs
     */
    public List<Claim> getClaimsForItem(Long itemId, Long requesterId) throws SQLException {
        if (itemId == null || itemId <= 0) {
            throw new ValidationException("Invalid item id", "itemId");
        }
        if (requesterId == null || requesterId <= 0) {
            throw new ValidationException("Invalid requester id", "requesterId");
        }

        Item item = itemService.getItemById(itemId);
        if (!requesterId.equals(item.getReporterId())) {
            throw new ForbiddenException("You are not authorized to view claims for this item");
        }

        return claimDAO.findByItemId(itemId);
    }

    /**
     * Reviews and decides on an ownership claim (approve or reject).
     * Restricted to the item's reporter (the reviewer).
     * When approved: the item's status flips to RESOLVED, and all other PENDING claims
     * on the same item are automatically bulk-rejected.
     * When rejected: only this claim is marked REJECTED, and the item remains ACTIVE.
     *
     * @param claimId    the ID of the claim being reviewed
     * @param reviewerId the ID of the authenticated user performing the review
     * @param approve    true to approve, false to reject
     * @return the updated Claim entity
     * @throws ValidationException if input is invalid or claim is already reviewed
     * @throws NotFoundException   if the claim or item does not exist
     * @throws ForbiddenException  if reviewer is not the item's reporter
     * @throws SQLException        if a database access error occurs
     */
    public Claim reviewClaim(Long claimId, Long reviewerId, boolean approve) throws SQLException {
        if (claimId == null || claimId <= 0) {
            throw new ValidationException("Invalid claim id", "id");
        }
        if (reviewerId == null || reviewerId <= 0) {
            throw new ValidationException("Invalid reviewer id", "reviewerId");
        }

        // 1. Fetch claim
        Claim claim = claimDAO.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // 2. Fetch underlying item
        Item item = itemService.getItemById(claim.getItemId());

        // 3. Verify reviewer is the item's reporter
        if (!reviewerId.equals(item.getReporterId())) {
            throw new ForbiddenException("You are not authorized to review claims for this item");
        }

        // 4. Verify claim status is PENDING (no re-reviewing allowed)
        if (!Claim.STATUS_PENDING.equalsIgnoreCase(claim.getStatus())) {
            throw new ValidationException("This claim has already been reviewed", "status");
        }

        // 5. Execute review action
        if (approve) {
            List<Claim> siblingsToReject = claimDAO.findOtherPendingClaims(item.getId(), claimId);

            claimDAO.updateStatus(claimId, Claim.STATUS_APPROVED, reviewerId);
            claimDAO.rejectOtherPendingClaims(item.getId(), claimId, reviewerId);
            itemDAO.updateStatus(item.getId(), Item.STATUS_RESOLVED);

            // Trigger 3: CLAIM_APPROVED & CLAIM_REJECTED (siblings), and Trigger 4: ITEM_RESOLVED
            try {
                // 3a. Notify approved claimant
                if (claim.getClaimantId() != null && !claim.getClaimantId().equals(reviewerId)) {
                    Map<String, Object> payloadApproved = new LinkedHashMap<>();
                    payloadApproved.put("claimId", claimId);
                    payloadApproved.put("itemId", item.getId());
                    notificationService.notifyUser(claim.getClaimantId(), Notification.TYPE_CLAIM_APPROVED, payloadApproved);
                }

                // 3b. Notify auto-rejected siblings
                if (siblingsToReject != null) {
                    for (Claim sibling : siblingsToReject) {
                        if (sibling.getClaimantId() != null && !sibling.getClaimantId().equals(reviewerId)) {
                            Map<String, Object> payloadSibling = new LinkedHashMap<>();
                            payloadSibling.put("claimId", sibling.getId());
                            payloadSibling.put("itemId", item.getId());
                            notificationService.notifyUser(sibling.getClaimantId(), Notification.TYPE_CLAIM_REJECTED, payloadSibling);
                        }
                    }
                }

                // 4. Trigger ITEM_RESOLVED: notify counterpart items' reporters
                List<Match> matches = matchDAO.findByItemId(item.getId());
                if (matches != null && !matches.isEmpty()) {
                    Set<Long> notifiedReporters = new HashSet<>();
                    for (Match m : matches) {
                        Long counterpartItemId = m.getLostItemId().equals(item.getId()) 
                                ? m.getFoundItemId() 
                                : m.getLostItemId();
                        if (counterpartItemId != null) {
                            itemDAO.findById(counterpartItemId).ifPresent(cpItem -> {
                                Long cpReporterId = cpItem.getReporterId();
                                // Exclude reviewer (actor) and avoid duplicates
                                if (cpReporterId != null && !cpReporterId.equals(reviewerId) && notifiedReporters.add(cpReporterId)) {
                                    Map<String, Object> payloadResolved = new LinkedHashMap<>();
                                    payloadResolved.put("itemId", counterpartItemId);
                                    payloadResolved.put("resolvedItemId", item.getId());
                                    notificationService.notifyUser(cpReporterId, Notification.TYPE_ITEM_RESOLVED, payloadResolved);
                                }
                            });
                        }
                    }
                }
            } catch (Exception ex) {
                System.err.println("[ClaimService] Non-fatal notification error during claim approval " 
                        + claimId + ": " + ex.getMessage());
            }
        } else {
            claimDAO.updateStatus(claimId, Claim.STATUS_REJECTED, reviewerId);

            // Trigger 3: CLAIM_REJECTED
            try {
                if (claim.getClaimantId() != null && !claim.getClaimantId().equals(reviewerId)) {
                    Map<String, Object> payloadRejected = new LinkedHashMap<>();
                    payloadRejected.put("claimId", claimId);
                    payloadRejected.put("itemId", item.getId());
                    notificationService.notifyUser(claim.getClaimantId(), Notification.TYPE_CLAIM_REJECTED, payloadRejected);
                }
            } catch (Exception ex) {
                System.err.println("[ClaimService] Non-fatal notification error during claim rejection " 
                        + claimId + ": " + ex.getMessage());
            }
        }

        // 6. Return refreshed claim
        return claimDAO.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found after update"));
    }
}
