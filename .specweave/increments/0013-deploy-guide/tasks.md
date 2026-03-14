---
increment: 0013-deploy-guide
title: "DEPLOY Guide Documentation"
status: active
by_user_story:
  US-001: [T-001, T-002]
  US-002: [T-003]
  US-003: [T-004]
  US-004: [T-005]
  US-005: [T-006]
total_tasks: 6
completed_tasks: 6
---

# Tasks: 0013-deploy-guide

## User Story: US-001 - Prerequisites and Environment Setup

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03
**Tasks**: 2 total, 2 completed

### T-001: Write Prerequisites Section

**User Story**: US-001
**Satisfies ACs**: AC-US1-01
**Status**: [x] completed

**Test Plan**:
- **Given** a new developer opens DEPLOY.md
- **When** they read the Prerequisites section
- **Then** they see all required tools (Node 20, pnpm 9.15.4, Docker, Docker Compose) with minimum versions listed

**Test Cases**:
1. **Manual review**: Confirm DEPLOY.md section 1 lists Node ≥20, pnpm ≥9.15.4, Docker, and Docker Compose with version numbers
   - Check: Each tool has a minimum version
   - Check: No tool is missing relative to what the project actually requires
   - **Coverage Target**: 100% of required tools documented

**Implementation**:
1. Verify `package.json` `engines` field and `.nvmrc` if present for exact Node version requirement
2. Verify pnpm version from `pnpm-workspace.yaml` or `package.json`
3. Write `## 1. Prerequisites` section in DEPLOY.md with a table or list: tool, version, install link

---

### T-002: Write Environment Variables Section

**User Story**: US-001
**Satisfies ACs**: AC-US1-02, AC-US1-03
**Status**: [x] completed

**Test Plan**:
- **Given** a developer needs to configure environment variables
- **When** they read section 2 of DEPLOY.md
- **Then** every variable the codebase reads is listed with description, required/optional flag, and example value, plus an inline `.env` template they can copy

**Test Cases**:
1. **Cross-reference check** against `apps/api/src/main.ts`, `apps/api/src/auth/strategies/*.ts`, `apps/api/src/app.module.ts`, `apps/web/src/lib/api.ts`, `apps/admin/src/lib/api.ts`:
   - All variables from plan.md env-var table are present (DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, WEB_URL, ADMIN_URL, PORT, NODE_ENV, THROTTLE_TTL, THROTTLE_LIMIT, NEXT_PUBLIC_API_URL)
   - Each has: Variable name | Required | Default | Description
   - **Coverage Target**: 100% of env vars read by the codebase are documented
2. **Inline template check**: DEPLOY.md includes a copyable `.env` block with all variables and placeholder values (no real secrets)

**Implementation**:
1. Cross-check plan.md env-var table against actual source files to confirm completeness
2. Write `## 2. Environment Variables` with per-service subsections (API, Web, Admin), each as a Markdown table
3. Append an inline `### .env Template` code block with all variables and example/placeholder values

---

## User Story: US-002 - Local Development Workflow

**Linked ACs**: AC-US2-01, AC-US2-02, AC-US2-03
**Tasks**: 1 total, 1 completed

### T-003: Write Local Development Section

**User Story**: US-002
**Satisfies ACs**: AC-US2-01, AC-US2-02, AC-US2-03
**Status**: [x] completed

**Test Plan**:
- **Given** a developer wants to run the project locally
- **When** they follow the instructions in section 3 of DEPLOY.md
- **Then** they can start all services via either `pnpm dev` or `docker compose up`, and can run individual apps via Turbo filters

**Test Cases**:
1. **pnpm flow check** (AC-US2-01): Section documents `pnpm install` then `pnpm dev`, lists expected ports web:3000 / admin:3001 / api:4000
   - Verify ports match `apps/api/src/main.ts` (PORT default 4000), `docker-compose.yml` port mappings
2. **Docker Compose flow check** (AC-US2-02): Section documents `docker compose up`, lists all four services (postgres, web, admin, api)
   - Verify service names match `docker-compose.yml`
3. **Turbo filter check** (AC-US2-03): Section shows `pnpm turbo dev --filter=api` (and web/admin equivalents)
   - Verify filter syntax is valid for Turborepo version in use
   - **Coverage Target**: 100% of documented commands verified against actual config files

**Implementation**:
1. Read `docker-compose.yml` to confirm service names and port mappings
2. Read `turbo.json` to confirm `dev` task name and filter syntax
3. Write `## 3. Local Development` with three subsections: 3a pnpm flow, 3b Docker Compose flow, 3c Turbo filters

---

## User Story: US-003 - Database Migration and Seeding

**Linked ACs**: AC-US3-01, AC-US3-02, AC-US3-03
**Tasks**: 1 total, 1 completed

