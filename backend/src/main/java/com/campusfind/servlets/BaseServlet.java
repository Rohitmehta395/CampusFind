package com.campusfind.servlets;

import com.campusfind.exceptions.CampusFindException;
import com.campusfind.utils.JsonResponseUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Abstract base servlet providing centralized exception handling and JSON error responses
 * for all CampusFind HTTP endpoints.
 */
public abstract class BaseServlet extends HttpServlet {

    /**
     * Executes the provided servlet action within a centralized try-catch block.
     * Maps known application exceptions (CampusFindException) to their HTTP status codes,
     * and catches unexpected exceptions with a safe, generic 500 error response.
     *
     * @param request  the HTTP request
     * @param response the HTTP response
     * @param action   the request handling logic to execute
     * @throws IOException if writing the response fails
     */
    protected void handle(HttpServletRequest request, HttpServletResponse response, ServletAction action) throws IOException {
        try {
            action.run(request, response);
        } catch (CampusFindException ex) {
            JsonResponseUtil.writeError(response, ex);
        } catch (Exception ex) {
            // Log full exception server-side; never expose details or stack traces to client
            System.err.println("BaseServlet: Unhandled exception processing " + request.getMethod() + " " + request.getRequestURI() + ": " + ex.getMessage());
            ex.printStackTrace(System.err);
            JsonResponseUtil.writeError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "An internal server error occurred");
        }
    }
}
