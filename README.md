# Employee & Project Management System (EMPMS)

A full-stack Employee & Project Management System built with React,
TypeScript, Node.js, Express, and MongoDB. It supports role-based access
for owners, project managers, and employees, with employee management,
project assignment, dashboard analytics, email OTP verification, and JWT
authentication.

## Live Demo

-   **Application:** https://project-management-seven-delta.vercel.app/
-   **GitHub repository:**
    https://github.com/ruffydotdev/project-management
-   **Backend API:** https://project-management-t3z5.onrender.com

> **Demo limitation:** The frontend is deployed on Vercel and the
> backend on Render. Email OTP registration may fail on Render's free
> web service because outbound SMTP traffic on ports 25, 465, and 587 is
> restricted. Local signup can work when valid SMTP credentials and a
> working MongoDB connection are configured. To enable production email,
> use an email provider's HTTPS API or hosting that supports SMTP. The
> deployed database is pre-seeded with demo data.



## Demo accounts and seeded data

The backend startup log reports that the database is already populated with **26 users and 50 projects**. The seed script defines 1 owner, 3 project managers, and 20 employees. These are development/demo credentials; the default seed password is `Password@123`.

| Role | Name | Email | Default password |
|---|---|---|---|
| Owner | Angela Vance | `owner@empms.com` | `Password@123` |
| Project Manager | Marcus Wright | `pm.marcus@empms.com` | `Password@123` |
| Project Manager | Elena Rostova | `pm.elena@empms.com` | `Password@123` |
| Project Manager | David Kim | `pm.david@empms.com` | `Password@123` |
| Employee | Liam Smith | `liam.smith@empms.com` | `Password@123` |
| Employee | Noah Brown | `noah.brown@empms.com` | `Password@123` |
| Employee | Oliver Miller | `oliver.miller@empms.com` | `Password@123` |
| Employee | James Martinez | `james.martinez@empms.com` | `Password@123` |
| Employee | Elijah Gonzalez | `elijah.gonzalez@empms.com` | `Password@123` |
| Employee | William Taylor | `william.taylor@empms.com` | `Password@123` |
| Employee | Lucas Jackson | `lucas.jackson6@empms.com` | `Password@123` |
| Employee | Henry White | `henry.white7@empms.com` | `Password@123` |
| Employee | Alexander Lewis | `alexander.lewis8@empms.com` | `Password@123` |
| Employee | Mason Clark | `mason.clark9@empms.com` | `Password@123` |
| Employee | Emma Smith | `emma.smith10@empms.com` | `Password@123` |
| Employee | Olivia Brown | `olivia.brown11@empms.com` | `Password@123` |
| Employee | Ava Miller | `ava.miller12@empms.com` | `Password@123` |
| Employee | Sophia Martinez | `sophia.martinez13@empms.com` | `Password@123` |
| Employee | Isabella Gonzalez | `isabella.gonzalez14@empms.com` | `Password@123` |
| Employee | Mia Taylor | `mia.taylor15@empms.com` | `Password@123` |
| Employee | Amelia Jackson | `amelia.jackson16@empms.com` | `Password@123` |
| Employee | Harper White | `harper.white17@empms.com` | `Password@123` |
| Employee | Evelyn Lewis | `evelyn.lewis18@empms.com` | `Password@123` |
| Employee | Abigail Clark | `abigail.clark19@empms.com` | `Password@123` |

## Features

### Authentication and security

-   Email registration and 6-digit OTP verification.
-   Login and logout.
-   JWT access tokens (15-minute lifespan).
-   Refresh tokens stored in secure, HttpOnly cookies (7-day lifespan).
-   Automatic access-token refresh and retry of eligible failed API
    requests.
-   Password hashing with `bcryptjs`.
-   Role-based access for `owner`, `project_manager`, and `employee`.
-   Input validation for email, Indian phone numbers, and date
    sequences.

### Dashboard

-   Total employee and project statistics.
-   Counts for Pending, In Progress, and Completed projects.
-   Department distribution and recent projects.

### Employee management

-   Search, filters, sorting, and server-side pagination.
-   Employee details and assigned-project references.
-   Create and update employee records according to permissions.
-   Owner-only employee deletion.

### Project management

-   Search, filters, sorting, and server-side pagination.
-   Create and update projects.
-   Assign multiple employees to projects.
-   Project details, team members, and timelines.
-   Deadline validation against the start date.
-   Owner-only project deletion.

### UI and experience

-   Responsive desktop and mobile layouts.
-   Dark theme with lime accents.
-   React Router navigation.
-   Redux Toolkit state management.
-   SCSS modules and `lucide-react` icons.

