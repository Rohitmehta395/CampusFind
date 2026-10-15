package com.campusfind.servlets;

import com.campusfind.exceptions.NotFoundException;
import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.Notification;
import com.campusfind.services.NotificationService;
import com.campusfind.utils.AuthUtil;
import com.campusfind.utils.JsonResponseUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/**
 * Servlet handling user notification operations at /api/notifications and /api/notifications/*.
 * - GET /api/notifications: list paginated notifications for authenticated user
 * - GET /api/notifications/unread-count: get count of unread notifications
 * - PATCH /api/notifications/{id}/read: mark a single notification as read
 * - PATCH /api/notifications/read-all: mark all unread notifications as read
 */
@WebServlet(urlPatterns = {"/api/notifications", "/api/notifications/*"})
public class NotificationServlet extends BaseServlet {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public NotificationServlet() {
        this(new NotificationService(), new ObjectMapper());
    }

    public NotificationServlet(NotificationService notificationService) {
        this(notificationService, new ObjectMapper());
    }

    public NotificationServlet(NotificationService notificationService, ObjectMapper objectMapper) {
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if ("PATCH".equalsIgnoreCase(req.getMethod())) {
            doPatch(req, resp);
        } else {
            super.service(req, resp);
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            // All endpoints authenticated via AuthUtil
            Long userId = AuthUtil.requireAuthenticatedUserId(req);

            String pathInfo = req.getPathInfo();

            if (pathInfo == null || pathInfo.trim().isEmpty() || pathInfo.trim().equals("/")) {
                // GET /api/notifications?unreadOnly=&page=&limit=
                boolean unreadOnly = "true".equalsIgnoreCase(req.getParameter("unreadOnly"));

                Integer page = null;
                String pageStr = req.getParameter("page");
                if (pageStr != null && !pageStr.trim().isEmpty()) {
                    try {
                        page = Integer.parseInt(pageStr.trim());
                    } catch (NumberFormatException ignored) {
                    }
                }

                Integer limit = null;
                String limitStr = req.getParameter("limit");
                if (limitStr != null && !limitStr.trim().isEmpty()) {
                    try {
                        limit = Integer.parseInt(limitStr.trim());
                    } catch (NumberFormatException ignored) {
                    }
                }

                NotificationService.PagedNotifications result = notificationService.list(userId, unreadOnly, page, limit);
                String json = formatNotificationsJson(result);
                JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, json);
            } else if ("/unread-count".equalsIgnoreCase(pathInfo.trim()) || "/unread-count/".equalsIgnoreCase(pathInfo.trim())) {
                // GET /api/notifications/unread-count
                int unreadCount = notificationService.getUnreadCount(userId);
                String json = "{\"unreadCount\":" + unreadCount + "}";
                JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, json);
            } else {
                throw new NotFoundException("Endpoint not found");
            }
        });
    }

    protected void doPatch(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            // All endpoints authenticated via AuthUtil
            Long userId = AuthUtil.requireAuthenticatedUserId(req);

            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.trim().isEmpty() || pathInfo.trim().equals("/")) {
                throw new NotFoundException("Endpoint not found");
            }

            String trimmed = pathInfo.trim();

            // Match "read-all" BEFORE trying to parse as a numeric ID
            if ("/read-all".equalsIgnoreCase(trimmed) || "/read-all/".equalsIgnoreCase(trimmed)) {
                int updated = notificationService.markAllRead(userId);
                String json = "{\"updated\":" + updated + "}";
                JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, json);
                return;
            }

            // Match "/{id}/read"
            if (trimmed.matches("^/[^/]+/read/?$")) {
                String[] parts = trimmed.split("/");
                // parts[0] is "", parts[1] is {id}, parts[2] is "read"
                String idStr = parts[1];
                Long notificationId;
                try {
                    notificationId = Long.parseLong(idStr);
                } catch (NumberFormatException e) {
                    throw new ValidationException("Invalid notification id", "id");
                }

                if (notificationId <= 0) {
                    throw new ValidationException("Invalid notification id", "id");
                }

                notificationService.markRead(notificationId, userId);
                String json = "{\"id\":" + notificationId + ",\"isRead\":true}";
                JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, json);
                return;
            }

            throw new NotFoundException("Endpoint not found");
        });
    }

    private String formatNotificationsJson(NotificationService.PagedNotifications result) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"notifications\":[");
        List<Notification> list = result.getNotifications();
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(formatSingleNotificationJson(list.get(i)));
        }
        sb.append("],")
          .append("\"page\":").append(result.getPage()).append(",")
          .append("\"limit\":").append(result.getLimit()).append(",")
          .append("\"total\":").append(result.getTotal()).append(",")
          .append("\"totalPages\":").append(result.getTotalPages())
          .append("}");
        return sb.toString();
    }

    private String formatSingleNotificationJson(Notification n) {
        String payloadJson = "null";
        String rawPayload = n.getPayload();
        if (rawPayload != null && !rawPayload.trim().isEmpty()) {
            try {
                JsonNode node = objectMapper.readTree(rawPayload);
                if (node != null && !node.isNull()) {
                    payloadJson = objectMapper.writeValueAsString(node);
                }
            } catch (Exception e) {
                // If it does not parse as valid JSON, emit null
                payloadJson = "null";
            }
        }

        StringBuilder sb = new StringBuilder();
        sb.append("{")
          .append("\"id\":").append(n.getId()).append(",")
          .append("\"type\":\"").append(JsonResponseUtil.escapeJson(n.getType())).append("\",")
          .append("\"isRead\":").append(n.isRead()).append(",")
          .append("\"createdAt\":").append(n.getCreatedAt() != null ? "\"" + n.getCreatedAt() + "\"" : "null").append(",")
          .append("\"payload\":").append(payloadJson)
          .append("}");
        return sb.toString();
    }
}
