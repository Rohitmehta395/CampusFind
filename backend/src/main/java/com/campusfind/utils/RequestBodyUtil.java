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

    /**
     * Data Transfer Object for item creation requests.
     * Note: reporterId is intentionally omitted so client payloads cannot override it.
     */
    public static class CreateItemRequest {
        private String type;
        private String title;
        private String category;
        private String color;
        private String brand;
        private String description;
        private String imageUrl;
        private String locationText;
        private String eventDate; // ISO yyyy-MM-dd format

        public CreateItemRequest() {
        }

        public CreateItemRequest(String type, String title, String category, String color,
                                 String brand, String description, String locationText, String eventDate) {
            this(type, title, category, color, brand, description, null, locationText, eventDate);
        }

        public CreateItemRequest(String type, String title, String category, String color,
                                 String brand, String description, String imageUrl,
                                 String locationText, String eventDate) {
            this.type = type;
            this.title = title;
            this.category = category;
            this.color = color;
            this.brand = brand;
            this.description = description;
            this.imageUrl = imageUrl;
            this.locationText = locationText;
            this.eventDate = eventDate;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getColor() {
            return color;
        }

        public void setColor(String color) {
            this.color = color;
        }

        public String getBrand() {
            return brand;
        }

        public void setBrand(String brand) {
            this.brand = brand;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getImageUrl() {
            return imageUrl;
        }

        public void setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
        }

        public String getLocationText() {
            return locationText;
        }

        public void setLocationText(String locationText) {
            this.locationText = locationText;
        }

        public String getEventDate() {
            return eventDate;
        }

        public void setEventDate(String eventDate) {
            this.eventDate = eventDate;
        }
    }
}

