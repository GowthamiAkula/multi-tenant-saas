## Step 1: Create the docs folder and file

1. In VS Code, open your project `multi-tenant-saas`.  
2. In the left file tree, **right‑click** on the root folder and choose **New Folder**.  
3. Name the folder: `docs`  
4. Right‑click on the new `docs` folder → **New File**.  
5. Name the file: `api.md`  

You should now see: `docs/api.md` in the explorer.[1]

***

## Step 2: Paste this API documentation into api.md

Open `docs/api.md` and paste everything below:

```markdown
# API Documentation

This document describes the main REST APIs for the Multi-Tenant SaaS Project Management App.  
All endpoints are prefixed with `/api`.

---

## 1. Authentication

### 1.1 Register

- **Method:** POST  
- **Endpoint:** `/api/auth/register`  
- **Auth required:** No

**Request body (JSON):**

```
{
  "email": "user@example.com",
  "password": "User@123",
  "name": "Demo User",
  "tenantSubdomain": "demo"
}
```

**Success response (201):**

```
{
  "success": true,
  "message": "User registered successfully"
}
```

**Error response example (400):**

```
{
  "success": false,
  "message": "Email already in use"
}
```

---

### 1.2 Login

- **Method:** POST  
- **Endpoint:** `/api/auth/login`  
- **Auth required:** No

**Request body (JSON):**

```
{
  "email": "admin@demo.com",
  "password": "Demo@123",
  "tenantSubdomain": "demo"
}
```

**Success response (200):**

```
{
  "success": true,
  "token": "<jwt-access-token>",
  "user": {
    "id": "uuid",
    "email": "admin@demo.com",
    "role": "tenant_admin",
    "tenantId": "uuid"
  }
}
```

**Error response example (401):**

```
{
  "success": false,
  "message": "Invalid credentials or tenant not found"
}
```

---

### 1.3 Current User

- **Method:** GET  
- **Endpoint:** `/api/auth/me`  
- **Auth required:** Yes (JWT)

**Headers:**

- `Authorization: Bearer <jwt-access-token>`

**Success response (200):**

```
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@demo.com",
    "role": "tenant_admin",
    "tenantId": "uuid"
  }
}
```

---

## 2. Tenants

(usually for super admin only)

### 2.1 List Tenants

- **Method:** GET  
- **Endpoint:** `/api/tenants`  
- **Auth required:** Yes (super_admin)

**Headers:**

- `Authorization: Bearer <jwt-access-token>`

**Success response (200):**

```
{
  "success": true,
  "tenants": [
    {
      "id": "uuid",
      "name": "Demo Tenant",
      "subdomain": "demo",
      "status": "active"
    }
  ]
}
```

---

### 2.2 Create Tenant

- **Method:** POST  
- **Endpoint:** `/api/tenants`  
- **Auth required:** Yes (super_admin)

**Request body:**

```
{
  "name": "New Tenant",
  "subdomain": "newtenant"
}
```

---

## 3. Users

### 3.1 List Users for Tenant

- **Method:** GET  
- **Endpoint:** `/api/users`  
- **Auth required:** Yes (tenant_admin or super_admin)

**Success response:**

```
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "admin@demo.com",
      "role": "tenant_admin"
    }
  ]
}
```

---

### 3.2 Create User in Tenant

- **Method:** POST  
- **Endpoint:** `/api/users`  
- **Auth required:** Yes (tenant_admin)

**Request body:**

```
{
  "email": "user3@demo.com",
  "password": "User@123",
  "name": "User Three",
  "role": "user"
}
```

---

## 4. Projects

### 4.1 List Projects

- **Method:** GET  
- **Endpoint:** `/api/projects`  
- **Auth required:** Yes

**Headers:**

- `Authorization: Bearer <jwt-access-token>`

**Query params (optional):**

- `page` – page number  
- `limit` – items per page

**Success response:**

```
{
  "success": true,
  "projects": [
    {
      "id": "uuid",
      "name": "Demo Project A",
      "status": "active"
    }
  ]
}
```

---

### 4.2 Create Project

- **Method:** POST  
- **Endpoint:** `/api/projects`  
- **Auth required:** Yes (tenant_admin)

**Request body:**

```
{
  "name": "New Project",
  "description": "Short description",
  "status": "active"
}
```

---

### 4.3 Get Single Project

- **Method:** GET  
- **Endpoint:** `/api/projects/:id`  
- **Auth required:** Yes

---

### 4.4 Update Project

- **Method:** PUT  
- **Endpoint:** `/api/projects/:id`  
- **Auth required:** Yes (tenant_admin)

**Request body example:**

```
{
  "name": "Updated Project Name",
  "status": "completed"
}
```

---

### 4.5 Delete Project

- **Method:** DELETE  
- **Endpoint:** `/api/projects/:id`  
- **Auth required:** Yes (tenant_admin)

---

## 5. Tasks

### 5.1 List Tasks for Project

- **Method:** GET  
- **Endpoint:** `/api/projects/:projectId/tasks`  
- **Auth required:** Yes

---

### 5.2 Create Task

- **Method:** POST  
- **Endpoint:** `/api/projects/:projectId/tasks`  
- **Auth required:** Yes

**Request body:**

```
{
  "title": "Task 1",
  "description": "Do something important",
  "status": "pending"
}
```

---

### 5.3 Update Task

- **Method:** PUT  
- **Endpoint:** `/api/tasks/:id`  
- **Auth required:** Yes

---

### 5.4 Delete Task

- **Method:** DELETE  
- **Endpoint:** `/api/tasks/:id`  
- **Auth required:** Yes

---

## 6. Health Check

### 6.1 Service Health

- **Method:** GET  
- **Endpoint:** `/api/health`  
- **Auth required:** No

**Success response (200):**

```
{
  "success": true,
  "message": "Backend is running"
}
```

If the database is not ready, this endpoint should return an error (non‑200) so automated checks know the app is not ready yet.

---

## 7. Authentication Explained

1. **Login** using `POST /api/auth/login` with email, password, and tenant subdomain.  
2. Backend returns a **JWT access token** in the `token` field.  
3. For all protected endpoints, send this header:

   - `Authorization: Bearer <jwt-access-token>`

4. If the token is missing, invalid, or expired, the API returns a 401 response:

```
{
  "success": false,
  "message": "Missing or invalid Authorization header"
}
```

This mechanism ensures that only authenticated users from the correct tenant can access their data.
```

Save the file.