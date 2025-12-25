# Technical Specification

## 1. Project Structure

### 1.1 Backend Structure
backend/
├── src/
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── middleware/
│ ├── services/
│ ├── utils/
│ └── config/
├── migrations/
├── tests/
└── package.json

- `src/`: Main source code of the API.
- `controllers/`: Functions that handle requests and send responses (business logic layer) [web:100][web:110].
- `models/`: Database models or query files for tables like tenants, users, projects, tasks.
- `routes/`: Definitions of API paths (e.g., `/api/auth/login`) that connect URLs to controllers [web:97][web:104].
- `middleware/`: Reusable code that runs before controllers, such as auth checks and validation.
- `services/`: Extra business logic or helper classes (e.g., subscription limit checks, email sending).
- `utils/`: Small helper functions (e.g., token helpers, error formatters).
- `config/`: Configuration files like database connection and app settings.
- `migrations/`: SQL or migration scripts to create/update database tables.
- `tests/`: Automated tests for controllers, services, and routes [web:100].

### 1.2 Frontend Structure
frontend/
├── src/
│ ├── pages/
│ ├── components/
│ ├── hooks/
│ ├── context/
│ ├── services/
│ └── assets/
└── package.json

- `src/`: Main React application source code.
- `pages/`: Full pages like Login, Register, Dashboard, Projects List, Project Details, Users List [web:102][web:105].
- `components/`: Reusable UI pieces used inside pages (buttons, forms, tables).
- `hooks/`: Custom React hooks (e.g., `useAuth`, `useProjects`) [web:102].
- `context/`: React Context providers for auth state or tenant selection.
- `services/`: API helper files that call the backend (e.g., `authService`, `projectService`) [web:102][web:111].
- `assets/`: Static files like images, icons, and CSS.

**Verification:**  
- Check that 1.2 has both the tree and explanations.  
- Say: “frontend structure written.”

---

## 4. Fill Development Setup Guide (very simple)

Under `## 2. Development Setup Guide`:
## 2. Development Setup Guide

### 2.1 Prerequisites

2.1 Prerequisites
Node.js version: 18.x or higher.​

npm or yarn installed.

Docker Desktop installed (for running database and containers).​

Git installed.


### 2.2 Environment Variables

List what you *plan* to use:

2.2 Environment Variables
Backend (backend/.env):

PORT: Backend server port (e.g., 5000).

DB_HOST: Database host (e.g., postgres).

DB_PORT: Database port (e.g., 5432).

DB_USER: Database username.

DB_PASSWORD: Database password.

DB_NAME: Database name.

JWT_SECRET: Secret key for signing JWT tokens.

JWT_EXPIRES_IN: Token expiry duration (e.g., 24h).

Frontend (frontend/.env):

VITE_API_BASE_URL or REACT_APP_API_BASE_URL: Base URL for backend API.

### 2.3 Installation Steps
Clone the repository using Git.

In the backend folder, run npm install to install backend dependencies.​

In the frontend folder, run npm install to install frontend dependencies.​

Ensure Docker Desktop is running if you plan to start the database with Docker
### 2.4 How to Run Locally
Start the database using Docker Compose (will be added later).

In backend, run npm run dev (or npm start) to start the API server on the configured port.

In frontend, run npm run dev or npm start to start the React app.

Open the browser at http://localhost:3000 to access the frontend.
### 2.5 How to Run Tests
In backend, run npm test to execute backend test suite.

In frontend, run npm test to execute frontend tests.

Tests will be added for critical modules like authentication and project management.

**Verification final:**  
- Confirm `technical-spec.md` contains:
  - Backend and frontend structures + explanations.  
  - Prerequisites, env vars, installation, run, and tests steps.  

When done, reply:

> “Technical specification (Task 1.2.2) completed.”
