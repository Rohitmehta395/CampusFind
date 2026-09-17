# CampusFind — Frontend

React single-page application for CampusFind built with React, Vite, and Tailwind CSS.

## Current Status

**Phase 1: Foundation & Environment Setup — COMPLETE (Sub-phases 1A through 1E)**
All foundational client infrastructure is operational:
- **Build Tooling:** Vite with React plugin and `@tailwindcss/vite` plugin.
- **Styling:** Tailwind CSS v4 configured and actively rendering.
- **Dependencies:** `react-router-dom` and `axios` installed and verified.
- **Integration (1E):** `src/api/health.js` performs live Axios requests to `${VITE_API_BASE_URL}/api/health`, and `App.jsx` dynamically renders the live backend status indicator (`Backend status: ok`).
- **Resilience:** Gracefully captures and displays outage states when the backend is offline.

## Prerequisites

- **Node.js:** Node 20+ (Node 22 LTS tested)
- **npm:** npm 10+ (npm 11 tested)

## Installation & Setup

Navigate to the `frontend/` directory and install dependencies:

```bash
cd frontend
npm install
```

## Environment Configuration

Copy the template environment configuration:

```bash
copy .env.example .env
```

`frontend/.env` (git-ignored):
```ini
VITE_API_BASE_URL=http://localhost:8080/campusfind-backend
```

## Running Locally

Start the Vite development server:

```bash
npm run dev
```

The application will be accessible at:
`http://localhost:5173/`

## Production Build

Build optimized static assets:

```bash
npm run build
```

Artifacts will be generated in `frontend/dist/`.

## How to Run the Entire Monorepo Locally

To run both backend and frontend together:

1. **Start Local MySQL:**
   ```powershell
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --port=3307 --datadir="C:\Users\<user>\.mysql\data" --mysqlx=0 --bind-address=127.0.0.1 --console
   ```

2. **Deploy and Start Tomcat:**
   ```powershell
   cd backend
   mvn clean package
   Copy-Item target\campusfind-backend.war "$env:CATALINA_HOME\webapps\" -Force
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-25.0.2"
   $env:CATALINA_HOME = "C:\Users\<user>\.tomcat\apache-tomcat-10.1.34"
   $env:DB_URL = "jdbc:mysql://127.0.0.1:3307/campusfind_dev?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
   $env:DB_USER = "campusfind_user"
   $env:DB_PASSWORD = "campusfind_dev_pass"
   & "$env:CATALINA_HOME\bin\catalina.bat" run
   ```

3. **Start Frontend Dev Server:**
   ```powershell
   cd frontend
   npm run dev
   ```

4. **View in Browser:**
   Open `http://localhost:5173/`. The page will connect to the running Tomcat backend and display:
   `Backend status: ok (campusfind-backend)`.

## Project Structure

```text
frontend/
├── package.json
├── vite.config.js       # Vite configuration with React and Tailwind plugins
├── index.html           # HTML entry point
├── .env                 # Local environment variables (git-ignored)
├── .env.example         # Template environment variables
├── README.md            # Frontend documentation
└── src/
    ├── main.jsx         # React application root mount
    ├── App.jsx          # Root component with live health check status
    ├── index.css        # Tailwind CSS import entry point
    └── api/
        └── health.js    # Health check API client using Axios
```
