package com.campusfind.matching;

import java.math.BigDecimal;

/**
 * Location similarity scorer for the CampusFind Smart Matching Engine (Phase 12A).
 * Computes great-circle (Haversine) distance between coordinate pairs in meters
 * and applies linear decay to produce a normalized 0.00-1.00 similarity score.
 */
public class LocationScorer {

    /**
     * Mean radius of the Earth in meters (WGS84 spherical approximation).
     */
    public static final double EARTH_RADIUS_METERS = 6371000.0;

    /**
     * Maximum distance cutoff in meters beyond which location similarity drops to 0.00.
     * Set to 500.0 meters (~5-7 minute walking distance across a typical campus).
     */
    public static final double CUTOFF_METERS = 500.0;

    /**
     * Computes the great-circle distance between two points on Earth using the Haversine formula.
     *
     * @param lat1 latitude of first point in degrees
     * @param lng1 longitude of first point in degrees
     * @param lat2 latitude of second point in degrees
     * @param lng2 longitude of second point in degrees
     * @return distance in meters
     */
    public static double haversineDistanceMeters(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double radLat1 = Math.toRadians(lat1);
        double radLat2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0)
                + Math.cos(radLat1) * Math.cos(radLat2)
                * Math.sin(dLng / 2.0) * Math.sin(dLng / 2.0);

        double c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));

        return EARTH_RADIUS_METERS * c;
    }

    /**
     * Computes a normalized location proximity score between two coordinate pairs.
     * Follows the nullable-Double convention: returns null if any of the coordinates is null.
     * Uses linear decay: 1.0 at 0m distance, decaying linearly to 0.0 at CUTOFF_METERS (500m).
     *
     * Formula: distance >= CUTOFF_METERS ? 0.0 : 1.0 - (distance / CUTOFF_METERS)
     *
     * @param latA latitude of point A
     * @param lngA longitude of point A
     * @param latB latitude of point B
     * @param lngB longitude of point B
     * @return score between 0.0 and 1.0, or null if any coordinate is missing
     */
    public static Double locationScore(Double latA, Double lngA, Double latB, Double lngB) {
        if (latA == null || lngA == null || latB == null || lngB == null) {
            return null;
        }

        double distance = haversineDistanceMeters(latA, lngA, latB, lngB);
        if (distance >= CUTOFF_METERS) {
            return 0.0;
        }

        double score = 1.0 - (distance / CUTOFF_METERS);
        return Math.max(0.0, Math.min(1.0, score));
    }

    /**
     * Overloaded convenience method accepting BigDecimal coordinates (from Item domain model).
     *
     * @param latA latitude of point A as BigDecimal
     * @param lngA longitude of point A as BigDecimal
     * @param latB latitude of point B as BigDecimal
     * @param lngB longitude of point B as BigDecimal
     * @return score between 0.0 and 1.0, or null if any coordinate is missing
     */
    public static Double locationScore(BigDecimal latA, BigDecimal lngA, BigDecimal latB, BigDecimal lngB) {
        if (latA == null || lngA == null || latB == null || lngB == null) {
            return null;
        }
        return locationScore(latA.doubleValue(), lngA.doubleValue(), latB.doubleValue(), lngB.doubleValue());
    }
}
