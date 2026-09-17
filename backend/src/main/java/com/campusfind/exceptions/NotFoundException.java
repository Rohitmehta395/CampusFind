package com.campusfind.exceptions;

/**
 * Thrown when a requested resource or entity is not found.
 * Maps to HTTP 404 Not Found.
 */
public class NotFoundException extends CampusFindException {

    public NotFoundException(String message) {
        super(message);
    }
}
