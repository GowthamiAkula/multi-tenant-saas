# Research Document

## 1. Multi-Tenancy Analysis
### 1.1 Approaches

#### a) Shared Database + Shared Schema (tenant_id column)

- One physical database.
- All tenants share the **same tables**.
- Every row has a `tenant_id` column to say which tenant owns that row.
- Access control is done completely in the application by always filtering by `tenant_id` [web:22][web:51].

#### b) Shared Database + Separate Schema (per tenant)

- One physical database.
- Each tenant gets its **own schema** inside that database, with its own set of tables (for example: `tenant1.users`, `tenant2.users`) [web:21][web:42].
- Data is separated by schema, not by a `tenant_id` column.
- The application connects to the same database but chooses the correct schema for each request [web:46].

#### c) Separate Database (per tenant)

- Each tenant has its **own database instance**.
- Tenant A’s data never lives in the same database as tenant B’s data, which gives the strongest isolation [web:21][web:54].
- The application chooses which database to connect to based on the tenant.
- Very good for strict compliance or very large tenants but more expensive to operate [web:34][web:54].


### 1.2 Comparison Table

| Approach                                   | Data isolation level           | Cost & resource usage      | Operational complexity           | Typical use case                           |
|-------------------------------------------|--------------------------------|----------------------------|----------------------------------|--------------------------------------------|
| Shared DB + shared schema                 | Low – all tenants share tables; relies on `tenant_id` filtering [web:21][web:22] | Lowest – only one schema and set of tables to manage [web:22][web:51] | Simple schema, but queries must always filter by tenant [web:21] | Early‑stage SaaS with many small tenants and similar needs |
| Shared DB + separate schema per tenant    | Medium – each tenant has its own schema inside same DB [web:42][web:46] | Medium – one DB but many schemas [web:43] | Higher – migrations must run on each schema [web:43] | Mid‑sized SaaS that needs some isolation and per‑tenant customization |
| Separate database per tenant              | High – each tenant has its own database instance [web:21][web:54] | Highest – many databases to host and monitor [web:21][web:54] | Highest – backup, restore, and migrations per tenant [web:47] | Large or high‑security tenants (finance, healthcare, enterprise) [web:54] |



### 1.3 Chosen Approach

For this project, the chosen multi‑tenancy strategy is **Shared Database + Shared Schema using a tenant_id column**.

#### Why this fits the project

- Simpler implementation: Only one set of tables and one migration path, which is important for a student project with limited time [web:21][web:52].
- Lower operational overhead: Only one PostgreSQL database to configure, monitor, back up, and containerize in Docker [web:22][web:51].
- Good enough isolation for this use case: As long as every query is filtered by `tenant_id` and access control is implemented correctly, tenants cannot see each other’s data [web:21][web:51].
- Easier analytics and reporting: Because all tenants share the same tables, it is easy to run global reports across tenants if needed [web:21].

#### How data isolation will be enforced

- Every core table (tenants, users, projects, tasks, audit_logs) will have a `tenant_id` column.
- All SELECT, INSERT, UPDATE, and DELETE queries in the backend will always include `tenant_id` in the WHERE clause or use row‑level policies to prevent cross‑tenant access [web:21][web:46].
- JWT tokens will contain the tenant identifier, and middleware will attach it to each request so controllers never trust client‑provided tenant IDs [web:41][web:55].
- Additional checks will be added in business logic to ensure that a user can act only within their tenant’s data.

#### Why other approaches were not chosen

- Shared DB + separate schema: Better isolation, but migrations must run per schema and logic to choose schema per request adds extra complexity that is not necessary for this assignment [web:43][web:46].
- Separate database per tenant: Provides the strongest isolation, but managing many databases, connection strings, and migrations would be overkill for this project, and would significantly increase Docker and deployment complexity [web:21][web:47][web:54].


## 2. Technology Stack Justification

### 2.1 Chosen Technologies

- Backend framework: Node.js with Express.js [web:63][web:66]
- Frontend framework: React.js [web:63][web:69]
- Database: PostgreSQL [web:61][web:68]
- Authentication method: JWT (JSON Web Tokens) with bcrypt for password hashing [web:71][web:74]
- Deployment & containerization: Docker and Docker Compose [web:62][web:68]
- Optional cloud platform: AWS (EC2 / ECS) or similar for future deployment [web:59][web:67]

### 2.2 Why These Technologies

#### Node.js + Express.js for backend

- Node.js is event‑driven and non‑blocking, so it can handle many API requests at the same time, which is important for multi‑tenant SaaS where many users may be active together [web:63][web:66].
- Express.js makes it easy to define REST endpoints, middleware for authentication, and error handling, which matches the requirement for 19+ API endpoints and proper error responses [web:63].
- The JavaScript ecosystem has many libraries for JWT, validation, logging, and PostgreSQL drivers, so building features like RBAC and audit logging becomes faster [web:66][web:71].

#### React.js for frontend

