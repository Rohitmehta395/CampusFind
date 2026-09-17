package com.campusfind.exceptions;

/**
 * Thrown when client input fails validation checks.
 * Maps to HTTP 400 Bad Request.
 */
public class ValidationException extends CampusFindException {

    private final String field;

    public ValidationException(String message) {
        super(message);
        this.field = null;
    }

    public ValidationException(String message, String field) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
