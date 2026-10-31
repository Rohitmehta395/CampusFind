package com.campusfind.servlets;

import com.campusfind.models.User;
import com.campusfind.utils.AuthUtil;
import com.campusfind.utils.JsonResponseUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.format.DateTimeFormatter;

/**
 * Endpoint for authenticated users to retrieve their own user profile.
 * Responds to GET /api/me.
 * Requires requireActiveUser (blocks suspended accounts and unauthenticated callers).
 *
 * NOTE: password_hash is strictly omitted from the serialized JSON output.
 */
@WebServlet("/api/me")
public class MeServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            User user = AuthUtil.requireActiveUser(req);

            String createdAtStr = (user.getCreatedAt() != null)
                    ? user.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                    : "";

            String jsonResponse = "{"
                    + "\"id\":" + user.getId() + ","
                    + "\"name\":\"" + JsonResponseUtil.escapeJson(user.getName()) + "\","
                    + "\"email\":\"" + JsonResponseUtil.escapeJson(user.getEmail()) + "\","
                    + "\"role\":\"" + JsonResponseUtil.escapeJson(user.getRole()) + "\","
                    + "\"isSuspended\":" + user.isSuspended() + ","
                    + "\"createdAt\":\"" + JsonResponseUtil.escapeJson(createdAtStr) + "\""
                    + "}";

            JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, jsonResponse);
        });
    }
}

