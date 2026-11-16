# CampusFind — Frontend Architecture & Full-Stack Data Flow Guide

> **Audience:** Anyone wanting to understand how the CampusFind frontend works, its technology stack, and how user actions in the browser communicate with the Java backend and MySQL database.

---

## 1. Executive Summary: What is CampusFind Frontend?

**CampusFind** is a modern Single Page Application (SPA) designed to help university students and faculty find lost belongings or return items they have found.

The **Frontend** is everything the user sees and interacts with in their web browser:
- The responsive navigation bar, search bars, filter buttons, and item cards.
- The reporting forms with image preview and location pickers.
- The interactive campus map with clickable pins.
- Real-time notifications and direct 1-to-1 messaging between finders and owners.

Instead of reloading the entire web page on every click (like old-school websites), the frontend runs dynamically in the user's browser using **React**. It communicates silently with the backend using **HTTP REST APIs (JSON)** and third-party cloud services like **Cloudinary** (for images) and **OpenStreetMap** (for maps).

---

## 2. Frontend Technology Stack

| Technology | Role in Project | Why We Chose It |
|---|---|---|
| **React (v19)** | UI Component Library | Enables building reusable UI blocks (cards, modals, forms) and manages reactive user state cleanly. |
| **Vite (v8)** | Build Tool & Dev Server | Ultra-fast Hot Module Replacement (HMR) and instantaneous build times compared to legacy Create-React-App. |
| **Tailwind CSS (v4)** | Styling Framework | Utility-first styling directly in JSX classes; ensures a sleek, responsive mobile & desktop UI without writing separate messy CSS files. |
| **React Router (v7)** | Client-Side Routing | Provides seamless page transitions (`/browse`, `/items/:id`, `/report/lost`, `/messages`) without full browser reloads. |
| **Axios** | HTTP Client | Handles API calls to the Java backend with automatic JSON serialization, request headers, and response interceptors. |
| **Leaflet & OpenStreetMap** | Interactive Campus Maps | Free, open-source mapping with no restrictive credit-card billing or API keys required; enables map pins and coordinate picking. |
| **Oxlint** | Linter | Extremely fast code linter that catches bugs and ensures high code quality across all JavaScript and JSX files. |

---

## 3. High-Level System Architecture

