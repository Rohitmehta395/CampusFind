package com.campusfind.utils;

import com.campusfind.exceptions.UnauthorizedException;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Utility for extracting and verifying authenticated user credentials
 * directly within servlet request handlers (for fine-grained or mixed-access routes).
 */
public final class AuthUtil {

    private static final String BEARER_PREFIX = "Bearer ";

    private AuthUtil() {
        // Prevent instantiation
    }

    /**
     * Parses the Authorization header, validates the JWT, and returns the claims payload.
     *
     * @param request the HTTP servlet request
     * @return the verified Claims
     * @throws UnauthorizedException if header is missing, malformed, or token is invalid/expired
     */
    public static Claims parseClaims(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            throw new UnauthorizedException("Missing or invalid authentication token");
        }

        String token = authHeader.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            throw new UnauthorizedException("Missing or invalid authentication token");
        }

        return JwtUtil.parseToken(token);
    }

    /**
     * Extracts and validates the authenticated userId from the Authorization header.
     *
     * @param request the HTTP servlet request
     * @return the authenticated userId
     * @throws UnauthorizedException if authentication fails or userId claim is missing
     */
    public static Long requireAuthenticatedUserId(HttpServletRequest request) {
        // If request was already processed by AuthFilter and attribute is present:
        Object attr = request.getAttribute("userId");
        if (attr instanceof Long l) {
            return l;
        }

        Claims claims = parseClaims(request);
        Object userIdObj = claims.get("userId");
        Long userId = null;
        if (userIdObj instanceof Number num) {
            userId = num.longValue();
        } else if (userIdObj != null) {
            try {
                userId = Long.parseLong(userIdObj.toString());
            } catch (NumberFormatException ignored) {
            }
        } else if (claims.getSubject() != null) {
            try {
                userId = Long.parseLong(claims.getSubject());
            } catch (NumberFormatException ignored) {
            }
        }

        if (userId == null) {
            throw new UnauthorizedException("Invalid token payload: missing userId");
        }

        return userId;
    }

    /**
     * Extracts and validates the authenticated user's role from the Authorization header.
     *
     * @param request the HTTP servlet request
     * @return the authenticated role (e.g. STUDENT, ADMIN)
     * @throws UnauthorizedException if authentication fails or role claim is missing
     */
    public static String requireAuthenticatedRole(HttpServletRequest request) {
        Object attr = request.getAttribute("role");
        if (attr instanceof String s && !s.isEmpty()) {
            return s;
        }

        Claims claims = parseClaims(request);
        String role = claims.get("role", String.class);
        if (role == null || role.isBlank()) {
            throw new UnauthorizedException("Invalid token payload: missing role");
        }
        return role;
    }
}
