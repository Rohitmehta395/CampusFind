package com.campusfind.servlets;

import com.campusfind.utils.DBConnectionUtil;
import com.campusfind.utils.JsonResponseUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Database connectivity health check servlet.
 * Responds to GET /api/health/db with the database connection status.
 */
@WebServlet("/api/health/db")
public class HealthCheckDbServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            try (Connection conn = DBConnectionUtil.getConnection()) {
                JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK,
                        "{\"status\":\"ok\",\"db\":\"connected\"}");
            } catch (SQLException | ExceptionInInitializerError e) {
                System.err.println("HealthCheckDbServlet: Database connection failed: " + e.getMessage());
                JsonResponseUtil.writeJson(res, HttpServletResponse.SC_SERVICE_UNAVAILABLE,
                        "{\"status\":\"error\",\"db\":\"unreachable\",\"message\":\"Database connection failed\"}");
            }
        });
    }
}
