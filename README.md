# EMPMS — Employee & Project Management System

Production-ready, full-stack Employee & Project Management System built with the **MERN** stack (MongoDB, Express, React, Node.js), TypeScript, SCSS, and Redux Toolkit, adhering to a dark, minimal SaaS dashboard design system with vibrant lime accents.

---

## 🚀 Key Features

1. **Strict 2-Collection Architecture**:
   - `User`: Handles Owner, Project Manager, and Employee profiles, authentication, email OTP verification, and refresh session records.
   - `Project`: References `User` ObjectIds for `projectManager` and `assignedEmployees`.
2. **Authentication & Session Security**:
   - JWT access tokens (15 minutes) stored in memory.
   - HttpOnly, secure refresh tokens (1 day) rotated on every refresh.
   - Concurrency-safe Axios interceptors for automatic token refresh without request storms.
   - Bcrypt password hashing and SHA-256 OTP hashing.
   - Email verification with 6-digit OTP and 60-second resend cooldown.
3. **Role-Based Access Control (RBAC)**:
   - **Owner**: Full access to all projects, employees, and company-wide metrics.
   - **Project Manager**: Access scoped to projects they manage, assigned team members, and manager-specific metrics.
   - **Employee**: Read-only access to assigned projects and team colleagues.
   - Destructive deletion is restricted per specification with HTTP 403.
4. **Server-Side Pagination & Filtering**:
   - Employee & Project tables support server-side pagination, search by name/email, and filtering by department, designation, status, and priority.
5. **Dark SaaS Design System**:
   - Adheres to the strict 5-color palette (`#0B0B0D`, `#151519`, `#292930`, `#F5F5F7`, `#A3E635`).
   - Clean Inter typography, 4px/8px spacing grid, and subtle micro-interactions.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, SCSS, Redux Toolkit, React Router, Lucide Icons, Axios.
- **Backend**: Node.js, Express.js (ES Modules).
- **Database**: MongoDB with Mongoose.
- **Authentication**: JWT, bcryptjs, cookie-parser.

---

## 📦 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB running locally or on MongoDB Atlas (default: `mongodb://127.0.0.1:27017/empms_db`)

---

### 1. Backend Setup

```bash
cd Backend
npm install
npm run seed     # Seeds demo Owner, PMs, Employees, and Projects
npm run start    # Starts the API server on http://localhost:5000
```

#### Environment Variables (`Backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/empms_db
JWT_ACCESS_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Optional SMTP configuration for email delivery
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="EMPMS System" <noreply@empms.com>
```

> **Note**: In development mode without SMTP credentials, OTP verification codes are safely printed directly to the backend terminal log for immediate verification.

---

### 2. Frontend Setup

```bash
cd Frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

To validate production builds:
```bash
npm run build    # Compiles TypeScript and builds production bundles
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Owner / Admin** | `owner@empms.com` | `Password@123` |
| **Project Manager** | `pm.marcus@empms.com` | `Password@123` |
| **Employee** | `david.chen@empms.com` | `Password@123` |

---

## 📡 REST API Endpoints

### Authentication
- `POST /api/auth/register` — Register employee and trigger OTP email
- `POST /api/auth/verify-email` — Verify 6-digit email OTP
- `POST /api/auth/resend-otp` — Resend verification OTP (60s cooldown)
- `POST /api/auth/login` — Login and receive tokens
- `POST /api/auth/refresh` — Rotate refresh token and issue new access token
- `POST /api/auth/logout` — Revoke session and clear cookies
- `GET /api/auth/me` — Retrieve active authenticated user

### Employees
- `GET /api/employees` — Role-scoped employee listing with search, filtering, and pagination
- `POST /api/employees` — Create employee (Owner only)
- `GET /api/employees/:id` — View employee details and assigned projects
- `PUT /api/employees/:id` — Update employee (Owner only)
- `DELETE /api/employees/:id` — Delete employee (Owner only)

### Projects
- `GET /api/projects` — Role-scoped project listing with search, filtering, and pagination
- `POST /api/projects` — Create project (Owner & Project Manager)
- `GET /api/projects/:id` — View project details and assigned team members
- `PUT /api/projects/:id` — Update project (Owner & assigned Project Manager)
- `DELETE /api/projects/:id` — Delete project (Owner & assigned Project Manager)

### Dashboard
- `GET /api/dashboard/stats` — Real-time metrics and weekly velocity telemetry scoped dynamically from MongoDB
