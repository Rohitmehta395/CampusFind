package com.campusfind.servlets;

import com.campusfind.dao.ConversationDAO;
import com.campusfind.exceptions.NotFoundException;
import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.Conversation;
import com.campusfind.models.Message;
import com.campusfind.models.User;
import com.campusfind.services.ConversationService;
import com.campusfind.services.MessageService;
import com.campusfind.utils.AuthUtil;
import com.campusfind.utils.JsonResponseUtil;
import com.campusfind.utils.RequestBodyUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Servlet handling conversations and messaging at /api/conversations and /api/conversations/*.
 *
 * Endpoints:
 * - POST /api/conversations: Start conversation (idempotent)
 * - GET  /api/conversations: List user's conversations
 * - GET  /api/conversations/{id}/messages: Read conversation messages (paginated, ascending)
 * - POST /api/conversations/{id}/messages: Send message in conversation
 * - PATCH /api/conversations/{id}/messages/read: Mark conversation read
 */
@WebServlet(urlPatterns = {"/api/conversations", "/api/conversations/*"})
public class ConversationServlet extends BaseServlet {

    private final ConversationService conversationService;
    private final MessageService messageService;

    public ConversationServlet() {
        this(new ConversationService(), new MessageService());
    }

    public ConversationServlet(ConversationService conversationService, MessageService messageService) {
        this.conversationService = conversationService;
        this.messageService = messageService;
    }

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if ("PATCH".equalsIgnoreCase(req.getMethod())) {
            doPatch(req, resp);
        } else {
            super.service(req, resp);
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            Long callerId = AuthUtil.requireActiveUser(req).getId();
            String pathInfo = req.getPathInfo();

            if (pathInfo == null || pathInfo.isEmpty() || pathInfo.equals("/")) {
                // GET /api/conversations
                List<ConversationDAO.ConversationSummary> summaries = conversationService.getConversationsForUser(callerId);
                String json = formatConversationListJson(summaries);
                JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, json);
            } else if (pathInfo.matches("^/\\d+/messages/?$")) {
                // GET /api/conversations/{id}/messages
                String[] parts = pathInfo.trim().split("/");
                Long conversationId = parseLongId(parts[1], "id");

                Integer page = parseOptionalInt(req.getParameter("page"));
                Integer limit = parseOptionalInt(req.getParameter("limit"));

                MessageService.PagedMessages paged = messageService.getMessages(conversationId, callerId, page, limit);
                String json = formatPagedMessagesJson(paged);
                JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, json);
            } else if (pathInfo.matches("^/[^/]+/messages/?$")) {
                // Non-numeric conversation ID
                String[] parts = pathInfo.trim().split("/");
                parseLongId(parts[1], "id");
            } else {
                throw new NotFoundException("Endpoint not found");
            }
        });
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            Long callerId = AuthUtil.requireActiveUser(req).getId();
            String pathInfo = req.getPathInfo();

            if (pathInfo == null || pathInfo.isEmpty() || pathInfo.equals("/")) {
                // POST /api/conversations
                RequestBodyUtil.StartConversationRequest dto = RequestBodyUtil.parse(req, RequestBodyUtil.StartConversationRequest.class);
                if (dto.getOtherUserId() == null) {
                    throw new ValidationException("otherUserId is required", "otherUserId");
                }

                ConversationService.StartConversationResult result =
                        conversationService.getOrCreateConversation(callerId, dto.getOtherUserId(), dto.getItemId());

                String json = formatStartConversationJson(result.getConversation(), result.getOtherUser());
                int status = result.isNewlyCreated() ? HttpServletResponse.SC_CREATED : HttpServletResponse.SC_OK;
                JsonResponseUtil.writeSuccess(res, status, json);
            } else if (pathInfo.matches("^/\\d+/messages/?$")) {
                // POST /api/conversations/{id}/messages
                String[] parts = pathInfo.trim().split("/");
                Long conversationId = parseLongId(parts[1], "id");

                RequestBodyUtil.SendMessageRequest dto = RequestBodyUtil.parse(req, RequestBodyUtil.SendMessageRequest.class);
                Message msg = messageService.sendMessage(conversationId, callerId, dto.getText());

                String json = formatMessageJson(msg);
                JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_CREATED, json);
            } else if (pathInfo.matches("^/[^/]+/messages/?$")) {
                // Non-numeric conversation ID
                String[] parts = pathInfo.trim().split("/");
                parseLongId(parts[1], "id");
            } else {
                throw new NotFoundException("Endpoint not found");
            }
        });
    }

    protected void doPatch(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            Long callerId = AuthUtil.requireActiveUser(req).getId();
            String pathInfo = req.getPathInfo();

            if (pathInfo != null && pathInfo.matches("^/\\d+/messages/read/?$")) {
                // PATCH /api/conversations/{id}/messages/read
                String[] parts = pathInfo.trim().split("/");
                Long conversationId = parseLongId(parts[1], "id");

                int updatedCount = messageService.markConversationRead(conversationId, callerId);
                String json = "{\"updated\":" + updatedCount + "}";
                JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, json);
            } else if (pathInfo != null && pathInfo.matches("^/[^/]+/messages/read/?$")) {
                // Non-numeric conversation ID
                String[] parts = pathInfo.trim().split("/");
                parseLongId(parts[1], "id");
            } else {
                throw new NotFoundException("Endpoint not found");
            }
        });
    }

    private Long parseLongId(String val, String fieldName) {
        try {
            return Long.parseLong(val);
        } catch (NumberFormatException e) {
            throw new ValidationException("Invalid " + fieldName, fieldName);
        }
    }

    private Integer parseOptionalInt(String val) {
        if (val == null || val.trim().isEmpty()) {
            return null;
        }
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String quote(String s) {
        if (s == null) {
            return "null";
        }
        return "\"" + JsonResponseUtil.escapeJson(s) + "\"";
    }

    private String formatStartConversationJson(Conversation c, User otherUser) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":").append(c.getId()).append(",");
        sb.append("\"otherUser\":{");
        sb.append("\"id\":").append(otherUser.getId()).append(",");
        sb.append("\"name\":").append(quote(otherUser.getName())).append(",");
        sb.append("\"email\":").append(quote(otherUser.getEmail()));
        sb.append("},");
        sb.append("\"itemId\":").append(c.getItemId() != null ? c.getItemId() : "null").append(",");
        String createdAtStr = (c.getCreatedAt() != null)
                ? c.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : "";
        sb.append("\"createdAt\":").append(quote(createdAtStr));
        sb.append("}");
        return sb.toString();
    }

    private String formatConversationListJson(List<ConversationDAO.ConversationSummary> summaries) {
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < summaries.size(); i++) {
            if (i > 0) sb.append(",");
            ConversationDAO.ConversationSummary s = summaries.get(i);
            sb.append("{");
            sb.append("\"id\":").append(s.getId()).append(",");
            sb.append("\"otherUser\":{");
            sb.append("\"id\":").append(s.getOtherUserId()).append(",");
            sb.append("\"name\":").append(quote(s.getOtherUserName())).append(",");
            sb.append("\"email\":").append(quote(s.getOtherUserEmail()));
            sb.append("},");
            sb.append("\"itemId\":").append(s.getItemId() != null ? s.getItemId() : "null").append(",");

            if (s.getLastMessageText() != null) {
                sb.append("\"lastMessage\":{");
                sb.append("\"text\":").append(quote(s.getLastMessageText())).append(",");
                sb.append("\"senderId\":").append(s.getLastMessageSenderId()).append(",");
                String lmsgTs = (s.getLastMessageCreatedAt() != null)
                        ? s.getLastMessageCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                        : "";
                sb.append("\"createdAt\":").append(quote(lmsgTs));
                sb.append("},");
            } else {
                sb.append("\"lastMessage\":null,");
            }

            sb.append("\"unreadCount\":").append(s.getUnreadCount()).append(",");
            String convTs = (s.getCreatedAt() != null)
                    ? s.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                    : "";
            sb.append("\"createdAt\":").append(quote(convTs));
            sb.append("}");
        }
        sb.append("]");
        return sb.toString();
    }

    private String formatMessageJson(Message m) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":").append(m.getId()).append(",");
        sb.append("\"conversationId\":").append(m.getConversationId()).append(",");
        sb.append("\"senderId\":").append(m.getSenderId()).append(",");
        sb.append("\"text\":").append(quote(m.getText())).append(",");
        sb.append("\"isRead\":").append(m.isRead()).append(",");
        String ts = (m.getCreatedAt() != null)
                ? m.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : "";
        sb.append("\"createdAt\":").append(quote(ts));
        sb.append("}");
        return sb.toString();
    }

    private String formatPagedMessagesJson(MessageService.PagedMessages paged) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"messages\":[");
        List<Message> list = paged.getMessages();
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(formatMessageJson(list.get(i)));
        }
        sb.append("],");
        sb.append("\"page\":").append(paged.getPage()).append(",");
        sb.append("\"limit\":").append(paged.getLimit()).append(",");
        sb.append("\"total\":").append(paged.getTotal()).append(",");
        sb.append("\"totalPages\":").append(paged.getTotalPages());
        sb.append("}");
        return sb.toString();
    }
}
