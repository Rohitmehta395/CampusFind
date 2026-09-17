package com.campusfind.dao;

import com.campusfind.models.User;
import com.campusfind.utils.DBConnectionUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object for User entities.
 * Handles database interactions with the `users` table via plain JDBC and PreparedStatements.
 */
public class UserDAO {

    /**
     * Maps a single ResultSet row to a User domain model object.
     * Note: Includes password_hash for complete internal representation;
     * boundary filtering must be done at the presentation/JSON layer.
     */
    private User mapRow(ResultSet rs) throws SQLException {
        Timestamp ts = rs.getTimestamp("created_at");
        LocalDateTime createdAt = (ts != null) ? ts.toLocalDateTime() : null;
        return new User(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("email"),
                rs.getString("password_hash"),
                rs.getString("role"),
                rs.getBoolean("is_suspended"),
                createdAt
        );
    }

    /**
     * Retrieves all users from the database, ordered by ID.
     *
     * @return a list of all User records
     * @throws SQLException if a database access error occurs
     */
    public List<User> findAll() throws SQLException {
        String sql = "SELECT id, name, email, password_hash, role, is_suspended, created_at FROM users ORDER BY id ASC";
        List<User> users = new ArrayList<>();
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                users.add(mapRow(rs));
            }
        }
        return users;
    }

    /**
     * Retrieves a user by their primary key ID.
     *
     * @param id the primary key ID
     * @return an Optional containing the User if found, or empty if not
     * @throws SQLException if a database access error occurs
     */
    public Optional<User> findById(Long id) throws SQLException {
        String sql = "SELECT id, name, email, password_hash, role, is_suspended, created_at FROM users WHERE id = ?";
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        }
        return Optional.empty();
    }

    /**
     * Retrieves a user by their unique email address.
     *
     * @param email the email to search for
     * @return an Optional containing the User if found, or empty if not
     * @throws SQLException if a database access error occurs
     */
    public Optional<User> findByEmail(String email) throws SQLException {
        String sql = "SELECT id, name, email, password_hash, role, is_suspended, created_at FROM users WHERE email = ?";
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        }
        return Optional.empty();
    }

    /**
     * Inserts a new user record into the database and sets the generated ID on the User object.
     *
     * @param user the User to insert
     * @return the same User object populated with its generated primary key ID
     * @throws SQLException if a database access error occurs
     */
    public User insert(User user) throws SQLException {
        String sql = "INSERT INTO users (name, email, password_hash, role, is_suspended) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, user.getName());
            stmt.setString(2, user.getEmail());
            stmt.setString(3, user.getPasswordHash());
            stmt.setString(4, user.getRole() != null ? user.getRole() : User.ROLE_STUDENT);
            stmt.setBoolean(5, user.isSuspended());
            stmt.executeUpdate();

            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    user.setId(keys.getLong(1));
                }
            }
        }
        if (user.getCreatedAt() == null && user.getId() != null) {
            findById(user.getId()).ifPresent(fresh -> user.setCreatedAt(fresh.getCreatedAt()));
        }
        return user;
    }
}
