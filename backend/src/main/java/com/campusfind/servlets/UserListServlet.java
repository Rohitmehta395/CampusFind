package com.campusfind.servlets;

import com.campusfind.models.User;
import com.campusfind.services.UserService;
import com.campusfind.utils.JsonResponseUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Public endpoint to list registered users.
 * Responds to GET /api/users with a JSON array of users wrapped in a top-level object:
 * {"users": [{"id": ..., "name": ..., "email": ..., "role": ..., "isSuspended": ..., "createdAt": ...}]}
 *
 * NOTE: password_hash is strictly omitted from the serialized JSON output.
 * NOTE: This endpoint is currently unauthenticated (known temporary gap for Sub-phase 3C,
 * to be secured and restricted to admins in later phases).
 */
@WebServlet("/api/users")
public class UserListServlet extends BaseServlet {

    private final UserService userService;

    public UserListServlet() {
        this(new UserService());
    }

    public UserListServlet(UserService userService) {
        this.userService = userService;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            List<User> users = userService.getAllUsers();
            StringBuilder sb = new StringBuilder();
            sb.append("{\"users\":[");

            for (int i = 0; i < users.size(); i++) {
                if (i > 0) {
                    sb.append(",");
                }
                User u = users.get(i);
                sb.append("{");
                sb.append("\"id\":").append(u.getId()).append(",");
                sb.append("\"name\":\"").append(JsonResponseUtil.escapeJson(u.getName())).append("\",");
                sb.append("\"email\":\"").append(JsonResponseUtil.escapeJson(u.getEmail())).append("\",");
                sb.append("\"role\":\"").append(JsonResponseUtil.escapeJson(u.getRole())).append("\",");
                sb.append("\"isSuspended\":").append(u.isSuspended()).append(",");
                String createdAtStr = (u.getCreatedAt() != null)
                        ? u.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                        : "";
                sb.append("\"createdAt\":\"").append(JsonResponseUtil.escapeJson(createdAtStr)).append("\"");
                // STRICTLY OMITTING passwordHash / password_hash for security
                sb.append("}");
            }

            sb.append("]}");
            JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, sb.toString());
        });
    }
}
