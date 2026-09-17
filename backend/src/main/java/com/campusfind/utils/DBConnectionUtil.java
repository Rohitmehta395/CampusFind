package com.campusfind.utils;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Shared JDBC connection utility for CampusFind.
 * Opens a new Connection per call using credentials supplied via environment variables
 * (DB_URL, DB_USER, DB_PASSWORD). Connections must be closed by the caller.
 */
public final class DBConnectionUtil {

    private static final String ENV_DB_URL = "DB_URL";
    private static final String ENV_DB_USER = "DB_USER";
    private static final String ENV_DB_PASSWORD = "DB_PASSWORD";

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new ExceptionInInitializerError("MySQL JDBC Driver not found: " + e.getMessage());
        }
    }

    private DBConnectionUtil() {
        // Prevent instantiation of utility class
    }

    /**
     * Establishes and returns a new JDBC database connection.
     *
     * @return a new java.sql.Connection instance
     * @throws SQLException if an environment variable is missing or connection fails
     */
    public static Connection getConnection() throws SQLException {
        String dbUrl = System.getenv(ENV_DB_URL);
        String dbUser = System.getenv(ENV_DB_USER);
        String dbPassword = System.getenv(ENV_DB_PASSWORD);

        if (dbUrl == null || dbUrl.isBlank()) {
            throw new SQLException("Missing required environment variable: " + ENV_DB_URL);
        }
        if (dbUser == null || dbUser.isBlank()) {
            throw new SQLException("Missing required environment variable: " + ENV_DB_USER);
        }
        if (dbPassword == null) {
            throw new SQLException("Missing required environment variable: " + ENV_DB_PASSWORD);
        }

        return DriverManager.getConnection(dbUrl, dbUser, dbPassword);
    }
}
