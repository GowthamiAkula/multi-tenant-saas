# Product Requirements Document (PRD)

## 1. User Personas

### 1.1 Super Admin

- Role description: System-level administrator who manages the overall SaaS platform and all tenant accounts.
- Key responsibilities: Approve or block tenants, manage global subscription plans, monitor platform health, view global audit logs.
- Main goals: Keep the platform stable, ensure fair resource usage, maintain security and compliance.
- Pain points: Hard to detect misbehaving tenants quickly, needs clear dashboards, must avoid manual repetitive work.


### 1.2 Tenant Admin

- Role description: Organization administrator responsible for managing users, projects, and subscriptions inside their own tenant.
- Key responsibilities: Invite and remove users, assign roles, create projects, manage subscription plan and limits.
- Main goals: Keep their team productive, ensure only authorized people access data, stay within plan limits.
- Pain points: Confusion about who has access, hitting plan limits unexpectedly, lack of simple views of projects and users.

### 1.3 End User

- Role description: Regular team member who works on assigned projects and tasks within a tenant.
- Key responsibilities: View assigned tasks, update task status, comment or add details, track project progress.
- Main goals: See a clear list of tasks, avoid missing deadlines, collaborate easily with teammates.
- Pain points: Hard to find tasks, unclear priorities, slow or confusing UI when switching between projects.


## 2. Functional Requirements

### 2.1 Auth Module

- FR-001: The system shall allow users to register and log in using email and password.
- FR-002: The system shall issue JWT access tokens with 24-hour expiry after successful login.
- FR-003: The system shall validate JWT tokens on every protected API request and reject invalid or expired tokens with HTTP 401.

### 2.2 Tenant Module

- FR-004: The system shall allow organizations to register as a new tenant with a unique subdomain.
- FR-005: The system shall store a subscription plan for each tenant (free, pro, enterprise).
- FR-006: The system shall enforce plan limits for max users and max projects before creating new users or projects.

### 2.3 User Module

- FR-007: The system shall allow tenant admins to create new users within their tenant.
- FR-008: The system shall allow tenant admins to assign a role (admin or user) to each user.
- FR-009: The system shall prevent two users in the same tenant from sharing the same email address.

### 2.4 Project Module

- FR-010: The system shall allow tenant admins and authorized users to create projects.
- FR-011: The system shall allow users to view only projects that belong to their tenant.
- FR-012: The system shall prevent creating a new project when the tenant has reached the project limit of its plan.

### 2.5 Task Module

- FR-013: The system shall allow users to create tasks under a project.
- FR-014: The system shall allow users to update task status (e.g., To Do, In Progress, Done).
- FR-015: The system shall record who created and last updated each task.


## 3. Non-Functional Requirements
### 3.1 Performance

- NFR-001: The system shall respond to 90% of API requests within 200 ms under normal load [web:89].
- NFR-002: The system shall support at least 100 concurrent users without timing out [web:93].

### 3.2 Security

- NFR-003: The system shall store all passwords using a strong hashing algorithm such as bcrypt [web:71][web:91].
- NFR-004: The system shall expire JWT access tokens within 24 hours and reject expired tokens [web:91][web:94].

### 3.3 Scalability

- NFR-005: The system shall be deployable using Docker and Docker Compose so that additional instances of the backend can be added when load increases [web:62][web:68].

### 3.4 Availability

- NFR-006: The system shall be designed so that if one tenant experiences heavy load, other tenants remain accessible (no single tenant can block the whole system) [web:81][web:87].

### 3.5 Usability

- NFR-007: The system shall provide a responsive UI that works on desktop, tablet, and mobile screen sizes [web:69].
- NFR-008: The system shall show clear error messages for common issues such as invalid login or exceeding plan limits.
