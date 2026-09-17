package com.campusfind.exceptions;

/**
 * Thrown when an unauthenticated or unauthorized operation is attempted.
 * Maps to HTTP 401 Unauthorized.
 */
public class UnauthorizedException extends CampusFindException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
