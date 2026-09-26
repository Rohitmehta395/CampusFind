package com.campusfind.matching;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Core scoring module for CampusFind Smart Matching Engine (Phase 9A).
 * Provides pure, deterministic, independently-testable scoring functions
 * for lost and found item comparison across individual signals.
 *
 * Scoring Scale & Null Convention:
 * - All methods return scores normalized to a 0.00 - 1.00 scale (as a Java Double).
 * - A return value of null indicates missing or incomplete comparison data
 *   (i.e., "cannot compare"), signaling downstream aggregation in Phase 9B
 *   to redistribute weight proportionally per the missing-data handling rule.
 * - Note on categoryScore: null input returns 0.0 (not null), as unknown category
 *   cannot match known category and cannot be safely redistributed.
 */
public class MatchScorer {

    /**
     * Date proximity cutoff in days. Items reported within this window decay
     * linearly from 1.0 (same day) to 0.0 (21 days apart).
     */
    public static final int DATE_CUTOFF_DAYS = 21;

    /**
     * Common English stop words filtered out before text similarity scoring.
     */
    private static final Set<String> STOP_WORDS = Set.of(
            "the", "a", "an", "is", "was", "are", "were",
            "with", "near", "and", "or", "in", "on", "at",
            "to", "for", "of", "by", "it", "from", "has"
    );

    /**
     * Bidirectional synonym table for color near-matches (scores 0.5).
     * Entries represent closely related or commonly interchangeable color descriptors.
     */
    public static final Map<String, Set<String>> COLOR_SYNONYMS = new HashMap<>();

    static {
        addColorSynonym("navy", "blue");
        addColorSynonym("dark", "black");
        addColorSynonym("grey", "gray");
        addColorSynonym("silver", "grey");
        addColorSynonym("silver", "gray");
        addColorSynonym("gold", "yellow");
        addColorSynonym("maroon", "red");
        addColorSynonym("tan", "beige");
        addColorSynonym("brown", "tan");
        addColorSynonym("purple", "violet");
    }

    private static void addColorSynonym(String c1, String c2) {
        COLOR_SYNONYMS.computeIfAbsent(c1.toLowerCase(), k -> new HashSet<>()).add(c2.toLowerCase());
        COLOR_SYNONYMS.computeIfAbsent(c2.toLowerCase(), k -> new HashSet<>()).add(c1.toLowerCase());
    }

    private MatchScorer() {
        // Pure utility class, prevent instantiation
    }

    /**
     * Computes category match score.
     * Scale: 1.0 for case-insensitive exact match, 0.0 otherwise.
     * Null convention: returns 0.0 if either input is null or blank.
     *
     * @param categoryA First item's category
     * @param categoryB Second item's category
     * @return 1.0 if match, 0.0 if different or if either category is null
     */
    public static Double categoryScore(String categoryA, String categoryB) {
        if (categoryA == null || categoryB == null) {
            return 0.0;
        }
        String catA = categoryA.trim();
        String catB = categoryB.trim();
        if (catA.isEmpty() || catB.isEmpty()) {
            return 0.0;
        }
        return catA.equalsIgnoreCase(catB) ? 1.0 : 0.0;
    }

    /**
     * Computes color match score.
     * Scale:
     * - 1.0: exact case-insensitive match
     * - 0.5: recognized synonym pair (e.g. navy and blue, dark and black)
     * - 0.0: distinct colors
     * Null convention: returns null if either input is null or blank (missing signal).
     *
     * @param colorA First item's color
     * @param colorB Second item's color
     * @return 1.0, 0.5, 0.0, or null if either input is null/blank
     */
    public static Double colorScore(String colorA, String colorB) {
        if (colorA == null || colorB == null) {
            return null;
        }
        String c1 = colorA.trim().toLowerCase();
        String c2 = colorB.trim().toLowerCase();
        if (c1.isEmpty() || c2.isEmpty()) {
            return null;
        }
        if (c1.equals(c2)) {
            return 1.0;
        }
        Set<String> synonyms = COLOR_SYNONYMS.get(c1);
        if (synonyms != null && synonyms.contains(c2)) {
            return 0.5;
        }
        return 0.0;
    }

