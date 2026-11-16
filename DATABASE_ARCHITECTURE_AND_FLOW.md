# CampusFind — Database Architecture & Data Flow Guide

> **Audience:** Anyone wanting to understand how the CampusFind database is structured, how relational integrity is maintained, how the tables connect with each other, and how the Java backend reads and writes data via MySQL and JDBC.

---

## 1. Executive Summary: What is the CampusFind Database?

The **CampusFind Database** is the centralized, persistent memory of the entire application. It runs on **MySQL 8.0+** using the **InnoDB** storage engine.

Every user account, lost item report, found item listing, ownership claim, similarity match, in-app message, and notification lives in this database. 

### Why MySQL?
1. **Relational Integrity (3NF):** A campus lost-and-found system is deeply interconnected. Items belong to Users; Claims link Items to Claimants; Matches correlate two Items together; Messages belong to Conversations between two Users. Relational databases enforce these links with **Foreign Keys**.
2. **ACID Transactions:** When a finder approves a claim, multiple things must happen simultaneously: the claim becomes `APPROVED`, competing claims become `REJECTED`, and the item status changes to `RESOLVED`. InnoDB ensures these state transitions happen atomically (either all succeed or all rollback).
3. **Defense Against Data Corruption:** Strict column types, non-null checks, unique constraints, and cascade delete rules guarantee that orphaned records (like a claim for a deleted item) cannot exist.

---

## 2. Database Technology & Configuration

| Parameter | Configuration | Why It Matters |
|---|---|---|
| **Database Engine** | MySQL 8.0+ (InnoDB) | Supports foreign key constraints, row-level locking, and ACID compliance. |
| **Character Set** | `utf8mb4` | Allows full 4-byte Unicode characters, including emojis in descriptions or messages. |
| **Collation** | `utf8mb4_unicode_ci` | Case-insensitive and accurate multilingual text comparison and sorting. |
| **Data Access** | Raw JDBC (`mysql-connector-j`) | Zero ORM overhead; fast, direct, and transparent `PreparedStatement` queries. |
| **Connection Configuration** | Environment Variables | Credentials (`DB_URL`, `DB_USER`, `DB_PASSWORD`) are never hardcoded in source control. |

---

## 3. Entity-Relationship (ER) Architecture

Here is the relational map showing how the 7 core tables connect to one another:

```
                            ┌────────────────┐
                            │     USERS      │
                            │  id (PK)       │
                            └───────┬────────┘
                                    │
           ┌────────────────────────┼────────────────────────┬─────────────────────┐
           │ 1:N (reporter_id)      │ 1:N (claimant_id)      │ 1:N (user_id)       │ 1:N (participant)
           ▼                        ▼                        ▼                     ▼
    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐      ┌───────────────┐
    │    ITEMS     │         │    CLAIMS    │         │NOTIFICATIONS │      │ CONVERSATIONS │
    │  id (PK)     │         │  id (PK)     │         │  id (PK)     │      │   id (PK)     │
    └──────┬───────┘         └──────┬───────┘         └──────────────┘      └───────┬───────┘
           │                        │                                               │
           │ 1:N (item_id)          │                                               │ 1:N
           ├────────────────────────┘                                               ▼
           │                                                                 ┌───────────────┐
           │ M:N Self-Relationship via Matches                               │   MESSAGES    │
           ▼                                                                 │   id (PK)     │
    ┌──────────────┐                                                         └───────────────┘
    │   MATCHES    │
    │  id (PK)     │
    │lost_item_id  │
    │found_item_id │
    └──────────────┘
```

### Key Relationships:
- **User to Items (1:N):** One student can report multiple lost and found items.
- **Item to Claims (1:N):** A single found item can receive multiple ownership claims from different students.
- **Lost Item to Found Item (M:N via `matches`):** A lost item can match multiple found items, and a found item can match multiple lost items with a computed confidence score.
- **User to Notifications (1:N):** System events generate alerts linked directly to a specific user.
- **Conversations to Messages (1:N):** Two users communicate inside a conversation thread containing ordered messages.

