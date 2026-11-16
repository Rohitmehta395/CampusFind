# CampusFind — Backend Architecture & Data Flow Guide

> **Audience:** Anyone wanting to understand how the CampusFind backend works, its technology stack, its layered architecture, and how it securely processes requests from the frontend and interacts with MySQL.

---

## 1. Executive Summary: What is CampusFind Backend?

The **CampusFind Backend** is a high-performance, secure web application built in **Java 21** and hosted on the **Apache Tomcat** web server. 

While the frontend runs in the user's browser, the backend acts as the central brain and gatekeeper:
- **It Authenticates Users:** Verifies login credentials using **BCrypt** hashing and issues stateless **JSON Web Tokens (JWT)**.
- **It Enforces Business Rules:** Checks permissions (e.g., *"Only the finder can approve a claim"* or *"Only admins can ban users"*).
- **It Runs the Smart Matching Engine:** When an item is reported, it computes similarity scores between lost and found items using multi-factor algorithms (perceptual image hashing, text matching, and geolocation proximity).
- **It Interfaces with the Database:** Securely reads from and writes to the **MySQL** relational database using raw **JDBC** and parameterized SQL queries.

---

## 2. Backend Technology Stack & Why It Was Chosen

| Technology | Role in Backend | Why We Chose It |
|---|---|---|
| **Java 21 (LTS)** | Core Language | Robust, statically-typed, enterprise-grade language with modern virtual threads and performance optimizations. |
| **Jakarta Servlet 6.0** | Web Framework | Direct HTTP request/response handling on Jakarta EE 10 without hidden framework "magic." Ideal for college project viva defense. |
| **Apache Tomcat 10.1+** | Servlet Container / Server | Industry-standard web container that hosts and executes Java Servlets and Filters. |
| **Raw JDBC (`mysql-connector-j`)** | Database Access | Eliminates the heavy complexity and debugging overhead of ORMs like Hibernate; raw SQL with `PreparedStatement` gives 100% control and zero SQL injection risk. |
| **MySQL 8.0+** | Relational Database | Enforces relational integrity (Foreign Keys, ACID transactions) between items, users, claims, and notifications. |
| **JJWT (`jjwt-api 0.11.5`)** | Token Security | Generates and verifies HMAC-SHA256 signed JWT tokens for stateless authentication. |
| **jBCrypt (`0.4`)** | Password Hashing | Industry-standard slow cryptographic hashing algorithm with automated per-user salting. |
| **Jackson Databind (`2.19.2`)** | JSON Serialization | Converts incoming JSON request bodies into Java DTOs and serializes Java models into JSON HTTP responses. |
| **Apache Maven** | Build & Dependency Management | Manages external libraries and compiles the application into a deployable `.war` file (`campusfind-backend.war`). |

---

## 3. High-Level Backend Architecture (Modular Layered Monolith)

The backend follows a **Clean 5-Tier Architecture**. Each layer has a strict single responsibility and never skips layers:

```
                      HTTP REST Request (from React Frontend)
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │                   FILTER TIER                    │
             │   1. CorsFilter: Allows React frontend headers   │
             │   2. AuthFilter: Validates JWT Bearer tokens     │
             └────────────────────────┬─────────────────────────┘
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │                  SERVLET TIER                    │
             │  Controllers parsing JSON input & HTTP verbs:    │
             │  • ItemServlet       • LoginServlet              │
             │  • ClaimServlet      • ConversationServlet       │
             │  • AdminServlet      • NotificationServlet       │
             └────────────────────────┬─────────────────────────┘
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │                  SERVICE TIER                    │
             │  Enforces business rules, transactions & logic:  │
             │  • ItemService       • AuthService               │
             │  • ClaimService      • NotificationService       │
             │  • MatchingEngine (Image/Location/Text scoring)  │
             └────────────────────────┬─────────────────────────┘
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │                    DAO TIER                      │
             │  (Data Access Object / Repository Layer)         │
             │  • Parameterized SQL queries (PreparedStatement) │
             │  • ItemDAO, UserDAO, ClaimDAO, MatchDAO          │
             └────────────────────────┬─────────────────────────┘
                                      │ JDBC Connection
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │                 DATABASE TIER                    │
             │                 MySQL Database                   │
             │    (users, items, claims, matches, messages)     │
             └──────────────────────────────────────────────────┘
```

---

## 4. Backend Package Structure Explained

Inside `backend/src/main/java/com/campusfind/`:

