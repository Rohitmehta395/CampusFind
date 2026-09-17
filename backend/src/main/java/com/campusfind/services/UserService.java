package com.campusfind.services;

import com.campusfind.dao.UserDAO;
import com.campusfind.models.User;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

/**
 * Service layer handling user-related business operations.
 */
public class UserService {

    private final UserDAO userDAO;

    public UserService() {
        this(new UserDAO());
    }

    public UserService(UserDAO userDAO) {
        this.userDAO = userDAO;
    }

    /**
     * Retrieves all registered users in the system.
     *
     * @return a list of all users
     * @throws SQLException if a database access error occurs
     */
    public List<User> getAllUsers() throws SQLException {
        return userDAO.findAll();
    }

    /**
     * Retrieves a user by their unique identifier.
     *
     * @param id the user ID
     * @return an Optional containing the User if found, empty otherwise
     * @throws SQLException if a database access error occurs
     */
    public Optional<User> getUserById(Long id) throws SQLException {
        return userDAO.findById(id);
    }
}
