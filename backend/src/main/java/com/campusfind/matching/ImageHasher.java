package com.campusfind.matching;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import javax.imageio.ImageIO;

/**
 * Perceptual image hashing and similarity comparison module for CampusFind (Phase 10A).
 *
 * Implements the difference hash (dHash) algorithm:
 * 1. Decodes raw image bytes into a BufferedImage using ImageIO.
 * 2. Resizes the image to a 9x8 grid with grayscale luminance conversion.
 * 3. Compares adjacent horizontal pixel brightness across 8 rows of 8 comparisons each,
 *    producing a deterministic 64-bit fingerprint stored in a standard 64-bit Java long.
 * 4. Compares two hashes via bitwise XOR Hamming distance (differing bit count).
 * 5. Normalizes similarity to a 0.0 - 1.0 scale: 1.0 - (distance / 64.0).
 *
 * Following MatchScorer's convention, imageScore returns null when either hash is null
 * (representing missing image data or uncomputable hash for weight redistribution).
 */
public class ImageHasher {

    /**
     * Width of resized grayscale grid (9 columns yields 8 adjacent horizontal comparisons per row).
     */
    public static final int GRID_WIDTH = 9;

    /**
     * Height of resized grayscale grid (8 rows).
     */
    public static final int GRID_HEIGHT = 8;

    /**
     * Total number of bit comparisons: 8 rows * 8 column differences = 64 bits.
     */
    public static final int TOTAL_BITS = 64;

    private ImageHasher() {
        // Prevent instantiation of utility class
    }

    /**
     * Computes a 64-bit difference hash (dHash) from raw image bytes.
     *
     * @param imageBytes raw image bytes (JPEG, PNG, WebP supported by ImageIO plugins, etc.)
     * @return 64-bit perceptual hash as a signed long
     * @throws IllegalArgumentException if imageBytes is null or empty
     * @throws IOException if decoding fails due to corrupt data or unsupported format
     */
    public static long computeHash(byte[] imageBytes) throws IOException {
        if (imageBytes == null || imageBytes.length == 0) {
            throw new IllegalArgumentException("Image bytes cannot be null or empty");
        }

        BufferedImage originalImage;
        try (ByteArrayInputStream bais = new ByteArrayInputStream(imageBytes)) {
            originalImage = ImageIO.read(bais);
        }

        if (originalImage == null) {
            throw new IOException("Failed to decode image data: unsupported format or corrupt image stream");
        }

        return computeHash(originalImage);
    }

    /**
     * Computes a 64-bit difference hash (dHash) from an already-decoded BufferedImage.
     *
     * @param image decoded BufferedImage
     * @return 64-bit perceptual hash as a signed long
     * @throws IllegalArgumentException if image is null
     */
    public static long computeHash(BufferedImage image) {
        if (image == null) {
            throw new IllegalArgumentException("Image cannot be null");
        }

        // Resize directly to 9x8 grayscale image
        BufferedImage resized = new BufferedImage(GRID_WIDTH, GRID_HEIGHT, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g2d = resized.createGraphics();
        try {
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.drawImage(image, 0, 0, GRID_WIDTH, GRID_HEIGHT, null);
        } finally {
            g2d.dispose();
        }

        // Compute 64 difference bits: row by row, compare left pixel to right pixel
        long hash = 0L;
        int bitIndex = 0;
        for (int y = 0; y < GRID_HEIGHT; y++) {
            for (int x = 0; x < GRID_WIDTH - 1; x++) {
                int leftPixel = resized.getRaster().getSample(x, y, 0);
                int rightPixel = resized.getRaster().getSample(x + 1, y, 0);

                if (leftPixel > rightPixel) {
                    hash |= (1L << bitIndex);
                }
                bitIndex++;
            }
        }

        return hash;
    }

    /**
     * Computes the Hamming distance (number of differing bits) between two 64-bit hashes.
     *
     * @param hashA first perceptual hash
     * @param hashB second perceptual hash
     * @return count of differing bit positions (0 to 64 inclusive)
     */
    public static int hammingDistance(long hashA, long hashB) {
        return Long.bitCount(hashA ^ hashB);
    }

    /**
     * Computes normalized image similarity score between two perceptual hashes.
     *
     * Following MatchScorer's null convention:
     * - Returns null if either hash is null (signaling missing image data for weight redistribution).
     * - Returns a Double in [0.0, 1.0] where 1.0 represents identical visual fingerprints (distance 0)
     *   and 0.0 represents maximum visual divergence (distance 64).
     *
     * @param hashA first perceptual hash (nullable)
     * @param hashB second perceptual hash (nullable)
     * @return similarity score in [0.00, 1.00] or null if either input is null
     */
    public static Double imageScore(Long hashA, Long hashB) {
        if (hashA == null || hashB == null) {
            return null;
        }

        int distance = hammingDistance(hashA, hashB);
        return 1.0 - ((double) distance / TOTAL_BITS);
    }

    /**
     * Formats a 64-bit hash as a 16-character hexadecimal string.
     *
     * @param hash 64-bit hash
     * @return 16-character lowercase hex string
     */
    public static String toHexString(long hash) {
        return String.format("%016x", hash);
    }

    /**
     * Parses a 16-character hexadecimal string into a 64-bit long hash.
     *
     * @param hex 16-character hex representation
     * @return 64-bit hash
     * @throws IllegalArgumentException if hex string is null or invalid
     */
    public static long parseHexHash(String hex) {
        if (hex == null || hex.trim().isEmpty()) {
            throw new IllegalArgumentException("Hex string cannot be null or empty");
        }
        return Long.parseUnsignedLong(hex.trim(), 16);
    }
}