```
com.campusfind/
├── filters/         # HTTP interceptors running before servlets
│   ├── CorsFilter.java       # Configures Access-Control headers for React
│   └── AuthFilter.java       # Extracts Bearer token, validates JWT, attaches user
├── servlets/        # Web controllers handling HTTP routes
│   ├── BaseServlet.java      # Shared JSON error handling and helper methods
│   ├── LoginServlet.java     # POST /api/auth/login
│   ├── RegisterServlet.java  # POST /api/auth/register
│   ├── MeServlet.java        # GET /api/auth/me (current user profile)
│   ├── ItemServlet.java      # GET, POST, PUT, DELETE /api/items/*
│   ├── ClaimServlet.java     # POST, GET, PATCH /api/claims/*
│   ├── ConversationServlet.java # Chat threads & messages
│   ├── NotificationServlet.java # Notification polling & mark-read
│   └── AdminServlet.java     # Moderation and system metrics
├── services/        # Business logic & workflow management
│   ├── AuthService.java      # User verification and JWT creation
│   ├── ItemService.java      # Item validations, triggers smart matching
│   ├── ClaimService.java     # Verification workflows, status transitions
│   ├── NotificationService.java # Writes notification records
│   ├── ConversationService.java # Messaging rules and threads
│   └── AdminService.java     # User suspension, item removal
├── matching/        # The Smart Matching Engine (Independent Subsystem)
│   ├── MatchingEngine.java   # Orchestrates candidate retrieval & scoring
│   ├── MatchScorer.java      # Evaluates category, date, brand, text scores
│   ├── LocationScorer.java   # Haversine distance calculations
│   └── ImageHasher.java      # Perceptual dHash computation for visual matching
├── dao/             # Data Access Objects (Only layer writing SQL)
│   ├── UserDAO.java          # users table queries
│   ├── ItemDAO.java          # items table queries (search, filter, pagination)
│   ├── ClaimDAO.java         # claims table operations
│   ├── MatchDAO.java         # matches table operations
│   ├── MessageDAO.java       # messages table operations
│   └── NotificationDAO.java  # notifications table operations
├── models/          # Plain Java POJOs (Entities)
│   ├── User.java, Item.java, Claim.java, Match.java, Message.java, Notification.java
├── exceptions/      # Standardized HTTP error exceptions
│   ├── ValidationException.java  # Maps to 400 Bad Request
│   ├── UnauthorizedException.java# Maps to 401 Unauthorized
│   ├── ForbiddenException.java   # Maps to 403 Forbidden
│   ├── NotFoundException.java    # Maps to 404 Not Found
│   └── ConflictException.java    # Maps to 409 Conflict
└── utils/           # Shared helper utilities
    ├── DBConnectionUtil.java # Manages JDBC connection lifecycle
    ├── JwtUtil.java          # JWT signing, parsing, and claims extraction
    ├── PasswordUtil.java     # BCrypt password hashing and verification
    ├── JsonResponseUtil.java # Formats consistent JSON API outputs
    ├── RequestBodyUtil.java  # Deserializes JSON payloads with Jackson
    └── LoginRateLimiter.java # Memory-based IP rate limiter to stop brute-force
```

---

## 5. The Journey of an HTTP Request (Lifecycle)

Let's follow what happens when the frontend calls `POST /api/items` to post a lost or found item:

```
1. React Frontend sends HTTP POST with JSON body + Header "Authorization: Bearer <token>"
   │
2. CorsFilter intercepts request:
   - Validates origin, sets Access-Control-Allow-Origin, allows OPTIONS preflight.
   │
3. AuthFilter intercepts request:
   - Extracts "Bearer <token>" from Authorization header.
   - JwtUtil.validateToken() verifies digital signature and expiration.
   - Extracts userId & role; attaches AuthenticatedUser object to HttpServletRequest.
   │
4. ItemServlet.doPost() runs:
   - Reads JSON body using RequestBodyUtil.
   - Retrieves authenticated userId from request attribute.
   - Calls itemService.createItem(dto, userId).
   │
5. ItemService.createItem() executes business rules:
   - Validates mandatory fields (title, category, coordinates, image URL).
   - Sanitizes input strings.
   - Calls itemDAO.insert(item).
   │
6. ItemDAO.insert() talks to MySQL:
   - Obtains Connection from DBConnectionUtil.
   - Executes PreparedStatement:
     "INSERT INTO items (user_id, title, category, type, image_url, lat, lng, ...) VALUES (?, ?, ?, ?, ?, ?, ?)"
   - Returns generated auto-increment itemId.
   │
7. ItemService hands off to MatchingEngine:
   - Calls matchingEngine.evaluateItem(newItem).
   - Engine queries MySQL for opposite candidates (LOST vs FOUND).
   - Generates match rows with scores in MySQL if similarity >= 60%.
   │
8. Response returned to Client:
   - JsonResponseUtil writes HTTP 201 Created with clean JSON response.
   - React frontend displays success message and matched items!
```

---

## 6. Core Subsystems Deep Dive

### A. Authentication & Security Pipeline
- **Password Protection (`PasswordUtil.java`):**
  Uses `BCrypt.hashpw(plainTextPassword, BCrypt.gensalt(12))`. Raw passwords are never stored in MySQL.
- **Stateless Tokens (`JwtUtil.java`):**
  Generates an HMAC-SHA256 signed token containing `userId`, `role`, and expiration time (e.g., 24 hours). The server does not keep session files in memory, making it fast and scalable.
- **Brute-Force Protection (`LoginRateLimiter.java`):**
  Tracks failed login attempts per client IP address. After 5 consecutive failures, the IP is temporarily throttled to block automated credential-stuffing attacks.

