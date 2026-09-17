package com.campusfind.utils;

import com.campusfind.exceptions.CampusFindException;
import com.campusfind.exceptions.ConflictException;
import com.campusfind.exceptions.NotFoundException;
import com.campusfind.exceptions.UnauthorizedException;
import com.campusfind.exceptions.ValidationException;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;

/**
 * Shared utility for writing standardized JSON responses and mapping exceptions
 * to HTTP status codes across CampusFind servlets.
 */
public final class JsonResponseUtil {

    private JsonResponseUtil() {
        // Prevent instantiation
    }

    /**
     * Escapes special characters within a raw string for safe inclusion in a JSON string literal.
     * Handles quotes, backslashes, standard control escapes, and ASCII control codes per RFC 8259.
     *
     * @param text the raw string to escape (may be null)
     * @return the escaped JSON string content
     */
    public static String escapeJson(String text) {
        if (text == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(text.length() + 16);
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.toString();
    }

    /**
     * Determines the appropriate HTTP status code corresponding to an exception type.
     *
     * @param ex the exception to evaluate
     * @return HTTP status code (400, 401, 404, 409, or 500)
     */
    public static int getStatusCode(Throwable ex) {
        if (ex instanceof ValidationException) {
            return HttpServletResponse.SC_BAD_REQUEST; // 400
        } else if (ex instanceof UnauthorizedException) {
            return HttpServletResponse.SC_UNAUTHORIZED; // 401
        } else if (ex instanceof NotFoundException) {
            return HttpServletResponse.SC_NOT_FOUND; // 404
        } else if (ex instanceof ConflictException) {
            return HttpServletResponse.SC_CONFLICT; // 409
        }
        return HttpServletResponse.SC_INTERNAL_SERVER_ERROR; // 500
    }

    /**
     * Writes a JSON response body with the specified HTTP status code.
     *
     * @param response the HttpServletResponse instance
     * @param status   the HTTP status code
     * @param json     the JSON string to write
     * @throws IOException if writing to the response fails
     */
    public static void writeJson(HttpServletResponse response, int status, String json) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setStatus(status);
        try (PrintWriter writer = response.getWriter()) {
            writer.print(json);
            writer.flush();
        }
    }

    /**
     * Writes a successful JSON response (convenience alias for {@link #writeJson}).
     *
     * @param response the HttpServletResponse instance
     * @param status   the HTTP status code (typically 200 or 201)
     * @param json     the JSON payload
     * @throws IOException if writing to the response fails
     */
    public static void writeSuccess(HttpServletResponse response, int status, String json) throws IOException {
        writeJson(response, status, json);
    }

    /**
     * Writes a standardized JSON error response in the shape: {"error":"<message>"}.
     *
     * @param response the HttpServletResponse instance
     * @param status   the HTTP error status code
     * @param message  the human-readable error description
     * @throws IOException if writing to the response fails
     */
    public static void writeError(HttpServletResponse response, int status, String message) throws IOException {
        writeError(response, status, message, null);
    }

    /**
     * Writes a standardized JSON error response with an optional field identifier:
     * {"error":"<message>","field":"<field>"}.
     *
     * @param response the HttpServletResponse instance
     * @param status   the HTTP error status code
     * @param message  the human-readable error description
     * @param field    the specific field that caused the error (e.g. for validation failures), or null
     * @throws IOException if writing to the response fails
     */
    public static void writeError(HttpServletResponse response, int status, String message, String field) throws IOException {
        String json;
        if (field != null && !field.trim().isEmpty()) {
            json = "{\"error\":\"" + escapeJson(message) + "\",\"field\":\"" + escapeJson(field) + "\"}";
        } else {
            json = "{\"error\":\"" + escapeJson(message) + "\"}";
        }
        writeJson(response, status, json);
    }

    /**
     * Writes an error response derived directly from a {@link CampusFindException}.
     * Maps the exception class to its status code and extracts field info if available.
     *
     * @param response the HttpServletResponse instance
     * @param ex       the CampusFindException
     * @throws IOException if writing to the response fails
     */
    public static void writeError(HttpServletResponse response, CampusFindException ex) throws IOException {
        int status = getStatusCode(ex);
        String field = (ex instanceof ValidationException ve) ? ve.getField() : null;
        writeError(response, status, ex.getMessage(), field);
    }

    /**
     * Writes an error response derived from any general {@link Throwable}.
     *
     * @param response the HttpServletResponse instance
     * @param ex       the Throwable
     * @throws IOException if writing to the response fails
     */
    public static void writeError(HttpServletResponse response, Throwable ex) throws IOException {
        int status = getStatusCode(ex);
        String field = (ex instanceof ValidationException ve) ? ve.getField() : null;
        String message = (ex.getMessage() != null) ? ex.getMessage() : "An unexpected error occurred";
        writeError(response, status, message, field);
    }
}
