package com.campusfind.servlets;

import com.campusfind.utils.JsonResponseUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Health check endpoint providing basic service status verification.
 * Responds to GET /api/health with a JSON status payload.
 */
@WebServlet("/api/health")
public class HealthCheckServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK,
                    "{\"status\":\"ok\",\"service\":\"campusfind-backend\"}");
        });
    }
}