    /**
     * Computes brand match score.
     * Scale: 1.0 for exact case-insensitive match, 0.0 otherwise.
     * Null convention: returns null if either input is null or blank (missing signal).
     *
     * @param brandA First item's brand
     * @param brandB Second item's brand
     * @return 1.0, 0.0, or null if either input is null/blank
     */
    public static Double brandScore(String brandA, String brandB) {
        if (brandA == null || brandB == null) {
            return null;
        }
        String b1 = brandA.trim();
        String b2 = brandB.trim();
        if (b1.isEmpty() || b2.isEmpty()) {
            return null;
        }
        return b1.equalsIgnoreCase(b2) ? 1.0 : 0.0;
    }

    /**
     * Computes text similarity score between two raw text blocks using Jaccard token overlap.
     * Normalizes text by lowercasing, splitting by non-alphanumeric punctuation/whitespace,
     * removing stop words, and computing |intersection| / |union| of resulting token sets.
     *
     * Scale: 0.00 to 1.00.
     * Null convention: returns null if either input is null or yields no valid tokens after cleaning.
     *
     * @param textA First text string
     * @param textB Second text string
     * @return Jaccard similarity score [0.0 - 1.0], or null if either input lacks tokens
     */
    public static Double textScore(String textA, String textB) {
        if (textA == null || textB == null) {
            return null;
        }
        Set<String> tokensA = extractTokens(textA);
        Set<String> tokensB = extractTokens(textB);
        if (tokensA.isEmpty() || tokensB.isEmpty()) {
            return null;
        }

        Set<String> intersection = new HashSet<>(tokensA);
        intersection.retainAll(tokensB);

        Set<String> union = new HashSet<>(tokensA);
        union.addAll(tokensB);

        if (union.isEmpty()) {
            return null;
        }

        return (double) intersection.size() / (double) union.size();
    }

    /**
     * Overload of textScore that combines title and description for each item.
     * Combines non-blank title and description with a space separator.
     * Returns null if either item has neither title nor description.
     *
     * @param titleA Item A title
     * @param descriptionA Item A description
     * @param titleB Item B title
     * @param descriptionB Item B description
     * @return Jaccard similarity score [0.0 - 1.0], or null if either item has no text
     */
    public static Double textScore(String titleA, String descriptionA, String titleB, String descriptionB) {
        String textA = combineText(titleA, descriptionA);
        String textB = combineText(titleB, descriptionB);
        if (textA == null || textB == null) {
            return null;
        }
        return textScore(textA, textB);
    }

    /**
     * Computes date proximity score with linear decay up to DATE_CUTOFF_DAYS (21 days).
     * Formula:
     * - daysDiff = 0: 1.0
     * - daysDiff >= 21: 0.0
     * - 0 < daysDiff < 21: 1.0 - (daysDiff / 21.0)
     *
     * Null convention: returns null if either date is null (missing signal).
     *
     * @param dateA First item event date
     * @param dateB Second item event date
     * @return Proximity score [0.0 - 1.0], or null if either date is null
     */
    public static Double dateProximityScore(LocalDate dateA, LocalDate dateB) {
        if (dateA == null || dateB == null) {
            return null;
        }
        long daysDiff = Math.abs(ChronoUnit.DAYS.between(dateA, dateB));
        if (daysDiff >= DATE_CUTOFF_DAYS) {
            return 0.0;
        }
        return 1.0 - ((double) daysDiff / DATE_CUTOFF_DAYS);
    }

    /**
     * Helper to tokenize a text string: lowercases, splits on non-alphanumeric chars,
     * strips tokens, and filters out stop words and single-character noise.
     */
    public static Set<String> extractTokens(String text) {
        if (text == null || text.trim().isEmpty()) {
            return Collections.emptySet();
        }
        return Arrays.stream(text.toLowerCase().split("[^a-zA-Z0-9]+"))
                .map(String::trim)
                .filter(t -> !t.isEmpty())
                .filter(t -> !STOP_WORDS.contains(t))
                .collect(Collectors.toSet());
    }

    /**
     * Combines title and description into a single string.
     * Returns null if both are null or blank.
     */
    private static String combineText(String title, String description) {
        boolean hasTitle = title != null && !title.trim().isEmpty();
        boolean hasDesc = description != null && !description.trim().isEmpty();
        if (!hasTitle && !hasDesc) {
            return null;
        }
        if (hasTitle && hasDesc) {
            return title.trim() + " " + description.trim();
        }
        return hasTitle ? title.trim() : description.trim();
    }
}
