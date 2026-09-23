package com.campusfind.utils;

import com.campusfind.exceptions.UnauthorizedException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

/**
 * Utility for generating, signing, and validating JSON Web Tokens (JWT).
 * Signs tokens with HMAC-SHA256 using a server-side secret loaded strictly
 * from the JWT_SECRET environment variable.
 */
public final class JwtUtil {

    private static final long EXPIRATION_TIME_MS = 24 * 60 * 60 * 1000L; // 24 hours

    private JwtUtil() {
        // Prevent instantiation
    }

    /**
     * Resolves and returns the HMAC-SHA signing key from the JWT_SECRET environment variable.
     *
     * @return a cryptographic Key suitable for HS256 signing
     * @throws IllegalStateException if JWT_SECRET is not configured or insufficient in length
     */
    private static Key getSigningKey() {
        String secret = System.getenv("JWT_SECRET");
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException("JWT_SECRET environment variable is not configured");
        }
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 256 bits (32 bytes) for HMAC-SHA256");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generates a signed JWT for an authenticated user with a 24-hour expiration.
     *
     * @param userId the user's primary key ID
     * @param role   the user's role (e.g. STUDENT, ADMIN)
     * @return the serialized, signed JWT compact string
     */
    public static String generateToken(Long userId, String role) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .claim("userId", userId)
                .claim("role", role)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + EXPIRATION_TIME_MS))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Parses and verifies a JWT token string.
     * Validates the cryptographic signature and expiration.
     *
     * @param token the compact JWT string to parse
     * @return the verified Claims payload
     * @throws UnauthorizedException if the token is missing, expired, or malformed
     */
    public static Claims parseToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new UnauthorizedException("Authentication token is missing");
        }
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token.trim())
                    .getBody();
        } catch (JwtException | IllegalArgumentException e) {
            throw new UnauthorizedException("Invalid or expired authentication token");
        }
    }
}
