package com.campusfind.utils;

import org.mindrot.jbcrypt.BCrypt;

/**
 * Utility for hashing and verifying passwords using BCrypt.
 * Uses a work factor (salt rounds) of 12 for strong security.
 * Under no circumstances are plaintext passwords logged or retained.
 */
public final class PasswordUtil {

    private static final int WORK_FACTOR = 12;

    private PasswordUtil() {
        // Prevent instantiation
    }

    /**
     * Hashes a plaintext password using BCrypt with a secure salt.
     *
     * @param plainPassword the plaintext password to hash
     * @return the resulting BCrypt hash string (format: $2a$...)
     * @throws IllegalArgumentException if the password is null or empty
     */
    public static String hash(String plainPassword) {
        if (plainPassword == null || plainPassword.isEmpty()) {
            throw new IllegalArgumentException("Password cannot be null or empty");
        }
        return BCrypt.hashpw(plainPassword, BCrypt.gensalt(WORK_FACTOR));
    }

    /**
     * Verifies a plaintext password against a previously generated BCrypt hash.
     *
     * @param plainPassword the plaintext password to check
     * @param hash          the stored BCrypt hash
     * @return true if the password matches the hash, false otherwise
     */
    public static boolean verify(String plainPassword, String hash) {
        if (plainPassword == null || hash == null || plainPassword.isEmpty() || hash.isEmpty()) {
            return false;
        }
        try {
            return BCrypt.checkpw(plainPassword, hash);
        } catch (IllegalArgumentException e) {
            // Catches invalid salt/hash format errors gracefully without leaking info
            return false;
        }
    }
}
