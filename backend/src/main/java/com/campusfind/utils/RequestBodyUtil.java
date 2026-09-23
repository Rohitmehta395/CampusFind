package com.campusfind.utils;

import com.campusfind.exceptions.ValidationException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;

/**
 * Shared utility for reading and parsing JSON request bodies using Jackson.
 * Maps JSON syntax and deserialization errors into ValidationException for uniform HTTP 400 responses.
 */
public final class RequestBodyUtil {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    private RequestBodyUtil() {
        // Prevent instantiation
    }

    public static ObjectMapper getMapper() {
        return MAPPER;
    }

    /**
     * Parses the JSON request body stream into the specified target class.
     *
     * @param request the HttpServletRequest
     * @param clazz   the target class to map into
     * @param <T>     the type of the target class
     * @return the deserialized object instance
     * @throws ValidationException if the body is empty, unreadable, or malformed JSON
     */
    public static <T> T parse(HttpServletRequest request, Class<T> clazz) {
        try {
            T value = MAPPER.readValue(request.getInputStream(), clazz);
            if (value == null) {
                throw new ValidationException("Request body cannot be empty", "body");
            }
            return value;
        } catch (JsonProcessingException e) {
            throw new ValidationException("Malformed JSON request body: " + e.getOriginalMessage(), "body");
        } catch (IOException e) {
            throw new ValidationException("Failed to read request body", "body");
        }
    }

    /**
     * Parses the JSON request body stream into a Jackson JsonNode tree.
     *
     * @param request the HttpServletRequest
     * @return the parsed JsonNode tree
     * @throws ValidationException if the body is empty, unreadable, or malformed JSON
     */
    public static JsonNode parseTree(HttpServletRequest request) {
        try {
            JsonNode tree = MAPPER.readTree(request.getInputStream());
            if (tree == null || tree.isNull() || tree.isEmpty()) {
                throw new ValidationException("Request body cannot be empty", "body");
            }
            return tree;
        } catch (JsonProcessingException e) {
            throw new ValidationException("Malformed JSON request body: " + e.getOriginalMessage(), "body");
        } catch (IOException e) {
            throw new ValidationException("Failed to read request body", "body");
        }
    }

    /**
     * Data Transfer Object for user registration requests.
     */
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;

        public RegisterRequest() {
        }

        public RegisterRequest(String name, String email, String password) {
            this.name = name;
            this.email = email;
            this.password = password;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    /**
     * Data Transfer Object for user login requests.
     */
    public static class LoginRequest {
        private String email;
        private String password;

        public LoginRequest() {
        }

        public LoginRequest(String email, String password) {
            this.email = email;
            this.password = password;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}

