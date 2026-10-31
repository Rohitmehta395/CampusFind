# CampusFind — Security Notes & JWT Rotation Policy

## 1. Authentication Architecture & Token Management
CampusFind implements stateless authentication based on JSON Web Tokens (JWT) using HMAC-SHA256 (`HS256`).
- **Secret Management:** The signing key is derived strictly from the server-side environment variable `JWT_SECRET`.
- **Token Characteristics:** Tokens encode user claims (`userId`, `role`) with an expiration period of 24 hours (`86400000 ms`).
- **Stateless Verification:** The backend does not maintain an active token session table, refresh-token chain, or centralized revocation list (token blacklist).

---

## 2. JWT Rotation Impact
Because tokens are signed statelessly using a single shared symmetric secret (`JWT_SECRET`):
- **Immediate Invalidation:** Changing or rotating `JWT_SECRET` immediately invalidates **every currently issued token** across the entire platform.
- **Client Session Disruption:** Any client presenting a token signed under the previous secret key will receive `HTTP 401 Unauthorized` (`Invalid or expired authentication token`). All active users will be required to log in again to acquire new tokens.
- **Architectural Limitation:** In the current single-instance dev/MVP design, zero-downtime rotation without forcing user re-authentication is not possible without migrating to an asymmetric key-pair model (e.g. RS256/ES256 with key ID `kid` support and JWKS endpoint) or dual-key transition windows.

---

## 3. Practical Steps for JWT Rotation
When rotating `JWT_SECRET` in local dev or production:

1. **Generate a High-Entropy Secret:**
   Ensure the new secret is at least 256 bits (32+ alphanumeric characters or a 64-character hex string).
   ```bash
   openssl rand -hex 32
   ```

2. **Update Environment Variable:**
   Set the updated secret in the operating system environment or deployment orchestrator:
   - *Windows (PowerShell):*
     ```powershell
     [Environment]::SetEnvironmentVariable("JWT_SECRET", "<new-secret-key>", "User")
     ```
   - *Linux / Docker:*
     ```bash
     export JWT_SECRET="<new-secret-key>"
     ```

3. **Restart Apache Tomcat / Application Container:**
   Restart Tomcat so the JVM picks up the new environment variable:
   ```powershell
   & "$env:CATALINA_HOME\bin\shutdown.bat"
   & "$env:CATALINA_HOME\bin\startup.bat"
   ```

4. **Client Re-authentication:**
   Notify clients/users that previous sessions have expired and prompt re-login via `POST /api/auth/login`.

---

## 4. Rate Limiting Policy
- **Login Protection:** `POST /api/auth/login` is guarded by an in-memory sliding window rate limiter (`LoginRateLimiter`) tracking failed authentication attempts per client IP address.
- **Thresholds:** A maximum of 5 failed attempts are permitted per rolling 15-minute window.
- **Lockout Enforcement:** On the 6th failed attempt and any subsequent attempt within the window, the server returns `HTTP 429 Too Many Requests` (`{"error":"Too many login attempts. Try again later."}`).
- **Pre-credential Checking:** Once tripped, the rate limiter triggers before checking credentials, blocking even correct password attempts until the window clears or counter is reset.
- **Counter Reset:** A successful login resets the failed counter for that IP immediately.

---

## 5. Baseline Security Headers
All `/api/*` endpoints set the following headers on every response:
- `X-Content-Type-Options: nosniff` — Prevents MIME-sniffing.
- `X-Frame-Options: DENY` — Prevents clickjacking and framing.
- `Referrer-Policy: strict-origin-when-cross-origin` — Protects referral leakage across domains.

