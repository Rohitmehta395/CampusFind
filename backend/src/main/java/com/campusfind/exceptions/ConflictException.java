package com.campusfind.exceptions;

/**
 * Thrown when an operation conflicts with existing server state (e.g., duplicate email).
 * Maps to HTTP 409 Conflict.
 */
public class ConflictException extends CampusFindException {

    public ConflictException(String message) {
        super(message);
    }
}
