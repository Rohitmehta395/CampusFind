package com.campusfind.servlets;

import com.campusfind.dao.AdminDAO.AdminStats;
import com.campusfind.exceptions.NotFoundException;
import com.campusfind.models.User;
import com.campusfind.services.AdminService;
import com.campusfind.services.AdminService.PagedUsers;
import com.campusfind.utils.AuthUtil;
import com.campusfind.utils.JsonResponseUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Administrative servlet handling platform dashboard statistics and user list queries.
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
}
