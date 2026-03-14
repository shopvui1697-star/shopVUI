---
status: completed
---
# Spec: Google OAuth2 Authentication

## Overview
Add Google OAuth2 sign-in for ShopVui web storefront and admin panel, backed by PostgreSQL (Prisma) and JWT session tokens.

## User Stories

### US-001: Database Setup
**As a** developer
**I want** a shared Prisma database package with User model
**So that** all apps can access user data consistently

**Acceptance Criteria:**
- [x] AC-US1-01: `packages/db` package exists with Prisma client and schema
- [x] AC-US1-02: User model has id, email, name, googleId, avatar, createdAt, updatedAt
- [x] AC-US1-03: PostgreSQL service runs via Docker Compose
- [x] AC-US1-04: Prisma migrations run successfully

### US-002: API Authentication
**As a** user
**I want** to sign in with Google via the API
**So that** I can access protected resources

**Acceptance Criteria:**
- [x] AC-US2-01: GET /api/auth/google redirects to Google OAuth consent
- [x] AC-US2-02: GET /api/auth/google/callback exchanges code for tokens and returns JWT
- [x] AC-US2-03: GET /api/auth/me returns current user (requires JWT)
- [x] AC-US2-04: POST /api/auth/refresh rotates refresh token
- [x] AC-US2-05: AuthGuard blocks unauthenticated API requests
- [x] AC-US2-06: JWT access token expires in 15 minutes, refresh token in 7 days

### US-003: Web Storefront Auth
**As a** shopper
**I want** to sign in with Google on the web store
**So that** I can access my account

**Acceptance Criteria:**
- [x] AC-US3-01: Google sign-in button on login page
- [x] AC-US3-02: Auth context provides user state to all components
- [x] AC-US3-03: NextJS middleware redirects unauthenticated users from protected pages
- [x] AC-US3-04: Tokens stored securely in httpOnly cookies

### US-004: Admin Panel Auth
**As an** admin
**I want** to sign in with Google on the admin panel
**So that** I can access admin features

**Acceptance Criteria:**
- [x] AC-US4-01: Google sign-in button on admin login page
- [x] AC-US4-02: Auth context provides user state
- [x] AC-US4-03: Middleware redirects unauthenticated users
- [x] AC-US4-04: Shares same API auth endpoints as web

## Out of Scope
- Email/password registration
- Password reset
- Role-based access control (RBAC)
- Social logins beyond Google
