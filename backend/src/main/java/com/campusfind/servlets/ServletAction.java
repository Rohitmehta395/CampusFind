package com.campusfind.servlets;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Functional interface representing a servlet request-handling action
 * that may throw checked or unchecked exceptions.
 */
@FunctionalInterface
public interface ServletAction {

    /**
     * Executes the servlet action.
     *
     * @param request  the HTTP request
     * @param response the HTTP response
     * @throws Exception if an error occurs during execution
     */
    void run(HttpServletRequest request, HttpServletResponse response) throws Exception;
}