---

### B. The Smart Matching Engine (Core Innovation)

The matching engine (`com.campusfind.matching`) solves the fundamental problem of CampusFind: automatically pairing a reported lost item with a reported found item.

When an item is posted, `MatchingEngine` fetches potential candidates within a **$\pm 14$-day window** and calculates a **weighted multi-signal score (0.00 to 1.00)**:

```
Final Score = 
    (0.30 × ImageScore) +
    (0.15 × CategoryScore) +
    (0.15 × TextScore) +
    (0.10 × BrandScore) +
    (0.10 × ColorScore) +
    (0.10 × LocationScore) +
    (0.10 × DateScore)
```

1. **Category Signal (15%):** Must match or belong to a compatible category.
2. **Perceptual Image Hash (30% - `ImageHasher.java`):** Downloads and computes a 64-bit difference hash (dHash) of images. Compares visual structures regardless of resizing or slight lighting shifts using Hamming distance.
3. **Text & Keyword Similarity (15%):** Tokenizes titles and descriptions, strips common stop-words, and calculates word overlap (Jaccard similarity).
4. **Brand & Color Similarity (20% total):** Compares normalized brand strings and recognized campus color palettes.
5. **Geolocation Distance (10% - `LocationScorer.java`):** Uses the **Haversine Formula** with latitude and longitude:
   - $\le 100\text{ meters} \implies 1.0\text{ (Full Score)}$
   - $\le 500\text{ meters} \implies 0.7$
   - $> 1\text{ kilometer} \implies 0.0$
6. **Date Proximity (10%):** Higher score for items reported on the exact same date; linearly decays over the 14-day window.

**Action:** Any pair scoring **$\ge 0.60$ (60%)** is automatically recorded in the `matches` database table, and notifications are sent to both the owner and finder.

---

### C. Claim & Verification Workflow

To prevent false claims and theft:
1. When a student spots their lost item, they submit a claim along with private proof (`evidence_text`) via `POST /api/claims`.
2. `ClaimService` sets the claim status to `PENDING` and alerts the finder.
3. The finder reviews the claimant's proof in their dashboard.
4. If valid, the finder submits an approval (`PATCH /api/claims/{id}`).
5. In an atomic SQL transaction:
   - Claim status becomes `APPROVED`.
   - Other competing claims for that item are marked `REJECTED`.
   - Item status transitions from `OPEN` to `RESOLVED`.
   - A direct conversation channel opens between the two users.

---

## 7. Connecting Backend to MySQL & Database Security

All database connections originate from [`DBConnectionUtil.java`](file:///d:/Projects/COLLEGE_PROJECTS/CampusFind/backend/src/main/java/com/campusfind/utils/DBConnectionUtil.java).

### Environment Configuration
The database connection string is never hardcoded. It is read securely from environment variables:
```properties
DB_URL=jdbc:mysql://localhost:3306/campusfind_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USER=root
DB_PASSWORD=your_secure_password
```

### SQL Injection Prevention (100% Prepared Statements)
In CampusFind, raw string concatenation (`"SELECT * FROM users WHERE email = '" + email + "'"` ) is strictly prohibited. Every DAO method uses `PreparedStatement`:
```java
String sql = "SELECT * FROM users WHERE email = ?";
try (Connection conn = DBConnectionUtil.getConnection();
     PreparedStatement stmt = conn.prepareStatement(sql)) {
    stmt.setString(1, email);
    try (ResultSet rs = stmt.executeQuery()) {
        if (rs.next()) {
            return mapRowToUser(rs);
        }
    }
}
```
Because the SQL statement is compiled before parameters are injected, SQL Injection attacks are physically impossible.

---

## 8. Connecting Backend to Frontend (CORS & Contracts)

### Cross-Origin Resource Sharing (`CorsFilter.java`)
Because React runs on port `5173` and Tomcat runs on port `8080`, browsers enforce CORS security.
`CorsFilter` automatically responds to pre-flight `OPTIONS` requests and attaches:
```http
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Standardized JSON Response Shapes
All servlets return uniform, predictable JSON structures using `JsonResponseUtil`:
- **Success (200 / 201):**
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```
- **Error (400 / 401 / 404 / 500):**
  ```json
  {
    "success": false,
    "error": "Item not found with id: 42"
  }
  ```

---

## 9. How to Build & Run Backend Locally

### Prerequisites
- JDK 21 installed (`java -version`)
- Apache Maven installed (`mvn -version`)
- Apache Tomcat 10.1+ installed
- MySQL 8.0+ running

### Build Step
In the `backend` folder, run:
```bash
mvn clean package
```
Maven will compile all Java source files, run checks, and generate the deployable WAR artifact at:
`backend/target/campusfind-backend.war`

### Deployment
Copy `campusfind-backend.war` into Tomcat's `webapps/` folder, or run Tomcat directly via your IDE (IntelliJ / Eclipse / VS Code). The API endpoints will be accessible at:
`http://localhost:8080/campusfind-backend/api/...`
