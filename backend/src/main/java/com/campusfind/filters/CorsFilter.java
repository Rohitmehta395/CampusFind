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
 * CORS filter for local development.
 * Allows requests originating from the Vite development server (http://localhost:5173)
 * across all /api/* endpoints and handles HTTP OPTIONS preflight requests.
 */
@WebFilter("/api/*")
public class CorsFilter implements Filter {

    private static final String DEFAULT_ORIGIN = "http://localhost:5173";

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

            String allowedOrigin = DEFAULT_ORIGIN;
            if (envOrigin != null && !envOrigin.isBlank()) {
                java.util.Set<String> allowedSet = new java.util.HashSet<>(java.util.Arrays.asList(envOrigin.split("\\s*,\\s*")));
                allowedSet.add(DEFAULT_ORIGIN);

                if (originHeader != null && (allowedSet.contains(originHeader) || allowedSet.contains("*"))) {
                    allowedOrigin = originHeader;
                } else if (originHeader != null && envOrigin.trim().equals("*")) {
                    allowedOrigin = originHeader;
                } else {
                    allowedOrigin = envOrigin.trim();
                }
            } else if (originHeader != null) {
                allowedOrigin = originHeader;
            }

            httpResponse.setHeader("Access-Control-Allow-Origin", allowedOrigin);
            httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
            httpResponse.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
            httpResponse.setHeader("Vary", "Origin");

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
