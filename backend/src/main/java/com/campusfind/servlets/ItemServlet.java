package com.campusfind.servlets;

import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.Item;
import com.campusfind.services.ItemService;
import com.campusfind.utils.AuthUtil;
import com.campusfind.utils.JsonResponseUtil;
import com.campusfind.utils.RequestBodyUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Servlet managing lost and found item resources at /api/items.
 * Enforces authentication on POST via AuthUtil (while leaving future GET public for mixed access).
 */
@WebServlet("/api/items")
public class ItemServlet extends BaseServlet {

    private final ItemService itemService;

    public ItemServlet() {
        this(new ItemService());
    }

    public ItemServlet(ItemService itemService) {
        this.itemService = itemService;
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            // 1. Enforce authentication first via AuthUtil (throws UnauthorizedException on failure)
            Long reporterId = AuthUtil.requireAuthenticatedUserId(req);

            // 2. Parse request body into CreateItemRequest DTO
            RequestBodyUtil.CreateItemRequest dto = RequestBodyUtil.parse(req, RequestBodyUtil.CreateItemRequest.class);

            // 3. Parse optional eventDate (ISO yyyy-MM-dd)
            LocalDate eventDate = null;
            if (dto.getEventDate() != null && !dto.getEventDate().trim().isEmpty()) {
                try {
                    eventDate = LocalDate.parse(dto.getEventDate().trim());
                } catch (DateTimeParseException e) {
                    throw new ValidationException("Invalid eventDate format. Expected yyyy-MM-dd", "eventDate");
                }
            }

            // 4. Delegate to ItemService (reporterId is strictly from token, never client input)
            Item createdItem = itemService.createItem(
                    reporterId,
                    dto.getType(),
                    dto.getTitle(),
                    dto.getCategory(),
                    dto.getColor(),
                    dto.getBrand(),
                    dto.getDescription(),
                    dto.getLocationText(),
                    eventDate
            );

            // 5. Build and return 201 Created JSON response
            String json = formatItemJson(createdItem);
            JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_CREATED, json);
        });
    }

    private String formatItemJson(Item item) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":").append(item.getId()).append(",");
        sb.append("\"reporterId\":").append(item.getReporterId()).append(",");
        sb.append("\"type\":\"").append(JsonResponseUtil.escapeJson(item.getType())).append("\",");
        sb.append("\"title\":\"").append(JsonResponseUtil.escapeJson(item.getTitle())).append("\",");
        sb.append("\"category\":\"").append(JsonResponseUtil.escapeJson(item.getCategory())).append("\",");
        sb.append("\"color\":").append(item.getColor() != null ? "\"" + JsonResponseUtil.escapeJson(item.getColor()) + "\"" : "null").append(",");
        sb.append("\"brand\":").append(item.getBrand() != null ? "\"" + JsonResponseUtil.escapeJson(item.getBrand()) + "\"" : "null").append(",");
        sb.append("\"description\":").append(item.getDescription() != null ? "\"" + JsonResponseUtil.escapeJson(item.getDescription()) + "\"" : "null").append(",");
        sb.append("\"imageUrl\":").append(item.getImageUrl() != null ? "\"" + JsonResponseUtil.escapeJson(item.getImageUrl()) + "\"" : "null").append(",");
        sb.append("\"locationText\":").append(item.getLocationText() != null ? "\"" + JsonResponseUtil.escapeJson(item.getLocationText()) + "\"" : "null").append(",");
        sb.append("\"latitude\":").append(item.getLatitude() != null ? item.getLatitude().toString() : "null").append(",");
        sb.append("\"longitude\":").append(item.getLongitude() != null ? item.getLongitude().toString() : "null").append(",");
        sb.append("\"eventDate\":").append(item.getEventDate() != null ? "\"" + item.getEventDate().toString() + "\"" : "null").append(",");
        sb.append("\"status\":\"").append(JsonResponseUtil.escapeJson(item.getStatus())).append("\",");
        String createdAtStr = (item.getCreatedAt() != null)
                ? item.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : "";
        sb.append("\"createdAt\":\"").append(JsonResponseUtil.escapeJson(createdAtStr)).append("\"");
        sb.append("}");
        return sb.toString();
    }
}
