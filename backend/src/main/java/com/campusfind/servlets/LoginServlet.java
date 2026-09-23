package com.campusfind.servlets;

import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.User;
import com.campusfind.services.AuthService;
import com.campusfind.utils.JsonResponseUtil;
import com.campusfind.utils.JwtUtil;
import com.campusfind.utils.RequestBodyUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Authentication login endpoint for CampusFind users.
 * Responds to POST /api/auth/login with a signed JWT token and user profile.
 *
 * NOTE: password_hash is strictly omitted from the serialized JSON output.
 */
@WebServlet("/api/auth/login")
public class LoginServlet extends BaseServlet {

    private final AuthService authService;

    public LoginServlet() {
        this(new AuthService());
    }

    public LoginServlet(AuthService authService) {
        this.authService = authService;
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            RequestBodyUtil.LoginRequest loginRequest = RequestBodyUtil.parse(req, RequestBodyUtil.LoginRequest.class);
            if (loginRequest == null) {
                throw new ValidationException("Request body cannot be empty", "body");
            }

            User user = authService.authenticate(loginRequest.getEmail(), loginRequest.getPassword());
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
