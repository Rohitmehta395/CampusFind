package com.campusfind.utils;

import com.campusfind.dao.UserDAO;
import com.campusfind.exceptions.ForbiddenException;
import com.campusfind.exceptions.UnauthorizedException;
import com.campusfind.models.User;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

import java.sql.SQLException;
import java.util.Optional;

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

    /**
     * Authenticates the request token, loads the User entity directly from the database,
     * and rejects suspended accounts with HTTP 403 Forbidden.
     * Reusable foundation for 14B authenticated requests.
     *
     * @param request the HTTP servlet request
     * @return the active User record from the database
     * @throws UnauthorizedException if token is missing/invalid or user record no longer exists
     * @throws ForbiddenException if the user account is suspended
     */
    public static User requireActiveUser(HttpServletRequest request) {
        Long userId = requireAuthenticatedUserId(request);
        UserDAO userDAO = new UserDAO();
        Optional<User> userOpt;
        try {
            userOpt = userDAO.findById(userId);
        } catch (SQLException e) {
            throw new RuntimeException("Database error verifying user: " + e.getMessage(), e);
        }

        if (userOpt.isEmpty()) {
            throw new UnauthorizedException("User no longer exists");
        }

        User user = userOpt.get();
        if (user.isSuspended()) {
            throw new ForbiddenException("Account is suspended");
        }

        return user;
    }

    /**
     * Enforces database-backed admin authorization.
     * Validates the token, verifies the user exists and is not suspended in the database,
     * and verifies that the database role is ADMIN (ignoring any token role claim).
     *
     * @param request the HTTP servlet request
     * @return the admin's userId
     * @throws UnauthorizedException if token is missing/invalid or user does not exist
     * @throws ForbiddenException if account is suspended or role is not ADMIN
     */
    public static Long requireAdmin(HttpServletRequest request) {
        User user = requireActiveUser(request);
        if (!User.ROLE_ADMIN.equals(user.getRole())) {
            throw new ForbiddenException("Admin access required");
        }
        return user.getId();
    }
}

