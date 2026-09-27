package com.campusfind.services;

import com.campusfind.dao.ClaimDAO;
import com.campusfind.exceptions.NotFoundException;
import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.Claim;
import com.campusfind.models.Item;

import java.sql.SQLException;

/**
 * Service layer handling business logic and validation for ownership claims on items.
 */
public class ClaimService {

    public static final int MIN_EVIDENCE_LENGTH = 10;

    private final ClaimDAO claimDAO;
    private final ItemService itemService;

    public ClaimService() {
        this(new ClaimDAO(), new ItemService());
    }

    public ClaimService(ClaimDAO claimDAO, ItemService itemService) {
        this.claimDAO = claimDAO;
        this.itemService = itemService;
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

        return claimDAO.insert(claim);
    }
}
