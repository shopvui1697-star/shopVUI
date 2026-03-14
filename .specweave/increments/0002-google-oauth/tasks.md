# Tasks: Google OAuth2 Authentication

### T-001: Create packages/db with Prisma
**User Story**: US-001 | **Satisfies ACs**: AC-US1-01, AC-US1-02 | **Status**: [x] completed
**Test**: Given Prisma schema with User model → When `prisma generate` runs → Then PrismaClient is available with User type

### T-002: Add PostgreSQL to Docker Compose
**User Story**: US-001 | **Satisfies ACs**: AC-US1-03 | **Status**: [x] completed
**Test**: Given docker-compose.yml with postgres service → When `docker compose up postgres` → Then PostgreSQL accepts connections on port 5432

### T-003: Add auth types to packages/shared
**User Story**: US-001 | **Satisfies ACs**: AC-US1-01 | **Status**: [x] completed
**Test**: Given auth types in shared package → When imported → Then User, AuthTokens, AuthSession types available

### T-004: Create NestJS Auth Module
**User Story**: US-002 | **Satisfies ACs**: AC-US2-01 through AC-US2-06 | **Status**: [x] completed
**Test**: Given auth module with Google+JWT strategies → When /auth/google called → Then redirects to Google; When callback received → Then JWT tokens returned

### T-005: Create Web Auth (context, middleware, login page)
**User Story**: US-003 | **Satisfies ACs**: AC-US3-01 through AC-US3-04 | **Status**: [x] completed
**Test**: Given web app with auth → When unauthenticated user visits /account → Then redirected to /login; When signed in → Then user context available

### T-006: Create Admin Auth (context, middleware, login page)
**User Story**: US-004 | **Satisfies ACs**: AC-US4-01 through AC-US4-04 | **Status**: [x] completed
**Test**: Given admin app with auth → When unauthenticated user visits /dashboard → Then redirected to /login; When signed in → Then user context available
