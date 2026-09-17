package com.campusfind.exceptions;

/**
 * Base unchecked exception for all application-specific exceptions in CampusFind.
 */
public abstract class CampusFindException extends RuntimeException {

    public CampusFindException(String message) {
        super(message);
    }

    public CampusFindException(String message, Throwable cause) {
        super(message, cause);
    }
}
