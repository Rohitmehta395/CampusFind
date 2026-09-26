package com.campusfind.exceptions;

/**
 * Thrown when an authenticated caller attempts to access a resource that they
 * do not have permission to view or manipulate (HTTP 403 Forbidden).
 * Distinct from UnauthorizedException (HTTP 401), which indicates missing
 * or invalid authentication credentials.
 */
public class ForbiddenException extends CampusFindException {

    public ForbiddenException(String message) {
        super(message);
    }
}
