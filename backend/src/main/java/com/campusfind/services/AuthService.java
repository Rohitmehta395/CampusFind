package com.campusfind.services;

import com.campusfind.dao.UserDAO;
import com.campusfind.exceptions.ConflictException;
import com.campusfind.exceptions.UnauthorizedException;
import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.User;
import com.campusfind.utils.PasswordUtil;

import java.sql.SQLException;
import java.util.Optional;

/**
 * Service handling authentication operations including user registration and credential management.
 */
public class AuthService {

    private final UserDAO userDAO;

    public AuthService() {
        this(new UserDAO());
    }

    public AuthService(UserDAO userDAO) {
        this.userDAO = userDAO;
    }

    /**
     * Registers a new student user in the system.
     * Validates input fields, checks for duplicate email, hashes the password with BCrypt,
     * and persists the user record.
     *
     * @param name          the user's full name
     * @param email         the user's email address
     * @param plainPassword the user's plaintext password
     * @return the created User entity with its generated database ID
     * @throws ValidationException if input validation fails
     * @throws ConflictException   if an account with the email already exists
     * @throws SQLException        if a database access error occurs
     */
    public User register(String name, String email, String plainPassword) throws SQLException {
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Name is required", "name");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new ValidationException("Email is required", "email");
        }
        String normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail.contains("@") || !normalizedEmail.contains(".")) {
            throw new ValidationException("A valid email address is required", "email");
        }
        if (plainPassword == null || plainPassword.isEmpty()) {
            throw new ValidationException("Password is required", "password");
        }
        if (plainPassword.length() < 8) {
            throw new ValidationException("Password must be at least 8 characters", "password");
        }

        // Check for duplicate email
        if (userDAO.findByEmail(normalizedEmail).isPresent()) {
            throw new ConflictException("An account with this email already exists");
        }

        // Hash password securely with BCrypt (no logging of raw password)
        String hashedPassword = PasswordUtil.hash(plainPassword);

        // Build User entity. Role is hardcoded to STUDENT for public registration.
        User user = new User();
        user.setName(name.trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(hashedPassword);
        user.setRole(User.ROLE_STUDENT);
        user.setSuspended(false);

        return userDAO.insert(user);
    }

    /**
     * Authenticates a user with email and plaintext password.
     * Throws identical UnauthorizedException on non-existent email or invalid password
     * to prevent account enumeration.
     *
     * @param email         the user's email address
     * @param plainPassword the user's plaintext password
     * @return the authenticated User entity
     * @throws UnauthorizedException if credentials are invalid or the account is suspended
     * @throws SQLException        if a database access error occurs
     */
    public User authenticate(String email, String plainPassword) throws SQLException {
        if (email == null || email.trim().isEmpty() || plainPassword == null || plainPassword.isEmpty()) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String normalizedEmail = email.trim().toLowerCase();
        Optional<User> userOpt = userDAO.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            throw new UnauthorizedException("Invalid email or password");
        }

        User user = userOpt.get();

        if (user.isSuspended()) {
            throw new UnauthorizedException("Account is suspended");
        }

        if (!PasswordUtil.verify(plainPassword, user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        return user;
    }
}

