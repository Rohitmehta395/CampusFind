package com.campusfind.servlets;

import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.User;
import com.campusfind.services.AuthService;
import com.campusfind.utils.JsonResponseUtil;
import com.campusfind.utils.RequestBodyUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.format.DateTimeFormatter;

/**
 * Public registration endpoint for new students in CampusFind.
 * Responds to POST /api/auth/register with a JSON payload.
 *
 * NOTE: password_hash is strictly omitted from the serialized JSON output.
 */
@WebServlet("/api/auth/register")
public class RegisterServlet extends BaseServlet {

    private final AuthService authService;

    public RegisterServlet() {
        this(new AuthService());
    }

    public RegisterServlet(AuthService authService) {
        this.authService = authService;
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            RequestBodyUtil.RegisterRequest registerRequest = RequestBodyUtil.parse(req, RequestBodyUtil.RegisterRequest.class);
            if (registerRequest == null) {
                throw new ValidationException("Request body cannot be empty", "body");
            }

            User createdUser = authService.register(
                    registerRequest.getName(),
                    registerRequest.getEmail(),
                    registerRequest.getPassword()
            );

            String createdAtStr = (createdUser.getCreatedAt() != null)
                    ? createdUser.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                    : "";

            // Safely serialize created user without password_hash
            String jsonResponse = "{"
                    + "\"id\":" + createdUser.getId() + ","
                    + "\"name\":\"" + JsonResponseUtil.escapeJson(createdUser.getName()) + "\","
                    + "\"email\":\"" + JsonResponseUtil.escapeJson(createdUser.getEmail()) + "\","
                    + "\"role\":\"" + JsonResponseUtil.escapeJson(createdUser.getRole()) + "\","
                    + "\"createdAt\":\"" + JsonResponseUtil.escapeJson(createdAtStr) + "\""
                    + "}";

            JsonResponseUtil.writeJson(res, HttpServletResponse.SC_CREATED, jsonResponse);
        });
    }
}
