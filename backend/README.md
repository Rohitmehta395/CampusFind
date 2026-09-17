# CampusFind — Backend

Java web application backend for CampusFind built with Java Servlets, Apache Tomcat, and Maven.

## Current Status

**Phase 1: Foundation & Environment Setup — COMPLETE (Sub-phases 1A through 1E)**
All foundational backend infrastructure is implemented and end-to-end verified:
- **1A:** Maven WAR project configured with Java 21 LTS and Jakarta Servlet 6.0 (`jakarta.servlet-api:6.0.0`).
- **1B:** `HealthCheckServlet` (`GET /api/health`) verified on Apache Tomcat 10.1.34.
- **1C:** `DBConnectionUtil` + `HealthCheckDbServlet` (`GET /api/health/db`) verified with MySQL Connector/J 8.4.0.
- **1E:** `CorsFilter` (`/api/*`) active, allowing cross-origin requests from Vite dev server (`http://localhost:5173`).

## Prerequisites

- **Java Development Kit (JDK):** JDK 21+ (Java 21 LTS or compatible, e.g. JDK 25)
- **Apache Maven:** Maven 3.9+
- **Database Server:** MySQL Server 8.0+ (or 8.4 LTS)
- **Target Runtime:** Apache Tomcat 10.1+ (Jakarta EE 10 / Servlet 6.0)

## Dependencies

- `jakarta.servlet:jakarta.servlet-api:6.0.0` (scope: `provided`) — Jakarta Servlet 6.0 API for Tomcat 10.1+.
- `com.mysql:mysql-connector-j:8.4.0` (scope: `compile`) — Official MySQL Connector/J JDBC driver (LTS) compatible with MySQL 8.0/8.4 and Java 21+.

## Database Connection Architecture

Database connectivity is managed exclusively through standard JDBC (no ORM, no connection pooling). Future Data Access Objects (DAOs in `com.campusfind.dao`) call the utility method:

```java
package com.campusfind.utils;

public final class DBConnectionUtil {
    public static Connection getConnection() throws SQLException;
}
```

- **Method Signature:** `public static Connection getConnection() throws SQLException`
- **Behavior:** Reads connection parameters strictly from environment variables (`DB_URL`, `DB_USER`, `DB_PASSWORD`) and returns a new `java.sql.Connection` per call. The caller is responsible for closing the connection (e.g. using try-with-resources).
- **Validation:** Throws an explicit `SQLException` if any required environment variable is missing or blank.

## Environment Variables

The application requires three environment variables to connect to the database. Refer to `backend/.env.example` for reference templates:

| Variable | Description | Example (Local Dev) |
|---|---|---|
| `DB_URL` | JDBC connection URL with parameters | `jdbc:mysql://127.0.0.1:3307/campusfind_dev?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` |
| `DB_USER` | MySQL username | `campusfind_user` |
| `DB_PASSWORD` | MySQL password | `campusfind_dev_pass` |

> [!WARNING]
> Never commit database credentials or secrets into version control. Environment variables should be injected by the host environment or launch scripts.

## Building the Project

Run Maven from the `backend/` directory:

```bash
# Compile classes
mvn clean compile

# Build deployable WAR artifact
mvn clean package
```

The resulting WAR package will be generated at:
`backend/target/campusfind-backend.war`

## API Endpoints

### 1. Application Health Check

- **Method:** `GET`
- **Path:** `/api/health` (Full URL: `http://localhost:8080/campusfind-backend/api/health`)
- **Status:** `200 OK`
- **CORS:** Enabled for `http://localhost:5173`
- **Content-Type:** `application/json;charset=UTF-8`
- **Response Body:**
  ```json
  {"status":"ok","service":"campusfind-backend"}
  ```

### 2. Database Connectivity Health Check

- **Method:** `GET`
- **Path:** `/api/health/db` (Full URL: `http://localhost:8080/campusfind-backend/api/health/db`)
- **Status:** `200 OK` (connected) / `503 Service Unavailable` (unreachable)
- **CORS:** Enabled for `http://localhost:5173`
- **Content-Type:** `application/json;charset=UTF-8`
- **Success Response Body:**
  ```json
  {"status":"ok","db":"connected"}
  ```
- **Failure Response Body:**
  ```json
  {"status":"error","db":"unreachable","message":"Database connection failed"}
  ```

## CORS Configuration

Cross-Origin Resource Sharing is handled by `com.campusfind.filters.CorsFilter`:
- **Filter Mapping:** `/api/*`
- **Allowed Origin:** `http://localhost:5173` (strictly scoped to Vite dev server)
- **Allowed Methods:** `GET, POST, PUT, DELETE, OPTIONS`
- **Allowed Headers:** `Content-Type, Authorization`
- **Credentials:** `true`

> [!NOTE]
> This CORS configuration is tailored for local development. Production deployment will lock the allowed origin to the production domain.

## How to Run the Entire Project Locally

To run the complete monorepo locally from scratch:

1. **Start Local MySQL Dev Server:**
   ```powershell
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --port=3307 --datadir="C:\Users\<user>\.mysql\data" --mysqlx=0 --bind-address=127.0.0.1 --console
   ```

2. **Build and Deploy Backend to Tomcat:**
   ```powershell
   cd backend
   mvn clean package
   Copy-Item target\campusfind-backend.war "$env:CATALINA_HOME\webapps\" -Force
   ```

3. **Start Tomcat with Environment Variables:**
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-25.0.2"
   $env:CATALINA_HOME = "C:\Users\<user>\.tomcat\apache-tomcat-10.1.34"
   $env:DB_URL = "jdbc:mysql://127.0.0.1:3307/campusfind_dev?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
   $env:DB_USER = "campusfind_user"
   $env:DB_PASSWORD = "campusfind_dev_pass"
   & "$env:CATALINA_HOME\bin\catalina.bat" run
   ```

4. **Start Frontend Dev Server:**
   ```powershell
   cd frontend
   npm run dev
   ```

5. **Open Browser:**
   Navigate to `http://localhost:5173/`. The page will display the live connected status:
   `Backend status: ok (campusfind-backend)`.

## Project Structure

```text
backend/
├── pom.xml
├── .env.example
├── README.md
└── src/
    └── main/
        ├── java/com/campusfind/
        │   ├── servlets/
        │   │   ├── HealthCheckServlet.java    # GET /api/health
        │   │   ├── HealthCheckDbServlet.java  # GET /api/health/db
        │   │   └── package-info.java
        │   ├── services/                      # Business logic layer
        │   ├── dao/                           # JDBC data access objects
        │   ├── models/                        # Entity and data models
        │   ├── utils/
        │   │   ├── DBConnectionUtil.java      # JDBC connection utility
        │   │   └── package-info.java
        │   └── filters/
        │       ├── CorsFilter.java            # Local dev CORS filter (/api/*)
        │       └── package-info.java
        ├── resources/                         # Application properties and SQL scripts
        └── webapp/
            └── WEB-INF/
                └── web.xml                    # Web application deployment descriptor
```