- React is component‑based, so pages like Login, Dashboard, Projects List, and Users List can be built from reusable UI components, which keeps the code organized [web:69].
- It is widely used for modern SaaS dashboards and works well with role‑based UI (show/hide elements depending on user role) [web:63][web:69].
- React has good support for responsive design and can integrate easily with REST APIs from the Node.js backend.

#### PostgreSQL as database

- PostgreSQL is a powerful relational database with strong support for constraints, foreign keys, and transactions, which helps enforce data integrity between tenants, users, projects, and tasks [web:34][web:61].
- It supports schemas and advanced SQL features, so it works well for shared‑schema multi‑tenancy and can be extended later if you want schema‑per‑tenant [web:34][web:64].
- PostgreSQL is open source and works smoothly inside Docker containers, which matches the project’s Docker requirement [web:62][web:68].

#### JWT + bcrypt for authentication

- JWT allows stateless authentication: each request carries a token that contains user id, tenant id, and role, which is ideal for scaling the backend and enforcing RBAC [web:71][web:74].
- Bcrypt is a well‑known hashing algorithm for securely storing passwords, making it harder for attackers to recover plain passwords even if the database is leaked [web:71].
- JWTs work well in browser‑based SPAs like React apps, where tokens can be stored and attached to each API call.

#### Docker + Docker Compose for deployment

- Docker lets backend, frontend, and database run as isolated containers, which matches the assignment requirement for containerization [web:62][web:68].
- Docker Compose allows starting all services (API, React app, PostgreSQL) with a single command, simplifies port mapping, and makes it easy for evaluators to run the project [web:62].

### 2.3 Alternatives Considered

- **Backend alternatives:** Frameworks like Django (Python) or Spring Boot (Java) provide batteries‑included features and strong type safety, but they require different languages and heavier setup compared to Node.js, which you already use and which integrates naturally with a React frontend [web:63][web:76].
- **Frontend alternatives:** Frameworks like Angular or Vue could also build a SPA dashboard, but React was chosen because of its simpler learning curve, rich ecosystem, and strong community support for SaaS‑style admin UIs [web:69][web:72].
- **Database alternatives:** MySQL or MongoDB are popular choices, but PostgreSQL offers better support for complex relational models, ACID transactions, and features like schemas that are helpful for multi‑tenant designs [web:34][web:61].
- **Authentication alternatives:** Session‑based auth with server‑side sessions or OAuth providers could be used, but JWT provides a stateless mechanism that works well with APIs and makes it easier to add mobile clients in the future [web:71][web:74].
- **Deployment alternatives:** Direct deployment on a VM without containers is possible, but Docker and Docker Compose give a reproducible environment so that the project behaves the same on any machine, which is valuable for evaluation and future cloud deployment [web:62][web:65].


## 3. Security Considerations

### 3.1 Security Measures List

- Strong tenant data isolation using tenant_id and strict query filtering [web:79][web:81]
- Role‑based access control (RBAC) with JWT tokens containing tenant and role info [web:82][web:88]
- Secure password storage using bcrypt and short‑lived JWTs with proper validation [web:71][web:91]
- Input validation and prepared statements to prevent SQL injection and XSS [web:83][web:95]
- HTTPS, secure CORS configuration, and protection of secrets using environment variables [web:79][web:95]
- Rate limiting and throttling on sensitive endpoints to reduce abuse and DoS risk [web:86][web:89]
- Centralized logging and audit trail for important actions (login, project changes, role changes) [web:78][web:79]

### 3.2 Details

#### Data isolation strategy

- The application uses a shared database with shared schema, and every core table includes a `tenant_id` column that links rows to a specific tenant [web:79][web:93].
- Backend queries never trust client‑provided tenant IDs; instead, they read the tenant identifier from the verified JWT and always filter by `tenant_id` in WHERE clauses or ORM conditions [web:79][web:81].
- Database constraints and indexes on `tenant_id` help prevent accidental cross‑tenant access and keep lookups fast even when many tenants exist [web:79].

#### Authentication and authorization approach

- Users log in with email and password; passwords are hashed with bcrypt before being stored so plain passwords are never saved [web:71][web:91].
- After login, the server issues a JWT containing user id, tenant id, and role (super admin, tenant admin, user); middleware validates the token on every request [web:82][web:88].
- Role‑based access control checks both the tenant id and the role from the token to decide whether a user can access or modify a resource, which prevents regular users from performing admin actions [web:82][web:94].

#### API and platform security

- All API endpoints will be exposed only over HTTPS in production, with CORS configured to allow requests from the trusted frontend origin and block others [web:79][web:95].
- Input validation and JSON schema checks will be applied to incoming data, and the database layer will use parameterized queries or an ORM to block SQL injection and other injection attacks [web:83][web:95].
- Rate limiting will cap how many requests a client can send in a short time window, protecting login and other sensitive endpoints from brute‑force and denial‑of‑service attempts [web:86][web:92].
- Logs and audit tables will record key security events such as logins, role changes, and cross‑tenant access attempts, which can be monitored to detect suspicious behavior early [web:78][web:79].
