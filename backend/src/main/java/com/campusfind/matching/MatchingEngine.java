package com.campusfind.matching;

import com.campusfind.dao.ItemDAO;
import com.campusfind.dao.MatchDAO;
import com.campusfind.models.Item;
import com.campusfind.models.Match;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.SQLException;
import java.util.List;

/**
 * Orchestrator for the CampusFind Smart Matching Engine (Phase 9B).
 * Executes synchronous candidate pre-filtering, evaluates per-signal sub-scores
 * via {@link MatchScorer}, performs weighted aggregation with proportional
 * missing-data redistribution, and persists suggested matches meeting threshold.
 */
public class MatchingEngine {

    // Weight configuration across all 7 signals (sum to 1.00 / 100%)
    public static final double WEIGHT_CATEGORY = 0.15;
    public static final double WEIGHT_COLOR    = 0.10;
    public static final double WEIGHT_BRAND    = 0.10;
    public static final double WEIGHT_IMAGE    = 0.30;
    public static final double WEIGHT_TEXT     = 0.15;
    public static final double WEIGHT_LOCATION = 0.10;
    public static final double WEIGHT_DATE     = 0.10;

    /**
     * Date pre-filter window in days (±14 days per architecture specification).
     */
    public static final int CANDIDATE_WINDOW_DAYS = 14;

    /**
     * Minimum combined match score required to generate a persisted match (0.60 = 60%).
     */
    public static final double MATCH_THRESHOLD = 0.60;

    private final ItemDAO itemDAO;
    private final MatchDAO matchDAO;

    public MatchingEngine() {
        this(new ItemDAO(), new MatchDAO());
    }

    public MatchingEngine(ItemDAO itemDAO, MatchDAO matchDAO) {
        this.itemDAO = itemDAO;
        this.matchDAO = matchDAO;
    }

    /**
     * Synchronously processes a newly created item against existing active candidates.
     * Identifies opposite-type candidates, computes sub-scores, redistributes missing weights,
     * and persists any matches reaching or exceeding MATCH_THRESHOLD (0.60).
     *
     * Protected by an internal safety boundary so matching failures are caught and logged
     * rather than propagating and aborting successful item creation.
     *
     * @param newItem the newly persisted Item
     */
    public void processNewItem(Item newItem) {
        if (newItem == null || newItem.getId() == null || newItem.getType() == null || newItem.getCategory() == null) {
            return;
        }

        try {
            String itemType = newItem.getType().trim().toUpperCase();
            if (!Item.TYPE_LOST.equals(itemType) && !Item.TYPE_FOUND.equals(itemType)) {
                return;
            }

            String oppositeType = Item.TYPE_LOST.equals(itemType) ? Item.TYPE_FOUND : Item.TYPE_LOST;

            // Step 1: Pre-filtered candidate selection
            List<Item> candidates = itemDAO.findCandidates(
                    oppositeType,
                    newItem.getCategory(),
                    newItem.getEventDate(),
                    CANDIDATE_WINDOW_DAYS
            );

            if (candidates == null || candidates.isEmpty()) {
                return;
            }

            // Step 2: Evaluate each candidate pair
            for (Item candidate : candidates) {
                if (candidate == null || candidate.getId() == null) {
                    continue;
                }

                // Maintain directional mapping: lost_item_id and found_item_id
                Item lostItem = Item.TYPE_LOST.equals(itemType) ? newItem : candidate;
                Item foundItem = Item.TYPE_FOUND.equals(itemType) ? newItem : candidate;

                Long lostId = lostItem.getId();
                Long foundId = foundItem.getId();

                // Skip if this exact pair already has a persisted match record
                if (matchDAO.existsForPair(lostId, foundId)) {
                    continue;
                }

                // Step 3: Compute per-signal sub-scores via MatchScorer (0.00-1.00 scale)
                Double catScore = MatchScorer.categoryScore(lostItem.getCategory(), foundItem.getCategory());
                Double colScore = MatchScorer.colorScore(lostItem.getColor(), foundItem.getColor());
                Double brdScore = MatchScorer.brandScore(lostItem.getBrand(), foundItem.getBrand());
                Double txtScore = MatchScorer.textScore(
                        lostItem.getTitle(), lostItem.getDescription(),
                        foundItem.getTitle(), foundItem.getDescription()
                );
                Double datScore = MatchScorer.dateProximityScore(lostItem.getEventDate(), foundItem.getEventDate());

                // Phase 10B: Real image similarity score via ImageHasher
                Double imgScore = ImageHasher.imageScore(lostItem.getImageHash(), foundItem.getImageHash());
                Double locScore = null;

                // Step 4: Proportional missing-data redistribution
                // Formula: sum(weight_i * score_i) / sum(weight_i) over only NON-NULL scores
                double weightedSum = 0.0;
                double activeWeightsSum = 0.0;

                if (catScore != null) {
                    weightedSum += WEIGHT_CATEGORY * catScore;
                    activeWeightsSum += WEIGHT_CATEGORY;
                }
                if (colScore != null) {
                    weightedSum += WEIGHT_COLOR * colScore;
                    activeWeightsSum += WEIGHT_COLOR;
                }
                if (brdScore != null) {
                    weightedSum += WEIGHT_BRAND * brdScore;
                    activeWeightsSum += WEIGHT_BRAND;
                }
                if (txtScore != null) {
                    weightedSum += WEIGHT_TEXT * txtScore;
                    activeWeightsSum += WEIGHT_TEXT;
                }
                if (datScore != null) {
                    weightedSum += WEIGHT_DATE * datScore;
                    activeWeightsSum += WEIGHT_DATE;
                }
                if (imgScore != null) {
                    weightedSum += WEIGHT_IMAGE * imgScore;
                    activeWeightsSum += WEIGHT_IMAGE;
                }
                if (locScore != null) {
                    weightedSum += WEIGHT_LOCATION * locScore;
                    activeWeightsSum += WEIGHT_LOCATION;
                }

                if (activeWeightsSum <= 0.0) {
                    continue;
                }

                double finalScore = weightedSum / activeWeightsSum;

                // Step 5: Persist match if score meets or exceeds threshold
                if (finalScore >= MATCH_THRESHOLD) {
                    Match match = new Match();
                    match.setLostItemId(lostId);
                    match.setFoundItemId(foundId);
                    match.setScore(toBigDecimal(finalScore));
                    match.setCategoryScore(toBigDecimal(catScore));
                    match.setColorScore(toBigDecimal(colScore));
                    match.setBrandScore(toBigDecimal(brdScore));
                    match.setTextScore(toBigDecimal(txtScore));
                    match.setDateScore(toBigDecimal(datScore));
                    match.setImageScore(toBigDecimal(imgScore));
                    match.setLocationScore(null);
                    match.setStatus(Match.STATUS_SUGGESTED);

                    matchDAO.insert(match);
                }
            }
        } catch (Exception e) {
            System.err.println("[MatchingEngine] Matching error for item " + newItem.getId() + ": " + e.getMessage());
        }
    }

    private BigDecimal toBigDecimal(Double val) {
        if (val == null) {
            return null;
        }
        return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP);
    }
}