---

## 4. Comprehensive Schema Breakdown (Table-by-Table)

All tables are defined in [`backend/src/main/resources/db/schema.sql`](file:///d:/Projects/COLLEGE_PROJECTS/CampusFind/backend/src/main/resources/db/schema.sql).

---

### Table 1: `users`
Stores student and administrator profile credentials and permissions.

| Column | Data Type | Modifiers | Description |
|---|---|---|---|
| `id` | `BIGINT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Unique user identifier. |
| `name` | `VARCHAR(100)` | `NOT NULL` | Full name of the student or admin. |
| `email` | `VARCHAR(150)` | `NOT NULL`, `UNIQUE` | University email address used for login. |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | BCrypt-salted cryptographic password hash. |
| `role` | `ENUM` | `NOT NULL`, `DEFAULT 'STUDENT'` | Access level: `'STUDENT'` or `'ADMIN'`. |
| `is_suspended` | `BOOLEAN` | `NOT NULL`, `DEFAULT FALSE` | Flag set by admins to restrict malicious users. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Account registration timestamp. |

---

### Table 2: `items`
Stores every reported item on campus, whether it was lost or found.

| Column | Data Type | Modifiers | Description |
|---|---|---|---|
| `id` | `BIGINT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Unique item identifier. |
| `reporter_id` | `BIGINT` | `NOT NULL`, `FK -> users(id)` | User who created the report. |
| `type` | `ENUM('LOST', 'FOUND')`| `NOT NULL` | Distinguishes lost reports from found reports. |
| `title` | `VARCHAR(150)` | `NOT NULL` | Short title (e.g., "Blue HydroFlask Bottle"). |
| `category` | `VARCHAR(50)` | `NOT NULL` | Category (e.g., "Electronics", "IDs", "Books"). |
| `color` | `VARCHAR(50)` | `NULL` | Dominant color for filtering and matching. |
| `brand` | `VARCHAR(50)` | `NULL` | Brand name (e.g., "Apple", "Dell", "Nike"). |
| `description` | `TEXT` | `NULL` | Detailed description of the item. |
| `image_url` | `VARCHAR(500)` | `NULL` | Secure HTTPS URL from Cloudinary. |
| `image_hash` | `BIGINT` | `NULL` | 64-bit perceptual dHash for image matching. |
| `location_text` | `VARCHAR(200)` | `NULL` | Campus landmark (e.g., "Central Library 2nd Floor"). |
| `latitude` | `DECIMAL(9, 6)` | `NULL` | GPS Latitude coordinate for map pin. |
| `longitude` | `DECIMAL(9, 6)` | `NULL` | GPS Longitude coordinate for map pin. |
| `event_date` | `DATE` | `NULL` | Date the item was lost or found. |
| `status` | `ENUM` | `DEFAULT 'ACTIVE'` | Lifecycle: `'ACTIVE'`, `'RESOLVED'`, `'REMOVED'`. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Time of submission. |

* **Foreign Key Rule:** `ON DELETE CASCADE` ensures if a user account is deleted, their posted items are automatically cleaned up.
* **Indexes:** 
  - `idx_items_type_category_status (type, category, status)` for fast search and filtering.
  - `idx_items_created_at` for chronological feeds.

---

### Table 3: `matches`
Stores pairings automatically discovered by the Smart Matching Engine.

| Column | Data Type | Modifiers | Description |
|---|---|---|---|
| `id` | `BIGINT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Unique match identifier. |
| `lost_item_id` | `BIGINT` | `NOT NULL`, `FK -> items(id)` | Reference to the LOST item. |
| `found_item_id` | `BIGINT` | `NOT NULL`, `FK -> items(id)` | Reference to the FOUND item. |
| `score` | `DECIMAL(5, 2)`| `NOT NULL` | Aggregate similarity score (0.00 to 1.00). |
| `image_score` | `DECIMAL(5, 2)`| `NULL` | Perceptual image similarity score. |
| `category_score`| `DECIMAL(5, 2)`| `NULL` | Exact/compatible category match score. |
| `color_score` | `DECIMAL(5, 2)`| `NULL` | Color similarity sub-score. |
| `brand_score` | `DECIMAL(5, 2)`| `NULL` | Brand match sub-score. |
| `text_score` | `DECIMAL(5, 2)`| `NULL` | Title & description keyword overlap score. |
| `location_score`| `DECIMAL(5, 2)`| `NULL` | Geolocation proximity (Haversine formula). |
| `date_score` | `DECIMAL(5, 2)`| `NULL` | Date proximity sub-score. |
| `status` | `ENUM` | `DEFAULT 'SUGGESTED'` | Status: `'SUGGESTED'`, `'DISMISSED'`, `'CONFIRMED'`. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Time the match was computed. |

* **Constraint:** `uq_matches_lost_found UNIQUE (lost_item_id, found_item_id)` prevents the matching engine from creating duplicate entries for the same pair.
* **Indexes:** `idx_matches_score (score)` allows instant retrieval of the highest confidence matches.

---

### Table 4: `claims`
Records when a user asserts ownership over a found item.

| Column | Data Type | Modifiers | Description |
|---|---|---|---|
| `id` | `BIGINT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Unique claim identifier. |
| `item_id` | `BIGINT` | `NOT NULL`, `FK -> items(id)` | Item being claimed. |
| `claimant_id` | `BIGINT` | `NOT NULL`, `FK -> users(id)` | Student making the claim. |
| `evidence_text`| `TEXT` | `NOT NULL` | Private proof of ownership (e.g., serial number). |
| `status` | `ENUM` | `DEFAULT 'PENDING'` | Status: `'PENDING'`, `'APPROVED'`, `'REJECTED'`. |
| `reviewed_by` | `BIGINT` | `NULL`, `FK -> users(id)` | Finder or Admin who reviewed the claim. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | When claim was submitted. |
| `reviewed_at` | `TIMESTAMP` | `NULL` | When claim was approved or rejected. |

* **Constraint:** `ON DELETE SET NULL` on `reviewed_by` preserves claim audit records even if an admin or finder account is subsequently removed.
* **Index:** `idx_claims_item_status (item_id, status)` optimizes claim queue lookups.

---

### Table 5: `notifications`
Stores system alerts for users (new matches, claim decisions, messages).

| Column | Data Type | Modifiers | Description |
|---|---|---|---|
| `id` | `BIGINT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Unique notification identifier. |
| `user_id` | `BIGINT` | `NOT NULL`, `FK -> users(id)` | Recipient user. |
| `type` | `ENUM` | `NOT NULL` | Event: `'MATCH_FOUND'`, `'CLAIM_SUBMITTED'`, `'CLAIM_APPROVED'`, `'CLAIM_REJECTED'`, `'NEW_MESSAGE'`, `'ITEM_RESOLVED'`. |
| `payload` | `TEXT` | `NULL` | JSON string with event context (`itemId`, `claimId`, message summary). |
| `is_read` | `BOOLEAN` | `DEFAULT FALSE` | Unread status. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Time notification was created. |

* **Index:** `idx_notifications_user_read (user_id, is_read)` makes the frontend's 20-second unread badge polling query lightning fast.

---

### Tables 6 & 7: `conversations` and `messages`
Provides secure 1-to-1 direct messaging between users once an item is claimed or matched.

* **`conversations`:** Links `user_a_id`, `user_b_id`, and optionally an `item_id`.
* **`messages`:** Contains `conversation_id`, `sender_id`, `text`, `is_read`, and `created_at`.
* **Index:** `idx_messages_conversation_created (conversation_id, created_at)` enables incremental message polling (`WHERE conversation_id = ? AND created_at > ? ORDER BY created_at ASC`).

---

## 5. How Backend Connects to MySQL via JDBC

The backend connects to MySQL using the standard Java Database Connectivity (JDBC) API in [`DBConnectionUtil.java`](file:///d:/Projects/COLLEGE_PROJECTS/CampusFind/backend/src/main/java/com/campusfind/utils/DBConnectionUtil.java):

```java
public static Connection getConnection() throws SQLException {
    String dbUrl = System.getenv("DB_URL");
    String dbUser = System.getenv("DB_USER");
    String dbPassword = System.getenv("DB_PASSWORD");

    return DriverManager.getConnection(dbUrl, dbUser, dbPassword);
}
```

### Try-with-Resources Pattern (Zero Connection Leaks)
Every single DAO interaction in CampusFind uses the Java **try-with-resources** statement. This guarantees that whether a query succeeds, fails, or throws an exception, the MySQL connection and prepared statement are automatically closed:

```java
String sql = "SELECT * FROM items WHERE status = 'ACTIVE' AND category = ?";
try (Connection conn = DBConnectionUtil.getConnection();
     PreparedStatement stmt = conn.prepareStatement(sql)) {
    
    stmt.setString(1, category);
    try (ResultSet rs = stmt.executeQuery()) {
        while (rs.next()) {
            items.add(mapRowToItem(rs));
        }
    }
} // Connection and Statement are cleanly closed here automatically!
```

---

## 6. Real SQL Execution Examples in CampusFind

### Example 1: Creating a Lost Item Report (`ItemDAO.java`)
```sql
INSERT INTO items (
    reporter_id, type, title, category, color, brand, 
    description, image_url, image_hash, location_text, 
    latitude, longitude, event_date, status
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE');
```

### Example 2: Finding Match Candidates within $\pm 14$ Days (`MatchingEngine.java`)
```sql
SELECT * FROM items 
WHERE type = ? 
  AND status = 'ACTIVE'
  AND event_date BETWEEN DATE_SUB(?, INTERVAL 14 DAY) 
                     AND DATE_ADD(?, INTERVAL 14 DAY);
```

### Example 3: Atomic Claim Approval (`ClaimDAO.java` + `ItemDAO.java`)
```sql
-- Step 1: Approve selected claim
UPDATE claims 
SET status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW() 
WHERE id = ?;

-- Step 2: Reject all other pending claims for this item
UPDATE claims 
SET status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW() 
WHERE item_id = ? AND id != ? AND status = 'PENDING';

-- Step 3: Resolve the item listing
UPDATE items 
SET status = 'RESOLVED' 
WHERE id = ?;
```

---

## 7. Performance & Optimization Highlights

1. **Composite Indexes for Search:** Rather than scanning tens of thousands of rows, queries filtering active items by type and category use `idx_items_type_category_status`. MySQL performs an index seek in under 2 milliseconds.
2. **Decimals for Geolocation:** `latitude` and `longitude` use `DECIMAL(9, 6)`. This provides precision down to ~11 centimeters, which is ideal for campus buildings without the overhead of heavy spatial GIS extensions.
3. **dHash Perceptual Hashing:** Instead of comparing raw image pixels in SQL, images are reduced to a single 64-bit number (`image_hash BIGINT`). Visual similarity checks become simple bitwise XOR comparisons.
4. **Normalized 3NF Structure:** Data is never duplicated across tables. User email or item titles are stored in exactly one place and referenced by foreign keys.

---

## 8. How to Initialize the Database Locally

1. **Log in to MySQL:**
   ```bash
   mysql -u root -p
   ```
2. **Create the Database:**
   ```sql
   CREATE DATABASE campusfind_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE campusfind_dev;
   ```
3. **Execute the Schema Script:**
   ```sql
   SOURCE backend/src/main/resources/db/schema.sql;
   ```
4. **Verify Tables:**
   ```sql
   SHOW TABLES;
   ```
   You should see:
   - `claims`
   - `conversations`
   - `items`
   - `matches`
   - `messages`
   - `notifications`
   - `users`