## Tech Stack

**Frontend:** React 18/19, TypeScript, Vite, Redux Toolkit, React
Router, Axios, SCSS Modules, `lucide-react`.

**Backend:** Node.js 18+, TypeScript, Express.js, MongoDB, Mongoose,
JWT, `bcryptjs`, Nodemailer.

## Roles and permissions

  -----------------------------------------------------------------------
  Role                                Typical permissions
  ----------------------------------- -----------------------------------
  `owner`                             Manage employees and projects,
                                      including deletion; access
                                      dashboard data.

  `project_manager`                   Create and update
                                      employees/projects as permitted by
                                      backend authorization.

  `employee`                          View permitted employee/project
                                      information according to backend
                                      rules and assignments.
  -----------------------------------------------------------------------

The backend is the source of truth for authorization. Frontend button
visibility is not a substitute for server-side permission checks.

## Demo accounts and seeded data

The backend startup log reports that the database is already populated
with **26 users and 50 projects**. Seeded accounts are intended for
demonstration and testing.

-   Use the demo credentials configured in the current seed scripts or
    provided by the project maintainer.
-   Check `Backend/src/scripts/seed.ts` and
    `Backend/src/scripts/seedOwner.ts` for the current seeded account
    details.
-   Seeded passwords may be shared development credentials; never reuse
    them for real accounts.
-   Do not publish real user passwords, password hashes, JWT secrets,
    OTPs, or email credentials in this README or source control.

## Run locally

### Prerequisites

-   Node.js 18 or newer
-   npm
-   MongoDB running locally, or a MongoDB Atlas database
-   Git

### 1. Clone the repository

``` bash
git clone https://github.com/ruffydotdev/project-management.git
cd project-management
```

The repository contains separate `Backend` and `Frontend` applications.

### 2. Configure and start the backend

``` bash
cd Backend
npm install
```

Copy `.env.example` to `.env` and configure it:

``` env
PORT=5555
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/empms_db
JWT_ACCESS_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_a_different_long_random_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_google_app_password
```

Notes: - For MongoDB Atlas, use your own connection string. - For Gmail
SMTP, use a Google App Password, not your normal Gmail password. - Keep
`.env` private; never commit it or put backend secrets in frontend
environment variables. - Generate strong, distinct values for both JWT
secrets. - Check `Backend/.env.example` and the actual backend code for
any additional required variables or differences in variable names.

Start the backend:

``` bash
cd Backend
npm install
npm run dev
```

The backend should be available at `http://localhost:5555` unless
configured otherwise. The API base path is `/api`.

### 3. Configure and start the frontend

Open a second terminal from the repository root:

``` bash
cd Frontend
npm install
```

Copy `Frontend/.env.example` to `Frontend/.env` and set the API URL:

``` env
VITE_API_BASE_URL=http://localhost:5555/api
```

Start Vite:

``` bash
npm run dev
```

Vite prints the local URL, typically `http://localhost:5173`.

### 4. Open the application

Visit `http://localhost:5173`. Ensure the backend and MongoDB are
running.

## Email OTP: local vs deployed

### Local development

Registration and OTP verification can work locally when: - MongoDB is
reachable. - The email username and password are valid. - SMTP access is
permitted by the email provider and local network. - Frontend/backend
URLs and CORS settings are correct.

### Deployed demo

The frontend is on Vercel and the backend is on Render. Render Free web
services restrict outbound SMTP traffic on ports 25, 465, and 587, which
can cause Nodemailer errors such as `ETIMEDOUT`. Therefore, registration
or resend-OTP email delivery may fail in the deployed demo even if SMTP
works locally.

To enable production email: 1. Use an email provider with an HTTPS API
(for example, Resend) from the backend, or choose hosting that supports
outbound SMTP. 2. Store the provider API key only in Render's backend
environment variables. 3. Update the backend email service and test real
delivery. 4. Disable development OTP fallback logging in production;
never print OTPs to production logs.

## API overview

Local base URL: `http://localhost:5555/api`

The exact implementation lives in `Backend/src/routes/`. Verify current
route names and payloads in source before integrating another client.

### Authentication --- `/auth`

  -----------------------------------------------------------------------
  Method                  Endpoint                Purpose
  ----------------------- ----------------------- -----------------------
  POST                    `/auth/register`        Register and initiate
                                                  email verification.

  POST                    `/auth/verify-email`    Verify the email OTP.

  POST                    `/auth/resend-otp`      Request another OTP.

  POST                    `/auth/login`           Authenticate and
                                                  establish a session.

  POST                    `/auth/refresh`         Obtain a new access
                                                  token using the
                                                  refresh-token cookie.

  POST                    `/auth/logout`          Clear the session.

  GET                     `/auth/me`              Get the current user's
                                                  profile.
  -----------------------------------------------------------------------

