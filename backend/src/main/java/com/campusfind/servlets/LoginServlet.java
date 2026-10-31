package com.campusfind.servlets;

import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.User;
import com.campusfind.services.AuthService;
import com.campusfind.utils.JsonResponseUtil;
import com.campusfind.utils.JwtUtil;
import com.campusfind.utils.LoginRateLimiter;
import com.campusfind.utils.RequestBodyUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Authentication login endpoint for CampusFind users.
 * Responds to POST /api/auth/login with a signed JWT token and user profile.
 * Protected by LoginRateLimiter (max 5 failed attempts per IP per 15-minute window).
 *
 * NOTE: password_hash is strictly omitted from the serialized JSON output.
 */
@WebServlet("/api/auth/login")
public class LoginServlet extends BaseServlet {

    private final AuthService authService;
    private final LoginRateLimiter rateLimiter;

    public LoginServlet() {
        this(new AuthService(), LoginRateLimiter.getInstance());
    }

    public LoginServlet(AuthService authService) {
        this(authService, LoginRateLimiter.getInstance());
    }

    public LoginServlet(AuthService authService, LoginRateLimiter rateLimiter) {
        this.authService = authService;
        this.rateLimiter = rateLimiter;
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            String clientIp = req.getRemoteAddr();

            // 1. Check rate limit BEFORE credential check
            if (rateLimiter.isRateLimited(clientIp)) {
                JsonResponseUtil.writeError(res, 429, "Too many login attempts. Try again later.");
                return;
            }

            RequestBodyUtil.LoginRequest loginRequest = RequestBodyUtil.parse(req, RequestBodyUtil.LoginRequest.class);
            if (loginRequest == null) {
                throw new ValidationException("Request body cannot be empty", "body");
            }

            User user;
            try {
                user = authService.authenticate(loginRequest.getEmail(), loginRequest.getPassword());
            } catch (Exception e) {
                // Record failed login attempt for client IP
                rateLimiter.recordFailure(clientIp);
                throw e;
            }

            // Successful login resets rate limit counter for this IP
            rateLimiter.recordSuccess(clientIp);

            String token = JwtUtil.generateToken(user.getId(), user.getRole());

            String jsonResponse = "{"
                    + "\"token\":\"" + JsonResponseUtil.escapeJson(token) + "\","
                    + "\"user\":{"
                    + "\"id\":" + user.getId() + ","
                    + "\"name\":\"" + JsonResponseUtil.escapeJson(user.getName()) + "\","
                    + "\"email\":\"" + JsonResponseUtil.escapeJson(user.getEmail()) + "\","
                    + "\"role\":\"" + JsonResponseUtil.escapeJson(user.getRole()) + "\""
                    + "}"
                    + "}";

            JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, jsonResponse);
        });
    }
}
