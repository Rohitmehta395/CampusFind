package com.campusfind.servlets;

import com.campusfind.dao.AdminDAO.AdminStats;
import com.campusfind.exceptions.NotFoundException;
import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.Claim;
import com.campusfind.models.Item;
import com.campusfind.models.User;
import com.campusfind.services.AdminService;
import com.campusfind.services.AdminService.PagedUsers;
import com.campusfind.utils.AuthUtil;
import com.campusfind.utils.JsonResponseUtil;
import com.campusfind.utils.RequestBodyUtil;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Administrative servlet handling platform dashboard statistics, user management,
 * item moderation, and claim decision overrides.
 * Mapped to /api/admin/* and secured strictly by AuthUtil.requireAdmin.
 */
@WebServlet("/api/admin/*")
public class AdminServlet extends BaseServlet {

    private final AdminService adminService;

    public AdminServlet() {
        this(new AdminService());
    }

    public AdminServlet(AdminService adminService) {
        this.adminService = adminService;
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
            // In every handler, call requireAdmin FIRST, before routing on pathInfo and before any other work
            AuthUtil.requireAdmin(req);

            String pathInfo = req.getPathInfo();
            if (pathInfo == null) {
                pathInfo = "";
            }

            if (pathInfo.matches("^/stats/?$")) {
                handleStats(req, res);
            } else if (pathInfo.matches("^/users/?$")) {
                handleUsers(req, res);
            } else {
                throw new NotFoundException("Admin resource not found: " + pathInfo);
            }
        });
    }

    protected void doPatch(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            // In every handler, call requireAdmin FIRST, before routing on pathInfo and before any other work
            Long adminId = AuthUtil.requireAdmin(req);

            String pathInfo = req.getPathInfo();
            if (pathInfo == null) {
                pathInfo = "";
            }
            String trimmed = pathInfo.trim();

            if (trimmed.matches("^/users/[^/]+/(suspend|unsuspend)/?$")) {
                handleUserSuspendUnsuspend(req, res, trimmed, adminId);
            } else if (trimmed.matches("^/items/[^/]+/?$")) {
                handleItemModerate(req, res, trimmed);
            } else if (trimmed.matches("^/claims/[^/]+/?$")) {
                handleClaimOverride(req, res, trimmed, adminId);
            } else {
                throw new NotFoundException("Admin resource not found: " + pathInfo);
            }
        });
    }

    private void handleStats(HttpServletRequest req, HttpServletResponse res) throws SQLException, IOException {
        AdminStats stats = adminService.getStats();

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"users\":{")
          .append("\"total\":").append(stats.usersTotal).append(",")
          .append("\"students\":").append(stats.usersStudents).append(",")
          .append("\"admins\":").append(stats.usersAdmins).append(",")
          .append("\"suspended\":").append(stats.usersSuspended)
          .append("},");

        sb.append("\"items\":{")
          .append("\"total\":").append(stats.itemsTotal).append(",")
          .append("\"active\":").append(stats.itemsActive).append(",")
          .append("\"resolved\":").append(stats.itemsResolved).append(",")
          .append("\"removed\":").append(stats.itemsRemoved).append(",")
          .append("\"lost\":").append(stats.itemsLost).append(",")
          .append("\"found\":").append(stats.itemsFound)
          .append("},");

        sb.append("\"claims\":{")
          .append("\"total\":").append(stats.claimsTotal).append(",")
          .append("\"pending\":").append(stats.claimsPending).append(",")
          .append("\"approved\":").append(stats.claimsApproved).append(",")
          .append("\"rejected\":").append(stats.claimsRejected)
          .append("},");

        sb.append("\"matches\":{")
          .append("\"total\":").append(stats.matchesTotal)
          .append("},");

        sb.append("\"notifications\":{")
          .append("\"unread\":").append(stats.notificationsUnread)
          .append("}");
        sb.append("}");

        res.setContentType("application/json;charset=UTF-8");
        res.setStatus(HttpServletResponse.SC_OK);
        res.getWriter().write(sb.toString());
    }

    private void handleUsers(HttpServletRequest req, HttpServletResponse res) throws SQLException, IOException {
        String q = req.getParameter("q");
        Integer page = null;
        Integer limit = null;

        String pageParam = req.getParameter("page");
        if (pageParam != null && !pageParam.trim().isEmpty()) {
            try {
                page = Integer.parseInt(pageParam.trim());
            } catch (NumberFormatException ignored) {
            }
        }

        String limitParam = req.getParameter("limit");
        if (limitParam != null && !limitParam.trim().isEmpty()) {
            try {
                limit = Integer.parseInt(limitParam.trim());
            } catch (NumberFormatException ignored) {
            }
        }

        PagedUsers paged = adminService.getUsers(q, page, limit);

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"users\":[");

        List<User> list = paged.getUsers();
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) {
                sb.append(",");
            }
            User u = list.get(i);
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
            sb.append("}");
        }

        sb.append("],");
        sb.append("\"page\":").append(paged.getPage()).append(",");
        sb.append("\"limit\":").append(paged.getLimit()).append(",");
        sb.append("\"total\":").append(paged.getTotal()).append(",");
        sb.append("\"totalPages\":").append(paged.getTotalPages());
        sb.append("}");

        res.setContentType("application/json;charset=UTF-8");
        res.setStatus(HttpServletResponse.SC_OK);
        res.getWriter().write(sb.toString());
    }

    private void handleUserSuspendUnsuspend(HttpServletRequest req, HttpServletResponse res, String path, Long actingAdminId)
            throws SQLException, IOException {
        // path is "/users/{id}/suspend" or "/users/{id}/unsuspend"
        String[] parts = path.split("/");
        // parts[0] = "", parts[1] = "users", parts[2] = {id}, parts[3] = "suspend"|"unsuspend"
        if (parts.length < 4) {
            throw new ValidationException("Invalid user id", "id");
        }

        Long userId;
        try {
            userId = Long.parseLong(parts[2]);
        } catch (NumberFormatException e) {
            throw new ValidationException("Invalid user id", "id");
        }
        if (userId <= 0) {
            throw new ValidationException("Invalid user id", "id");
        }

        String action = parts[3];
        User updatedUser;
        if ("suspend".equalsIgnoreCase(action)) {
            updatedUser = adminService.suspendUser(userId, actingAdminId);
        } else if ("unsuspend".equalsIgnoreCase(action)) {
            updatedUser = adminService.unsuspendUser(userId);
        } else {
            throw new NotFoundException("Admin resource not found: " + path);
        }

        String json = formatUserStatusJson(updatedUser);
        JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, json);
    }

    private void handleItemModerate(HttpServletRequest req, HttpServletResponse res, String path)
            throws SQLException, IOException {
        // path is "/items/{id}"
        String[] parts = path.split("/");
        // parts[0] = "", parts[1] = "items", parts[2] = {id}
        if (parts.length < 3) {
            throw new ValidationException("Invalid item id", "id");
        }

        Long itemId;
        try {
            itemId = Long.parseLong(parts[2]);
        } catch (NumberFormatException e) {
            throw new ValidationException("Invalid item id", "id");
        }
        if (itemId <= 0) {
            throw new ValidationException("Invalid item id", "id");
        }

        JsonNode tree = RequestBodyUtil.parseTree(req);
        JsonNode actionNode = tree.get("action");
        if (actionNode == null || actionNode.isNull() || actionNode.asText().trim().isEmpty()) {
            throw new ValidationException("Action is required", "action");
        }

        String action = actionNode.asText().trim();
        Item item = adminService.moderateItem(itemId, action);
        String json = formatItemStatusJson(item);
        JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, json);
    }

    private void handleClaimOverride(HttpServletRequest req, HttpServletResponse res, String path, Long actingAdminId)
            throws SQLException, IOException {
        // path is "/claims/{id}"
        String[] parts = path.split("/");
        // parts[0] = "", parts[1] = "claims", parts[2] = {id}
        if (parts.length < 3) {
            throw new ValidationException("Invalid claim id", "id");
        }

        Long claimId;
        try {
            claimId = Long.parseLong(parts[2]);
        } catch (NumberFormatException e) {
            throw new ValidationException("Invalid claim id", "id");
        }
        if (claimId <= 0) {
            throw new ValidationException("Invalid claim id", "id");
        }

        JsonNode tree = RequestBodyUtil.parseTree(req);
        JsonNode decisionNode = tree.get("decision");
        if (decisionNode == null || decisionNode.isNull() || decisionNode.asText().trim().isEmpty()) {
            throw new ValidationException("Decision is required", "decision");
        }

        String decision = decisionNode.asText().trim();
        Claim updatedClaim = adminService.overrideClaim(claimId, actingAdminId, decision);
        String json = formatClaimReviewJson(updatedClaim);
        JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, json);
    }

    private String quote(String s) {
        if (s == null) {
            return "null";
        }
        return "\"" + JsonResponseUtil.escapeJson(s) + "\"";
    }

    private String formatUserStatusJson(User u) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":").append(u.getId()).append(",");
        sb.append("\"email\":").append(quote(u.getEmail())).append(",");
        sb.append("\"role\":").append(quote(u.getRole())).append(",");
        sb.append("\"isSuspended\":").append(u.isSuspended());
        sb.append("}");
        return sb.toString();
    }

    private String formatItemStatusJson(Item item) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":").append(item.getId()).append(",");
        sb.append("\"status\":").append(quote(item.getStatus()));
        sb.append("}");
        return sb.toString();
    }

    private String formatClaimReviewJson(Claim claim) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":").append(claim.getId()).append(",");
        sb.append("\"itemId\":").append(claim.getItemId()).append(",");
        sb.append("\"claimantId\":").append(claim.getClaimantId()).append(",");
        sb.append("\"status\":").append(quote(claim.getStatus())).append(",");
        sb.append("\"reviewedBy\":").append(claim.getReviewedBy() != null ? claim.getReviewedBy() : "null").append(",");
        sb.append("\"createdAt\":").append(claim.getCreatedAt() != null ? quote(claim.getCreatedAt().toString()) : "null").append(",");
        sb.append("\"reviewedAt\":").append(claim.getReviewedAt() != null ? quote(claim.getReviewedAt().toString()) : "null");
        sb.append("}");
        return sb.toString();
    }
}