Here is how the Frontend connects to the rest of the application:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER'S WEB BROWSER                             │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                     React 19 SPA (Vite)                      │     │
│   │                                                              │     │
│   │   [Pages]          [State / Context]       [API Layer]       │     │
│   │   • HomePage       • AuthContext           • axiosClient     │     │
│   │   • BrowsePage       (User info & JWT)     • items.js        │     │
│   │   • ItemDetail                             • claims.js       │     │
│   │   • Messages                               • auth.js         │     │
│   └──────┬────────────────────┬────────────────────┬─────────────┘     │
└──────────┼────────────────────┼────────────────────┼───────────────────┘
           │                    │                    │
    Direct │ Unsigned           │ Interactive Map    │ REST APIs (JSON)
    Upload │ Image Upload       │ Tiles & Markers    │ with Bearer JWT
           ▼                    ▼                    ▼
   ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐
   │  Cloudinary  │     │ OpenStreetMap│     │   Apache Tomcat Server   │
   │  Media Cloud │     │   (Leaflet)  │     │ ┌──────────────────────┐ │
   └──────┬───────┘     └──────────────┘     │ │ AuthFilter (JWT)     │ │
          │                                  │ └──────────┬───────────┘ │
          │ Returns Image URL                │            ▼             │
          │ (e.g. https://res.cloudinary...) │ │ Servlets (Controllers) │ │
          │                                  │ └──────────┬───────────┘ │
          └─────────────────────────────────>│            ▼             │
                                             │ Service & Matching Layer │
                                             │ └──────────┬───────────┘ │
                                             │            ▼             │
                                             │ DAO (JDBC SQL Queries)   │
                                             │ └──────────┬───────────┘ │
                                             └────────────┼─────────────┘
                                                          │ JDBC
                                                          ▼
                                             ┌──────────────────────────┐
                                             │      MySQL Database      │
                                             │   (Users, Items, Claims, │
                                             │    Matches, Messages)    │
                                             └──────────────────────────┘
```

---

## 4. Frontend Internal Code Organization

Inside `frontend/src/`, files are organized by single-responsibility layers:

```
frontend/src/
├── api/             # Functions that send HTTP requests to backend & cloud services
│   ├── axiosClient.js    # Base Axios instance with JWT interceptors
│   ├── auth.js           # Login, register, profile requests
│   ├── items.js          # Fetch, filter, create, resolve items
│   ├── matches.js        # Retrieve AI matching scores for an item
│   ├── claims.js         # Submit, review, approve, or reject claims
│   ├── conversations.js  # 1-to-1 chat messaging endpoints
│   ├── notifications.js  # Unread count and alerts
│   └── cloudinary.js     # Direct unsigned image upload to Cloudinary
├── components/      # Reusable UI pieces
│   ├── ItemCard.jsx      # Card display for lost/found items
│   ├── ItemReportForm.jsx# Reusable form for reporting Lost or Found items
│   ├── ImageUploader.jsx # Drag-and-drop image picker with instant preview
│   ├── ItemsMap.jsx      # Interactive Leaflet map showing item locations
│   ├── ChatModal.jsx     # In-app conversation popup
│   ├── NotificationBell.jsx # Unread count badge and drop-down alerts
│   └── ProtectedRoute.jsx# Guards private pages from unauthenticated users
├── context/         # Global state shared across the whole app
│   └── AuthContext.jsx   # Current user object, login/logout functions, JWT token
├── pages/           # Full screen views tied to URLs
│   ├── HomePage.jsx      # Landing hero, stats, recent lost/found items
│   ├── BrowsePage.jsx    # Search, category filters, location filter & map toggle
│   ├── ItemDetailPage.jsx# Detailed view, matches list, claim form
│   ├── ReportLostPage.jsx# Form page to post a lost item
│   ├── ReportFoundPage.jsx# Form page to post a found item
│   ├── MyListingsPage.jsx# User's active listings and their claims
│   ├── MessagesPage.jsx  # Full conversation threads
│   ├── LoginPage.jsx     # User sign-in
│   └── RegisterPage.jsx  # User sign-up
└── App.jsx          # Master router connecting URLs to pages
```

---

## 5. How Frontend Connects to Backend (The Bridge)

The frontend communicates with the Java backend (`Apache Tomcat`) through **REST APIs** using a configured Axios client located in [`frontend/src/api/axiosClient.js`](file:///d:/Projects/COLLEGE_PROJECTS/CampusFind/frontend/src/api/axiosClient.js).

### 1. Base URL Configuration
The frontend automatically knows where the backend lives through environment variables:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/campusfind-backend'

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
})
```
- In local development: `http://localhost:8080/campusfind-backend`
- In production (e.g. Vercel / Render / AWS): Set via the `.env` file.

### 2. The Request Interceptor: Automatic JWT Injection
Whenever the user logs in, the backend sends a secure **JSON Web Token (JWT)**. The frontend saves it in the browser's `localStorage` under `'campusfind_token'`.

Before **every single API request** leaves the browser, Axios intercepts it and automatically attaches the token:
```javascript
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('campusfind_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```
This means the developer never has to manually write authorization headers on every request.

### 3. The Response Interceptor: Seamless Session Handling
If a user's token expires or is invalid, the backend replies with `401 Unauthorized`.
Axios catches this globally:
- It removes the expired token and cached user from `localStorage`.
- It automatically redirects the browser to `/login`.
- The user is protected from broken states or silent security failures.

---

## 6. End-to-End Walkthrough of 3 Real Actions

To truly understand how frontend, backend, and database work together, let's trace three core features from mouse click to database row.

---

### Flow 1: User Signs In

```
[User types Email & Password]
             │
             ▼
[LoginPage.jsx calls login(email, password)]
             │
             ▼
[Axios sends POST /api/auth/login] ─────────────> [Tomcat: AuthServlet]
                                                           │
                                                           ▼
                                                  [AuthService verifies BCrypt hash]
                                                           │
                                                           ▼
                                                  [UserDAO checks MySQL 'users' table]
                                                           │
                                                           ▼
                                                  [Generates signed JWT token]
                                                           │
[Frontend receives { token, user }] <──────────────────────┘
             │
             ▼
[AuthContext saves token to localStorage]
             │
             ▼
[React updates UI & redirects to /browse]
```

1. **In the Browser:** The user enters credentials on `LoginPage.jsx` and clicks **Sign In**.
2. **In React:** `AuthContext.login()` calls `authApi.loginRequest(email, password)`.
3. **Over HTTP:** Axios sends a `POST` request to `http://localhost:8080/campusfind-backend/api/auth/login` with `{ email, password }` in the JSON body.
4. **In the Backend:** 
   - `AuthServlet` receives the request and forwards it to `AuthService`.
   - `UserDAO` executes a SQL query on MySQL: `SELECT * FROM users WHERE email = ?`.
   - `AuthService` verifies the entered password against the stored BCrypt hash.
   - If valid, it generates a JWT containing the user's ID, role, and expiration.
5. **Back in the Browser:**
   - The frontend receives `{ token: "ey...", user: { id: 1, name: "...", role: "STUDENT" } }`.
   - `AuthContext` stores the token in `localStorage`.
   - React updates its global state and redirects the user to the dashboard.

---

### Flow 2: Reporting a Lost Item (Image Upload + Backend Record)

A common bottleneck in web apps is uploading heavy image files through the application server. CampusFind solves this with **Direct Cloudinary Upload**:

```
[User selects photo & fills form]
             │
             ▼
[ImageUploader uploads photo directly to Cloudinary via HTTPS]
             │
             ▼
[Cloudinary stores image & returns URL: https://res.cloudinary.com/.../photo.jpg]
             │
             ▼
[ItemReportForm packages text fields + Cloudinary image URL]
             │
             ▼
[Axios sends POST /api/items with Authorization: Bearer <JWT>]
             │
             ▼
   [Tomcat AuthFilter verifies JWT token]
             │
             ▼
   [ItemServlet -> ItemService -> ItemDAO]
             │
             ▼
   [MySQL executes: INSERT INTO items (title, category, image_url, lat, lng, ...)]
             │
             ▼
   [MatchingEngine compares new item against existing FOUND items]
             │
             ▼
[Frontend receives 201 Created and displays success toast & potential matches!]
```

1. **Direct Image Upload:**
   - When the user selects a photo of their lost item in `ImageUploader.jsx`, the browser uploads the image directly to Cloudinary using an unsigned upload preset (`uploadImageToCloudinary(file)`).
   - Cloudinary optimizes and hosts the image, returning a secure HTTPS URL.
   - *Advantage:* The Tomcat server and MySQL database never have to process or store heavy binary files.
2. **Submitting Item Metadata:**
   - The user selects the campus location on the Leaflet map and clicks **Submit Report**.
   - `itemsApi.createItem()` sends a `POST /api/items` with the title, category, description, coordinates (`latitude`, `longitude`), and the `image_url`.
3. **Backend Processing & Database Insertion:**
   - Tomcat's `AuthFilter` validates the user's JWT from the request header.
   - `ItemServlet` hands the data to `ItemService`.
   - `ItemDAO` inserts a new row into the MySQL `items` table using a secure `PreparedStatement`.
4. **Smart Matching Trigger:**
   - Immediately after saving to MySQL, `ItemService` triggers the `MatchingEngine`.
   - The engine searches MySQL for candidate `FOUND` items matching category, date proximity, and distance.
   - Matches with scores over the threshold are inserted into the `matches` table.
5. **UI Update:**
   - The user receives an instant confirmation and is redirected to the item detail page where matching items are highlighted.

---

### Flow 3: Claiming an Item & Live Resolution

```
[User clicks "Claim This Item" on a Found Item]
             │
             ▼
[User provides private ownership proof (e.g. serial number, unique marks)]
             │
             ▼
[Axios sends POST /api/claims { itemId, proofText }]
             │
             ▼
[ClaimDAO inserts record into MySQL 'claims' with status = 'PENDING']
             │
             ▼
[NotificationDAO writes a row for the finder: "New claim submitted for your item"]
             │
             ▼
[Finder reviews proof and clicks "Approve"]
             │
             ▼
[Axios sends PATCH /api/claims/:id { status: 'APPROVED' }]
             │
             ▼
[Backend updates claim status to APPROVED and sets item status to RESOLVED]
             │
             ▼
[Both users can now safely chat or meet on campus to return the item!]
```

---

## 7. How Data is Synchronized: Polling Strategy

Because Apache Tomcat runs standard Java Servlets, the frontend uses an efficient **intelligent polling mechanism** for live updates (notifications and chat messages):

- **Notifications (`NotificationBell.jsx`):**
  - The frontend polls `GET /api/notifications/unread-count` every 20–30 seconds.
  - When a new match or claim decision occurs, the red notification badge lights up with the count.
- **Direct Messaging (`ChatModal.jsx` / `MessagesPage.jsx`):**
  - While a user has an active chat open with another student, the frontend polls `GET /api/conversations/:id/messages?since=<lastMessageId>` every 3–5 seconds.
  - This delivers a snappy chat experience without the server overhead of managing millions of persistent WebSocket connections.

---

## 8. Security & Best Practices Built into the Frontend

1. **Zero Raw Password Storage:** Passwords are never stored in plain text; they are sent over HTTPS to the backend, which hashes them using **BCrypt** with salt before saving to MySQL.
2. **Stateless JWT Authorization:** No server-side sessions to corrupt or bloat. The token contains cryptographic verification.
3. **Cross-Site Scripting (XSS) Prevention:** React automatically escapes all variables rendered inside JSX (e.g. `{item.description}`), preventing malicious script injection.
4. **Protected Routing:** Routes like `/my-listings`, `/messages`, and `/report/*` are wrapped with `<ProtectedRoute>`. If an unauthenticated user attempts to access them, they are instantly redirected to `/login`.
5. **No Database Access from Browser:** The frontend **never** touches MySQL directly. All database access is strictly isolated behind parameterized Java JDBC `PreparedStatement` queries in the DAO layer, eliminating SQL Injection vulnerabilities.

---

## 9. Summary: How to Run the Frontend Locally

1. Open a terminal in the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install all dependencies:
   ```bash
   npm install
   ```
3. Configure your local environment variables in `frontend/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/campusfind-backend
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:5173`. You can now interact with the app, report items, test smart matching, and view full database synchronization!