### Employees --- `/employees`

  -----------------------------------------------------------------------
  Method                  Endpoint                Purpose
  ----------------------- ----------------------- -----------------------
  GET                     `/employees`            List, search, filter,
                                                  sort, and paginate
                                                  employees.

  POST                    `/employees`            Create an employee
                                                  (permission
                                                  restricted).

  GET                     `/employees/:id`        Get employee details.

  PUT                     `/employees/:id`        Update an employee
                                                  (permission
                                                  restricted).

  DELETE                  `/employees/:id`        Delete an employee
                                                  (owner only).
  -----------------------------------------------------------------------

### Projects --- `/projects`

  -----------------------------------------------------------------------
  Method                  Endpoint                Purpose
  ----------------------- ----------------------- -----------------------
  GET                     `/projects`             List, search, filter,
                                                  sort, and paginate
                                                  projects within the
                                                  user's permitted scope.

  POST                    `/projects`             Create a project
                                                  (permission
                                                  restricted).

  GET                     `/projects/:id`         Get project details.

  PUT                     `/projects/:id`         Update a project
                                                  (permission
                                                  restricted).

  DELETE                  `/projects/:id`         Delete a project (owner
                                                  only).
  -----------------------------------------------------------------------

### Dashboard --- `/dashboard`

  -----------------------------------------------------------------------
  Method                  Endpoint                Purpose
  ----------------------- ----------------------- -----------------------
  GET                     `/dashboard/stats`      Retrieve dashboard
                                                  statistics and recent
                                                  project data.

  -----------------------------------------------------------------------

## Automatic token refresh flow

1.  The frontend sends an API request using the current access token.
2.  When the backend reports an expired/invalid access token, the Axios
    response interceptor attempts `POST /api/auth/refresh`.
3.  The browser sends the refresh-token cookie when cookie/CORS settings
    permit it.
4.  The backend validates the refresh token and returns a new access
    token.
5.  The frontend retries the original request with the new access token.
6.  If refresh fails because the session is invalid or expired, the app
    clears authentication state and asks the user to sign in again.

The refresh endpoint, response format, and cookie settings must match
the actual backend implementation. In production, configure CORS with
the exact frontend origin and credentials. For cross-site cookies,
verify `SameSite` and `Secure` settings for the deployed domains.

## Environment variables and secrets

-   `Backend/.env.example` --- backend configuration template.
-   `Frontend/.env.example` --- frontend configuration template.
-   Frontend variables prefixed with `VITE_` are included in browser
    code and must not contain secrets.
-   Never commit `.env` files, database credentials, JWT secrets, email
    passwords, API keys, or real OTPs.
-   If a secret is exposed, revoke or rotate it.

## Troubleshooting

### Frontend cannot reach the backend

-   Check `VITE_API_BASE_URL`.
-   Confirm the Render service is running and the URL is correct.
-   Check browser DevTools → Network and Console for CORS or request
    errors.
-   Ensure Render CORS configuration allows the exact deployed Vercel
    origin.

### OTP email times out on Render

-   Check Render service logs.
-   `ETIMEDOUT` with Gmail SMTP port 587 may be caused by Render's
    outbound SMTP restriction.
-   Use an HTTPS email API or hosting that permits SMTP.
-   Disable development OTP fallback logging in production.

### Login or refresh fails

-   Confirm cookies are set by the backend and sent by the browser.
-   Check Axios `withCredentials`, backend CORS credentials, cookie
    domain/path, `SameSite`, and `Secure` settings.
-   Ensure the frontend calls the correct refresh route and the response
    matches the Axios interceptor's expectations.

### Database connection fails

-   Verify `MONGODB_URI` on the backend.
-   For MongoDB Atlas, check database credentials, URI encoding for
    special characters, and network access rules.

### A route returns 404 on Vercel

-   Verify the deployment URL and Vercel root directory.
-   For React Router history routes, configure a Vercel rewrite to serve
    `index.html` for frontend routes.
-   Ensure API requests target Render, not the Vercel frontend domain.

## Project structure

``` text
project-management/
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.ts
│   ├── .env.example
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── store/
│   │   ├── styles/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## Development workflow

1.  Create a branch for your change.
2.  Keep validation and authorization enforced on the backend.
3.  Never commit environment files or secrets.
4.  Test registration, login, refresh, logout, employee management, and
    project management before submitting changes.

## License

No license is specified in this README. Add a license file if you intend
to permit reuse or redistribution.


