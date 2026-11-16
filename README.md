# CampusFind — Smart Campus Lost & Found Management System

[![Java](https://img.shields.io/badge/Java-21%20LTS-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tomcat](https://img.shields.io/badge/Apache_Tomcat-10.1+-F8DC75?style=for-the-badge&logo=apache-tomcat&logoColor=black)](https://tomcat.apache.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

> **CampusFind** eliminates the chaos of lost-and-found items in university campuses. It bridges the gap between *"I lost something"* and *"Someone found it"* through an automated multi-signal matching engine, interactive geolocation maps, and a secure anti-fraud claim verification pipeline.

---

## 📌 Problem & Solution

### The Problem
* **Outdated Noticeboards:** Physical lost-and-found boards in campus buildings are slow, localized, and easily overlooked.
* **Chaotic Social Media Groups:** WhatsApp, Discord, and Telegram chats get flooded with spam; reports lack structured categories, searchability, or status tracking.
* **Fraudulent Claims:** Anyone claiming *"that's mine"* without verification leads to item theft and lack of accountability.

### The CampusFind Solution
* **Centralized Digital Portal:** A unified, searchable web application for students, faculty, and administrative staff.
* **Multi-Signal Smart Matching:** Automatically compares newly reported items against opposite listings (`LOST` vs. `FOUND`) using visual hashing, text overlap, date proximity, and GPS distance.
* **Interactive Campus Maps:** Pinpoint exact loss or discovery locations using interactive OpenStreetMap layers.
* **Secure Two-Step Claiming:** Claimants must submit private proof of ownership (e.g. serial numbers, distinctive markings, lock-screen wallpapers) before contact details are exchanged.
* **Direct In-App Messaging & Notifications:** Finder and owner can coordinate safe on-campus return without exposing personal phone numbers.

---

## 🛠️ Technology Stack

| Layer | Technologies | Key Highlights |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router 7, Axios | Single Page Application (SPA), lightning-fast HMR, responsive utility-first styling, client-side routing. |
| **Maps & Geo** | Leaflet, OpenStreetMap | Open-source map tiles, interactive location picker, pin rendering with zero billing friction. |
| **Backend** | Java 21, Jakarta Servlet 6.0, Apache Tomcat 10.1+ | Robust 5-tier layered MVC monolith, standards-compliant request handling, native virtual thread readiness. |
| **Data Access** | Raw JDBC (`mysql-connector-j 8.4`) | Direct `PreparedStatement` execution; 100% SQL injection immune, zero ORM overhead. |
| **Database** | MySQL 8.0+ (InnoDB Engine) | Strict relational integrity (3NF), foreign keys with cascading rules, ACID transactions, `utf8mb4` emoji support. |
| **Security & Auth** | JWT (`jjwt 0.11.5`), jBCrypt, LoginRateLimiter | Stateless bearer token authentication, salted cryptographic password hashing, brute-force IP throttling. |
| **Media Cloud** | Cloudinary API | Direct client-side unsigned image upload pipeline; zero binary file overhead on the Tomcat server. |
| **Build & Tooling** | Maven, npm, Oxlint, Git | Multi-module repository structure, automated WAR builds, high-speed linting. |

---

## 🏛️ System Architecture

CampusFind is engineered as a **Clean 5-Tier Modular Monolith**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT / BROWSER TIER                           │
│     React 19 SPA • Vite • Tailwind CSS • Leaflet Map • Axios           │
└──────────┬────────────────────┬────────────────────┬───────────────────┘
           │                    │                    │
    Direct │ Unsigned           │ Interactive Map    │ REST API (JSON)
    Upload │ Image Upload       │ Tiles & Markers    │ with Bearer JWT
           ▼                    ▼                    ▼
   ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐
   │  Cloudinary  │     │ OpenStreetMap│     │   Apache Tomcat Server   │
   │  Media CDN   │     │  Tile Server │     │ ┌──────────────────────┐ │
   └──────┬───────┘     └──────────────┘     │ │ Cors & Auth Filters  │ │
          │                                  │ └──────────┬───────────┘ │
          │ Image URL                        │            ▼             │
          │ (https://res.cloudinary...)      │ │ Servlets (Controllers) │ │
          │                                  │ └──────────┬───────────┘ │
          └─────────────────────────────────>│            ▼             │
                                             │ Service & Matching Layer │
                                             │ └──────────┬───────────┘ │
                                             │            ▼             │
                                             │ DAO (JDBC PreparedStmts) │
                                             │ └──────────┬───────────┘ │
                                             └────────────┼─────────────┘
                                                          │ JDBC
                                                          ▼
                                             ┌──────────────────────────┐
                                             │      MySQL Database      │
                                             │  (users, items, claims,  │
                                             │   matches, messages)     │
                                             └──────────────────────────┘
```

---

## 🧠 Smart Matching Engine (Core Innovation)

The system automatically matches `LOST` and `FOUND` listings using a **7-factor weighted scoring algorithm**:

$$\text{Match Score} = 0.30(I) + 0.15(C) + 0.15(T) + 0.10(B) + 0.10(K) + 0.10(G) + 0.10(D)$$

* **Perceptual Image Hash ($I$ — 30%):** Computes a 64-bit difference hash (dHash) comparing visual structure and color distribution, invariant to scaling.
* **Category Match ($C$ — 15%):** Hard match or compatible category hierarchy.
* **Text & Description Overlap ($T$ — 15%):** Normalized word-token intersection (Jaccard similarity) stripping common stop words.
* **Brand ($B$ — 10%) & Color ($K$ — 10%):** Exact string matching with Levenshtein distance fallback.
* **Geolocation Proximity ($G$ — 10%):** Haversine formula calculation between report coordinates ($\le 100\text{m} \rightarrow 1.0$, $> 1\text{km} \rightarrow 0.0$).
* **Date Proximity ($D$ — 10%):** Evaluates loss/discovery dates within a $\pm 14$-day candidate window.

> 🔔 Pairs with aggregate score **$\ge 0.60$ (60%)** automatically generate records in `matches` and trigger in-app notifications to both users.

---

## 📂 Project Directory Structure

```text
CampusFind/
├── frontend/                     # React 19 Single Page Application
│   ├── src/
│   │   ├── api/                 # Axios clients (items, auth, claims, cloudinary, chat)
│   │   ├── components/          # Reusable UI (ItemCard, ItemReportForm, ItemsMap, ChatModal)
│   │   ├── context/             # AuthContext (global user state & JWT)
│   │   ├── pages/               # Views (HomePage, BrowsePage, ItemDetailPage, MessagesPage)
│   │   └── App.jsx              # Master route definitions
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Java Servlets Backend (Jakarta EE 10)
│   ├── src/main/java/com/campusfind/
│   │   ├── filters/             # CorsFilter, AuthFilter (JWT interceptor)
│   │   ├── servlets/            # ItemServlet, LoginServlet, ClaimServlet, ConversationServlet
│   │   ├── services/            # ItemService, AuthService, ClaimService, NotificationService
│   │   ├── matching/            # MatchingEngine, MatchScorer, LocationScorer, ImageHasher
│   │   ├── dao/                 # Parameterized SQL repositories (ItemDAO, UserDAO, ClaimDAO)
│   │   ├── models/              # Entity POJOs (Item, User, Claim, Match, Message)
│   │   └── utils/               # DBConnectionUtil, JwtUtil, PasswordUtil, LoginRateLimiter
│   ├── src/main/resources/db/
│   │   └── schema.sql           # MySQL 3NF database schema & indexes
│   └── pom.xml                  # Maven dependencies & WAR build configuration
│
├── FRONTEND_ARCHITECTURE_AND_FLOW.md  # Deep dive into Frontend components & data flow
├── BACKEND_ARCHITECTURE_AND_FLOW.md   # Deep dive into Java Servlets, Filters & Services
├── DATABASE_ARCHITECTURE_AND_FLOW.md  # Deep dive into MySQL schema, ER design & indexes
├── CampusFind_Architecture_Blueprint.md# Complete 21-day architectural blueprint
└── README.md                          # Project documentation (You are here)
```

---

## 🚀 Getting Started (Local Setup)

### 1. Prerequisites
* **Java:** JDK 21+ (`java -version`)
* **Build Tool:** Apache Maven 3.9+ (`mvn -version`)
* **Servlet Container:** Apache Tomcat 10.1+
* **Database:** MySQL Server 8.0+
* **Node.js:** Node 20+ and npm 10+

---

### 2. Database Setup
1. Start your local MySQL service.
2. Log into MySQL and create the database:
   ```sql
   CREATE DATABASE campusfind_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Run the schema initialization script:
   ```bash
   mysql -u root -p campusfind_dev < backend/src/main/resources/db/schema.sql
   ```

---

### 3. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Build the project WAR file using Maven:
   ```bash
   mvn clean package
   ```
   *The compiled artifact will be generated at `backend/target/campusfind-backend.war`.*

3. Set your environment variables and deploy to Tomcat:
   ```powershell
   # Windows PowerShell Example
   $env:DB_URL = "jdbc:mysql://localhost:3306/campusfind_dev?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
   $env:DB_USER = "root"
   $env:DB_PASSWORD = "your_mysql_password"

   # Copy WAR to Tomcat webapps
   Copy-Item target\campusfind-backend.war "$env:CATALINA_HOME\webapps\" -Force

   # Start Tomcat
   & "$env:CATALINA_HOME\bin\catalina.bat" run
   ```
4. Verify backend health:
   * App Health: `http://localhost:8080/campusfind-backend/api/health`
   * DB Health: `http://localhost:8080/campusfind-backend/api/health/db`

---

### 4. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `frontend/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/campusfind-backend
   VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser at **`http://localhost:5173/`**.

---

## 📡 Core API Reference Summary

| Endpoint | Method | Auth Required | Description |
|---|---|:---:|---|
| `/api/auth/register` | `POST` | ❌ No | Registers a new student account (BCrypt hashed password). |
| `/api/auth/login` | `POST` | ❌ No | Authenticates credentials and returns signed JWT token. |
| `/api/auth/me` | `GET` | ✅ Yes | Returns current authenticated user profile. |
| `/api/items` | `GET` | ❌ No | Browse items with filters (`type`, `category`, `status`, `page`). |
| `/api/items` | `POST` | ✅ Yes | Create lost or found item report (triggers matching engine). |
| `/api/items/{id}` | `GET` | ❌ No | Retrieve complete item details, location, and metadata. |
| `/api/items/{id}/matches` | `GET` | ✅ Yes | Retrieve suggested AI matches for this item (owner only). |
| `/api/claims` | `POST` | ✅ Yes | Submit an ownership claim with evidence text. |
| `/api/claims/{id}` | `PATCH` | ✅ Yes | Approve or reject a claim (updates item to `RESOLVED`). |
| `/api/notifications/unread-count`| `GET` | ✅ Yes | Poll unread notification count. |
| `/api/conversations/{id}/messages`| `GET` | ✅ Yes | Retrieve message thread between finder and claimant. |
| `/api/conversations/{id}/messages`| `POST` | ✅ Yes | Send a new message in conversation thread. |

---

## 📖 In-Depth Project Documentation

For complete technical specifications, see our dedicated companion guides:
* 🌐 **[Frontend Architecture & Data Flow Guide](file:///d:/Projects/COLLEGE_PROJECTS/CampusFind/FRONTEND_ARCHITECTURE_AND_FLOW.md)**: React components, state, Axios interceptors, Cloudinary direct upload pipeline.
* ⚙️ **[Backend Architecture & Data Flow Guide](file:///d:/Projects/COLLEGE_PROJECTS/CampusFind/BACKEND_ARCHITECTURE_AND_FLOW.md)**: 5-Tier MVC monolith, Java Servlets, Filters, Smart Matching Engine, and exception handling.
* 🗄️ **[Database Architecture & Data Flow Guide](file:///d:/Projects/COLLEGE_PROJECTS/CampusFind/DATABASE_ARCHITECTURE_AND_FLOW.md)**: 3NF schema, ER diagrams, foreign key cascades, JDBC queries, and indexing.
* 📋 **[CampusFind Complete Architecture Blueprint](file:///d:/Projects/COLLEGE_PROJECTS/CampusFind/CampusFind_Architecture_Blueprint.md)**: Comprehensive 21-day delivery roadmap and design philosophy.

---

## 🔒 Security Measures
* **Stateless JWT Tokens:** Cryptographically signed with HMAC-SHA256; zero session bloat on Tomcat.
* **100% Parameterized SQL:** Pure `PreparedStatement` usage across all DAOs; SQL injection physically impossible.
* **Direct Cloudinary Upload:** Binary files never choke the application server; image uploads bypass Tomcat.
* **Memory Rate Limiting:** Throttles brute-force password guessing attempts per IP.
* **Strict Role-Based Access Control:** Servlets strictly verify ownership and roles (`STUDENT`, `ADMIN`) server-side.

---

## 👥 Contributors & Academic Context

* **Project:** CampusFind — Smart Campus Lost & Found Management System
* **Department:** Department of Computer Science & Engineering
* **Course:** Final Year Capstone Project / Major Project

---

## 📄 License
This project is developed for educational and academic purposes. Distributed under the MIT License.
