package com.campusfind.servlets;

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
 * Servlet handling ownership claim submissions at /api/claims.
 * Requires authenticated access for claim submission.
 */
@WebServlet("/api/claims")
public class ClaimServlet extends BaseServlet {

    private final ClaimService claimService;

    public ClaimServlet() {
        this(new ClaimService());
    }

    public ClaimServlet(ClaimService claimService) {
        this.claimService = claimService;
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handle(request, response, (req, res) -> {
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
}