### T-004: Write Database Setup Section

**User Story**: US-003
**Satisfies ACs**: AC-US3-01, AC-US3-02, AC-US3-03
**Status**: [x] completed

**Test Plan**:
- **Given** a developer needs to initialize or reset the database
- **When** they follow section 4 of DEPLOY.md
- **Then** they know which Prisma command to run in each situation (fresh setup, CI deploy, seed, reset) and what each command does

**Test Cases**:
1. **Migration commands check** (AC-US3-01): Documents `npx prisma migrate dev` (local/development) vs `npx prisma migrate deploy` (production/CI) with explanation of difference
   - Verify commands are run from `packages/db/` or via a workspace script
2. **Seed command check** (AC-US3-02): Documents `npx prisma db seed` and describes what seed data is created (users, products, categories, etc.)
   - Cross-check against `packages/db/prisma/seed.ts` to confirm seed description is accurate
3. **Reset command check** (AC-US3-03): Documents `npx prisma migrate reset` and `npx prisma generate`
   - **Coverage Target**: 100% of Prisma lifecycle commands covered

**Implementation**:
1. Read `packages/db/prisma/seed.ts` to describe what data is seeded
2. Confirm the working directory or script alias for Prisma commands (workspace root vs `packages/db`)
3. Write `## 4. Database Setup` with subsections 4a Migrations, 4b Seeding, 4c Reset & Regenerate

---

## User Story: US-004 - Google OAuth Configuration

**Linked ACs**: AC-US4-01, AC-US4-02, AC-US4-03
**Tasks**: 1 total, 1 completed

### T-005: Write Google OAuth Section

**User Story**: US-004
**Satisfies ACs**: AC-US4-01, AC-US4-02, AC-US4-03
**Status**: [x] completed

**Test Plan**:
- **Given** a developer needs to set up Google OAuth for authentication
- **When** they follow section 5 of DEPLOY.md
- **Then** they know how to create credentials in Google Cloud Console, which callback URLs to register, and which env vars to set

**Test Cases**:
1. **GCP steps check** (AC-US4-01): Section lists numbered steps: create project → enable Google+ API → create OAuth2 credentials → download JSON
2. **Callback URLs check** (AC-US4-02): Section lists exact callback URLs:
   - Local: `http://localhost:4000/api/auth/google/callback`
   - Production: placeholder pattern `https://api.yourdomain.com/api/auth/google/callback`
   - Verify local URL matches `apps/api/src/auth/strategies/google.strategy.ts` callback logic
3. **Env var mapping** (AC-US4-03): Section maps GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL to where they are used
   - **Coverage Target**: 100% of OAuth env vars documented with source file reference

**Implementation**:
1. Read `apps/api/src/auth/strategies/google.strategy.ts` to confirm callback URL pattern and env var names
2. Write `## 5. Google OAuth Configuration` with subsections 5a Creating Credentials, 5b Callback URLs, 5c Env Var Map

---

## User Story: US-005 - Production Deployment Checklist

**Linked ACs**: AC-US5-01, AC-US5-02, AC-US5-03
**Tasks**: 1 total, 1 completed

### T-006: Write Production Deployment Section

**User Story**: US-005
**Satisfies ACs**: AC-US5-01, AC-US5-02, AC-US5-03
**Status**: [x] completed

**Test Plan**:
- **Given** a DevOps engineer is preparing a production deployment
- **When** they read section 6 of DEPLOY.md
- **Then** they have a pre-deployment checklist, a command reference table, and notes on production-specific concerns

**Test Cases**:
1. **Pre-deployment checklist** (AC-US5-01): Section includes checkboxes covering: build passes, all env vars set, `prisma migrate deploy` run, CORS domains configured
   - Verify build command exists in root `package.json`
2. **Common commands table** (AC-US5-02): Table includes build, dev, test, lint, typecheck, format, and key Prisma commands
   - Verify each command against root `package.json` scripts and `turbo.json`
3. **Production concerns** (AC-US5-03): Section documents helmet CSP (production vs dev), JWT_SECRET rotation advice, DATABASE_URL with `?sslmode=require`, and API docs at `/api/docs`
   - Verify `/api/docs` endpoint exists in `apps/api/src/main.ts` (Swagger setup)
   - **Coverage Target**: 100% of production concerns listed in spec covered

**Implementation**:
1. Read root `package.json` scripts to build accurate command table
2. Read `apps/api/src/main.ts` to confirm Swagger endpoint path and helmet CSP conditional
3. Write `## 6. Production Deployment` with subsections 6a Pre-Deployment Checklist, 6b Common Commands, 6c Production Concerns
4. Add brief `## 7. Troubleshooting` section covering port conflicts, stale Docker volumes, and Prisma client not generated (bonus, supports 30-min onboarding goal)
