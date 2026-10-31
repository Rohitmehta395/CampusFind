package com.campusfind.filters;

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
 * CORS and baseline security headers filter.
 * - Manages configurable Allowed Origins via ALLOWED_ORIGIN env var (defaults to http://localhost:5173).
 * - Handles HTTP OPTIONS preflight requests.
 * - Sets standard baseline security headers across all API responses (success and error alike):
 *   X-Content-Type-Options: nosniff
 *   X-Frame-Options: DENY
 *   Referrer-Policy: strict-origin-when-cross-origin
 */
@WebFilter("/api/*")
public class CorsFilter implements Filter {

    public static final String DEFAULT_ORIGIN = "http://localhost:5173";

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // Initialization if needed
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (request instanceof HttpServletRequest httpRequest && response instanceof HttpServletResponse httpResponse) {
            String originHeader = httpRequest.getHeader("Origin");
            String envOrigin = System.getenv("ALLOWED_ORIGIN");
            if (envOrigin == null || envOrigin.isBlank()) {
                envOrigin = System.getenv("FRONTEND_URL");
            }

            String configuredOrigin = (envOrigin != null && !envOrigin.isBlank())
                    ? envOrigin.trim()
                    : DEFAULT_ORIGIN;

            String responseOrigin = null;

            if ("*".equals(configuredOrigin)) {
                // If explicitly configured as wildcard
                responseOrigin = (originHeader != null) ? originHeader : "*";
            } else {
                // Support comma-separated list of allowed origins
                String[] origins = configuredOrigin.split("\\s*,\\s*");
                if (originHeader != null) {
                    for (String o : origins) {
                        if (o.equalsIgnoreCase(originHeader.trim())) {
                            responseOrigin = originHeader;
                            break;
                        }
                    }
                }
            }

            if (responseOrigin != null) {
                httpResponse.setHeader("Access-Control-Allow-Origin", responseOrigin);
                httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
                httpResponse.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
                httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
                httpResponse.setHeader("Vary", "Origin");
            }

            // D5: Baseline Security Headers applied to every response
            httpResponse.setHeader("X-Content-Type-Options", "nosniff");
            httpResponse.setHeader("X-Frame-Options", "DENY");
            httpResponse.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

            if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
                httpResponse.setStatus(HttpServletResponse.SC_OK);
                return;
            }
        }

        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        // Cleanup if needed
    }
}
