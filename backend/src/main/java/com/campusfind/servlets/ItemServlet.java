package com.campusfind.servlets;

import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.Item;
import com.campusfind.models.Match;
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
import java.util.List;

/**
 * Servlet managing lost and found item resources at /api/items and /api/items/*.
 * Supports public browsing (GET /api/items, GET /api/items/{id}), authenticated user items (GET /api/items/mine),
 * and authenticated item creation (POST /api/items).
 */
@WebServlet(urlPatterns = {"/api/items", "/api/items/*"})
public class ItemServlet extends BaseServlet {

    private final ItemService itemService;

    public ItemServlet() {
        this(new ItemService());
    }

    public ItemServlet(ItemService itemService) {
        this.itemService = itemService;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            String pathInfo = req.getPathInfo();

            if (pathInfo == null || pathInfo.equals("/") || pathInfo.isEmpty()) {
                // GET /api/items -> public list of items with search, filter, and pagination
                String q = req.getParameter("q");
                String category = req.getParameter("category");
                String type = req.getParameter("type");
                String status = req.getParameter("status");

                Integer page = null;
                String pageStr = req.getParameter("page");
                if (pageStr != null && !pageStr.trim().isEmpty()) {
                    try {
                        page = Integer.parseInt(pageStr.trim());
                    } catch (NumberFormatException ignored) {
                        // Fall back to default page 1 gracefully
                    }
                }

                Integer limit = null;
                String limitStr = req.getParameter("limit");
                if (limitStr != null && !limitStr.trim().isEmpty()) {
                    try {
                        limit = Integer.parseInt(limitStr.trim());
                    } catch (NumberFormatException ignored) {
                        // Fall back to default limit gracefully
                    }
                }

                ItemService.PagedResult result = itemService.getFilteredItems(q, category, type, status, page, limit);
                String json = formatPagedItemListJson(result);
                JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, json);
            } else if ("/mine".equalsIgnoreCase(pathInfo.trim())) {
                // GET /api/items/mine -> authenticated caller's own reported items
                Long reporterId = AuthUtil.requireAuthenticatedUserId(req);
                List<Item> items = itemService.getItemsByReporter(reporterId);
                String json = formatItemListJson(items);
                JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, json);
            } else if (pathInfo.trim().matches("^/\\d+/matches/?$")) {
                // GET /api/items/{id}/matches -> matches involving item {id}, restricted to item's reporter
                String trimmed = pathInfo.trim();
                String[] parts = trimmed.split("/");
                Long itemId = Long.parseLong(parts[1]);
                Long authenticatedUserId = AuthUtil.requireAuthenticatedUserId(req);
                List<ItemService.ItemMatchView> matchViews = itemService.getMatchesForItem(itemId, authenticatedUserId);
                String json = formatMatchesJson(itemId, matchViews);
                JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, json);
            } else {
                // GET /api/items/{id} -> single item detail, 404 if not found
                String idStr = pathInfo.startsWith("/") ? pathInfo.substring(1).trim() : pathInfo.trim();
                Long itemId;
                try {
                    itemId = Long.parseLong(idStr);
                } catch (NumberFormatException e) {
                    throw new ValidationException("Invalid item id", "id");
                }

                Item item = itemService.getItemById(itemId);
                String json = formatItemJson(item);
                JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, json);
            }
        });
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
                    dto.getImageUrl(),
                    dto.getLocationText(),
                    eventDate
            );

            // 5. Build and return 201 Created JSON response
            String json = formatItemJson(createdItem);
            JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_CREATED, json);
        });
    }

    private String formatPagedItemListJson(ItemService.PagedResult result) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"items\":[");
        List<Item> items = result.getItems();
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) {
                sb.append(",");
            }
            sb.append(formatItemJson(items.get(i)));
        }
        sb.append("],");
        sb.append("\"page\":").append(result.getPage()).append(",");
        sb.append("\"limit\":").append(result.getLimit()).append(",");
        sb.append("\"total\":").append(result.getTotal()).append(",");
        sb.append("\"totalPages\":").append(result.getTotalPages());
        sb.append("}");
        return sb.toString();
    }

    private String formatItemListJson(List<Item> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"items\":[");
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) {
                sb.append(",");
            }
            sb.append(formatItemJson(items.get(i)));
        }
        sb.append("]}");
        return sb.toString();
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

    private String formatMatchesJson(Long itemId, List<ItemService.ItemMatchView> views) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"itemId\":").append(itemId).append(",");
        sb.append("\"totalMatches\":").append(views.size()).append(",");
        sb.append("\"matches\":[");
        for (int i = 0; i < views.size(); i++) {
            if (i > 0) {
                sb.append(",");
            }
            ItemService.ItemMatchView view = views.get(i);
            Match m = view.getMatch();
            Item other = view.getMatchedItem();

            sb.append("{");
            sb.append("\"id\":").append(m.getId()).append(",");
            sb.append("\"score\":").append(m.getScore()).append(",");
            sb.append("\"status\":\"").append(JsonResponseUtil.escapeJson(m.getStatus())).append("\",");
            String createdAtStr = (m.getCreatedAt() != null)
                    ? m.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                    : "";
            sb.append("\"createdAt\":\"").append(JsonResponseUtil.escapeJson(createdAtStr)).append("\",");

            sb.append("\"subScores\":{");
            sb.append("\"category\":").append(m.getCategoryScore() != null ? m.getCategoryScore().toString() : "null").append(",");
            sb.append("\"color\":").append(m.getColorScore() != null ? m.getColorScore().toString() : "null").append(",");
            sb.append("\"brand\":").append(m.getBrandScore() != null ? m.getBrandScore().toString() : "null").append(",");
            sb.append("\"text\":").append(m.getTextScore() != null ? m.getTextScore().toString() : "null").append(",");
            sb.append("\"date\":").append(m.getDateScore() != null ? m.getDateScore().toString() : "null").append(",");
            sb.append("\"image\":").append(m.getImageScore() != null ? m.getImageScore().toString() : "null").append(",");
            sb.append("\"location\":").append(m.getLocationScore() != null ? m.getLocationScore().toString() : "null");
            sb.append("},");

            sb.append("\"matchedItem\":");
            if (other != null) {
                sb.append("{");
                sb.append("\"id\":").append(other.getId()).append(",");
                sb.append("\"type\":\"").append(JsonResponseUtil.escapeJson(other.getType())).append("\",");
                sb.append("\"title\":\"").append(JsonResponseUtil.escapeJson(other.getTitle())).append("\",");
                sb.append("\"category\":\"").append(JsonResponseUtil.escapeJson(other.getCategory())).append("\",");
                sb.append("\"color\":").append(other.getColor() != null ? "\"" + JsonResponseUtil.escapeJson(other.getColor()) + "\"" : "null").append(",");
                sb.append("\"brand\":").append(other.getBrand() != null ? "\"" + JsonResponseUtil.escapeJson(other.getBrand()) + "\"" : "null").append(",");
                sb.append("\"imageUrl\":").append(other.getImageUrl() != null ? "\"" + JsonResponseUtil.escapeJson(other.getImageUrl()) + "\"" : "null").append(",");
                sb.append("\"locationText\":").append(other.getLocationText() != null ? "\"" + JsonResponseUtil.escapeJson(other.getLocationText()) + "\"" : "null").append(",");
                sb.append("\"eventDate\":").append(other.getEventDate() != null ? "\"" + other.getEventDate().toString() + "\"" : "null");
                sb.append("}");
            } else {
                sb.append("null");
            }

            sb.append("}");
        }
        sb.append("]}");
        return sb.toString();
    }
}
