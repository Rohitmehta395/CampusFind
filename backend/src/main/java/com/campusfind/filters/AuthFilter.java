package com.campusfind.filters;

import com.campusfind.exceptions.UnauthorizedException;
import com.campusfind.utils.JsonResponseUtil;
import com.campusfind.utils.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Authentication filter for protecting secured API endpoints.
 * Intercepts requests, validates the 'Authorization: Bearer <token>' header via JwtUtil,
 * attaches user context (userId, role) as request attributes, and passes control to the chain.
 * Rejects unauthenticated, malformed, or expired token requests with HTTP 401 Unauthorized.
 */
@WebFilter(urlPatterns = {"/api/users", "/api/users/*"})
public class AuthFilter implements Filter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String ALLOWED_ORIGIN = "http://localhost:5173";

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // Initialization if needed
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (!(request instanceof HttpServletRequest httpRequest) || !(response instanceof HttpServletResponse httpResponse)) {
            chain.doFilter(request, response);
            return;
        }

        // If OPTIONS request, allow preflight handling (CorsFilter)
        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String authHeader = httpRequest.getHeader("Authorization");
        if (authHeader == null || !authHeader.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            sendUnauthorized(httpResponse, "Missing or invalid authentication token");
            return;
        }

        String token = authHeader.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            sendUnauthorized(httpResponse, "Missing or invalid authentication token");
            return;
        }

        try {
            Claims claims = JwtUtil.parseToken(token);

            // Extract claims
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

            String role = claims.get("role", String.class);

            // Attach user attributes for downstream servlets
            httpRequest.setAttribute("userId", userId);
            httpRequest.setAttribute("role", role);
            httpRequest.setAttribute("userRole", role);
            httpRequest.setAttribute("claims", claims);

            chain.doFilter(request, response);
        } catch (UnauthorizedException e) {
            sendUnauthorized(httpResponse, "Missing or invalid authentication token");
        }
    }

    private void sendUnauthorized(HttpServletResponse httpResponse, String message) throws IOException {
        // Ensure CORS headers are present even on direct 401 termination
        if (httpResponse.getHeader("Access-Control-Allow-Origin") == null) {
            httpResponse.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
            httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            httpResponse.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
        }
        JsonResponseUtil.writeError(httpResponse, HttpServletResponse.SC_UNAUTHORIZED, message);
    }

    @Override
    public void destroy() {
        // Cleanup if needed
    }
}
