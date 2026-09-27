package com.campusfind.servlets;

import com.campusfind.exceptions.NotFoundException;
import com.campusfind.exceptions.ValidationException;
import com.campusfind.models.Claim;
import com.campusfind.services.ClaimService;
import com.campusfind.utils.AuthUtil;
import com.campusfind.utils.JsonResponseUtil;
import com.campusfind.utils.RequestBodyUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Servlet handling ownership claim submissions and reviews at /api/claims and /api/claims/*.
 * - POST /api/claims: authenticated submission of a new claim against an active item.
 * - PATCH /api/claims/{id}: authenticated review (approval/rejection) of a claim by the item's reporter.
 */
@WebServlet(urlPatterns = {"/api/claims", "/api/claims/*"})
public class ClaimServlet extends BaseServlet {

    private final ClaimService claimService;

    public ClaimServlet() {
        this(new ClaimService());
    }

    public ClaimServlet(ClaimService claimService) {
        this.claimService = claimService;
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
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            String pathInfo = req.getPathInfo();
            if (pathInfo != null && !pathInfo.trim().isEmpty() && !pathInfo.trim().equals("/")) {
                throw new NotFoundException("Endpoint not found");
            }

            // 1. Enforce authentication; claimantId is strictly obtained from verified JWT
            Long claimantId = AuthUtil.requireAuthenticatedUserId(req);

            // 2. Parse request payload into CreateClaimRequest DTO
            RequestBodyUtil.CreateClaimRequest dto = RequestBodyUtil.parse(req, RequestBodyUtil.CreateClaimRequest.class);

            // 3. Delegate to ClaimService for validation and database insertion
            Claim createdClaim = claimService.submitClaim(claimantId, dto.getItemId(), dto.getEvidenceText());

            // 4. Return 201 Created JSON response (evidenceText is intentionally omitted from response)
            String json = formatClaimJson(createdClaim);
            JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_CREATED, json);
        });
    }

    protected void doPatch(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
            // 1. Enforce authentication; reviewerId is strictly from verified JWT
            Long reviewerId = AuthUtil.requireAuthenticatedUserId(req);

            // 2. Parse claim ID from pathInfo ("/1" -> 1)
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.trim().isEmpty() || pathInfo.trim().equals("/")) {
                throw new ValidationException("Claim ID is required in URL path", "id");
            }

            String idStr = pathInfo.startsWith("/") ? pathInfo.substring(1).trim() : pathInfo.trim();
            Long claimId;
            try {
                claimId = Long.parseLong(idStr);
            } catch (NumberFormatException e) {
                throw new ValidationException("Invalid claim id", "id");
            }

            // 3. Parse request payload into ReviewClaimRequest DTO
            RequestBodyUtil.ReviewClaimRequest dto = RequestBodyUtil.parse(req, RequestBodyUtil.ReviewClaimRequest.class);
            if (dto.getDecision() == null || dto.getDecision().trim().isEmpty()) {
                throw new ValidationException("Decision is required (APPROVED or REJECTED)", "decision");
            }

            String dec = dto.getDecision().trim().toUpperCase();
            boolean approve;
            if ("APPROVED".equals(dec)) {
                approve = true;
            } else if ("REJECTED".equals(dec)) {
                approve = false;
            } else {
                throw new ValidationException("Invalid decision: " + dto.getDecision() + ". Expected APPROVED or REJECTED", "decision");
            }

            // 4. Delegate to ClaimService
            Claim updatedClaim = claimService.reviewClaim(claimId, reviewerId, approve);

            // 5. Format and return 200 OK JSON response
            String json = formatClaimReviewJson(updatedClaim);
            JsonResponseUtil.writeSuccess(res, HttpServletResponse.SC_OK, json);
        });
    }

    private String quote(String s) {
        if (s == null) {
            return "null";
        }
        return "\"" + JsonResponseUtil.escapeJson(s) + "\"";
    }

    /**
     * Formats the created Claim as JSON.
     * Note: evidenceText is intentionally omitted to avoid echoing back sensitive user details.
     */
    private String formatClaimJson(Claim claim) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":").append(claim.getId()).append(",");
        sb.append("\"itemId\":").append(claim.getItemId()).append(",");
        sb.append("\"claimantId\":").append(claim.getClaimantId()).append(",");
        sb.append("\"status\":").append(quote(claim.getStatus())).append(",");
        sb.append("\"createdAt\":").append(claim.getCreatedAt() != null ? quote(claim.getCreatedAt().toString()) : "null");
        sb.append("}");
        return sb.toString();
    }

    /**
     * Formats the reviewed Claim as JSON.
     * Note: includes reviewer information and timestamps; evidenceText is omitted.
     */
    private String formatClaimReviewJson(Claim claim) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":").append(claim.getId()).append(",");
        sb.append("\"itemId\":").append(claim.getItemId()).append(",");
        sb.append("\"claimantId\":").append(claim.getClaimantId()).append(",");
        sb.append("\"status\":").append(quote(claim.getStatus())).append(",");
        sb.append("\"reviewedBy\":").append(claim.getReviewedBy() != null ? claim.getReviewedBy() : "null").append(",");
        sb.append("\"createdAt\":").append(claim.getCreatedAt() != null ? quote(claim.getCreatedAt().toString()) : "null").append(",");
        sb.append("\"reviewedAt\":").append(claim.getReviewedAt() != null ? quote(claim.getReviewedAt().toString()) : "null");
        sb.append("}");
        return sb.toString();
    }
}
