package com.campusfind.servlets;

import com.campusfind.utils.DBConnectionUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Database connectivity health check servlet.
 * Responds to GET /api/health/db with the database connection status.
 */
@WebServlet("/api/health/db")
public class HealthCheckDbServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try (Connection conn = DBConnectionUtil.getConnection()) {
            response.setStatus(HttpServletResponse.SC_OK);
            try (PrintWriter writer = response.getWriter()) {
                writer.print("{\"status\":\"ok\",\"db\":\"connected\"}");
                writer.flush();
            }
        } catch (SQLException | ExceptionInInitializerError e) {
            System.err.println("HealthCheckDbServlet: Database connection failed: " + e.getMessage());
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            try (PrintWriter writer = response.getWriter()) {
                writer.print("{\"status\":\"error\",\"db\":\"unreachable\",\"message\":\"Database connection failed\"}");
                writer.flush();
            }
        }
    }
}
