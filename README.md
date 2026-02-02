# Multi-Tenant SaaS Project Management App

A web application where multiple companies (tenants) can manage their own projects and tasks in a single system, while keeping their data completely isolated from each other.  
This project is built as a production-ready, containerized full‑stack app to demonstrate multi‑tenant architecture, authentication, and DevOps practices.

---

## 1. Features

- Separate tenants with isolated data (each tenant has its own users, projects, and tasks).
- Super admin and tenant admin roles with different permissions.
- User registration and login with JWT‑based authentication.
- Tenant subdomain field on login (for example: `demo`) to route users to the correct tenant.
- Project and task management: create, update, and track task status per project.
- Dashboard showing key statistics such as total projects and total tasks for the logged‑in tenant.
- Automatic database migrations and seed data execution when Docker services start.
- Health‑check endpoint for deployment and automated evaluation of backend and database status.
- Full Docker setup with separate containers for PostgreSQL, backend API, and React frontend.

---

## 2. Technology Stack

### Frontend

- React (Create React App)
- React Router
- Axios
- HTML5, CSS3

### Backend

- Node.js
- Express.js
- Knex.js (SQL query builder, migrations, seeds)
- JSON Web Token (JWT) for authentication
- bcrypt for password hashing

### Database & DevOps

- PostgreSQL 16
- Docker & Docker Compose

---

## 3. Architecture Overview

The application is split into three main services:

- **Frontend**  
  React single‑page application running in the `frontend` container, exposed on port `3000`.  
  It communicates with the backend API using the base URL `http://localhost:5000`.

- **Backend API**  
  Node/Express application running in the `backend` container, exposed on port `5000`.  
  It handles authentication, tenant resolution, authorization, and all business logic for projects and tasks, and connects to PostgreSQL using Knex.

- **Database**  
  PostgreSQL instance running in the `database` container, exposed on port `5432`.  
  The backend connects to it using the Docker service name `database` instead of `localhost`.

Data is strictly separated by tenant: each tenant has its own users, projects, and tasks, enforced by `tenant_id` fields in database tables.

> Optional: You can create a diagram (for example using draw.io), save it as `docs/architecture.png`, and include it here:
>
> ```
> ![Architecture Diagram](llation & Setup

### 4.1 Prerequisites

- Docker installed
- Docker Compose installed
- Git installed (to clone the repository)

### 4.2 Run with Docker (recommended)

1. **Clone the repository**

   ```
   git clone <your-repo-url>
   cd multi-tenant-saas
   ```

2. **Start all services**

   ```
   docker compose up -d
   ```

   This single command will:

   - Start the PostgreSQL container.  
   - Run all database migrations.  
   - Run all seed scripts to insert demo tenants, users, projects, and tasks.  
   - Start the backend API on port `5000`.  
   - Start the React frontend on port `3000`.

3. **Open the application**

   - In your browser, go to: `http://localhost:3000`

4. **Login with demo tenant credentials**

   - Email: `admin@demo.com`  
   - Password: `Demo@123`  
   - Tenant Subdomain: `demo`

   After logging in, you should see the tenant dashboard with demo projects and tasks.

### 4.3 Run without Docker (local development, optional)

If you want to run the backend and frontend directly on your machine:

1. **Database**

   - Start a local PostgreSQL instance.  
   - Create a database named `saasdb`.  
   - Create a user matching the credentials you use in the backend environment (for example `saasuser / saaspass123`).

2. **Backend**

   ```
   cd backend
   npm install
   # configure .env to match your local DB settings
   npx knex migrate:latest
   npx knex seed:run
   npm run dev
   ```

   The backend will run on `http://localhost:5000` by default.

3. **Frontend**

   ```
   cd ../frontend
   npm install
   npm start
   ```

   The frontend will run on `http://localhost:3000`.  
   Make sure `REACT_APP_API_URL` in the frontend environment points to `http://localhost:5000`.

---

## 5. Environment Variables

For evaluation and normal usage, environment variables are primarily defined in `docker-compose.yml`.

### 5.1 Database (PostgreSQL container)

- `POSTGRES_DB` – Database name (e.g. `saasdb`)
- `POSTGRES_USER` – Database user (e.g. `saasuser`)
- `POSTGRES_PASSWORD` – Database password (e.g. `saaspass123`)

### 5.2 Backend API

- `DB_HOST` – Database host (set to `database`, the Docker service name)
- `DB_PORT` – Database port (`5432`)
- `DB_NAME` – Database name (`saasdb`)
- `DB_USER` – Database user (`saasuser`)
- `DB_PASSWORD` – Database password (`saaspass123`)
- `FRONTEND_URL` – Allowed origin for CORS (e.g. `http://localhost:3000`)
- `PORT` – Backend server port (`5000`)
- (Any JWT secret or token config if used in your `.env`)

### 5.3 Frontend

- `REACT_APP_API_URL` – Base URL of the backend API (e.g. `http://localhost:5000`)

During evaluation, it is enough to run `docker compose up -d`; all required environment values are already specified.

---

## 6. API Overview

Below is a brief list of the main API endpoints used by the frontend.

| Method | Path                | Description                              | Auth |
|-------|---------------------|------------------------------------------|------|
| POST  | `/api/auth/register`| Register a new user for a tenant         | No   |
| POST  | `/api/auth/login`   | Login and receive a JWT access token     | No   |
| GET   | `/api/projects`     | List projects for the current tenant     | Yes  |
| POST  | `/api/projects`     | Create a new project                     | Yes  |
| GET   | `/api/projects/:id` | Get details for a single project         | Yes  |
| PUT   | `/api/projects/:id` | Update an existing project               | Yes  |
| DELETE| `/api/projects/:id` | Delete a project                         | Yes  |
| GET   | `/api/health`       | Health check for backend and database    | No   |

Authentication‑protected routes require a valid JWT in the `Authorization: Bearer <token>` header, which is obtained from the login endpoint.

---

## 7. Seed Data and Test Credentials

When the Docker services start, migration and seed scripts automatically initialize the database with demo data. This includes:

- One active tenant:

  - Subdomain: `demo`  
  - Status: `active`

- Tenant admin user:

  - Email: `admin@demo.com`  
  - Password: `Demo@123`  
  - Role: `tenant_admin`  
  - Tenant: `demo`

- Regular users:

  - `user1@demo.com` – role `user`, tenant `demo`  
  - `user2@demo.com` – role `user`, tenant `demo`

Use these credentials to verify login, role‑based access, and tenant isolation.

---

## 8. Health Check

The backend exposes a health‑check endpoint:

- `GET /api/health`

This endpoint returns a JSON response only after:

- The database connection has been established.  
- All migrations have completed successfully.  
- Seed data has been loaded (where applicable).

This allows automated scripts to know when the application is ready for testing.

## ✅ Backend Verification 

The backend APIs are fully functional and verified using Docker.

### Health Check
GET /api/health

### Authentication
POST /api/auth/login  
Returns JWT token

### Projects
GET /api/projects

### Project Tasks
GET /api/projects/:projectId/tasks

📂 Screenshots for all verified APIs are available in `/screenshots`


# API Verification Screenshots

1. Docker containers running successfully
2. Backend health check
3. Authentication success
4. Project listing API
5. Project tasks API


