---
increment: 0013-deploy-guide
title: "DEPLOY Guide Documentation"
status: active
priority: P2
type: feature
created: 2026-03-14
---

# DEPLOY Guide Documentation

## Problem Statement

The shopvui monorepo lacks a centralized deployment and setup guide. New developers and operators must reverse-engineer the project structure, environment variables, Docker Compose configuration, and database migration steps from scattered source files. This slows onboarding and increases the risk of misconfigured environments.

## Goals

- Provide a single DEPLOY.md at the repo root that covers the full setup-to-run lifecycle
- Reduce new developer onboarding time from hours to under 30 minutes
- Document every required environment variable with purpose and example values
- Cover both local development and production deployment workflows

## User Stories

### US-001: Prerequisites and Environment Setup
**Project**: shopvui
**As a** new developer
**I want** a clear list of prerequisites and environment variable setup instructions
**So that** I can prepare my machine and configure the project without guessing

**Acceptance Criteria**:
- [x] **AC-US1-01**: DEPLOY.md lists all required tools with minimum versions (Node 20, pnpm 9.15.4, Docker, Docker Compose)
- [x] **AC-US1-02**: DEPLOY.md documents every environment variable grouped by service (API, Web, Admin) with description, required/optional flag, and example value
- [x] **AC-US1-03**: DEPLOY.md includes a `.env.example` reference or inline template showing all variables needed to start the project

### US-002: Local Development Workflow
**Project**: shopvui
**As a** developer
**I want** step-by-step instructions for running the monorepo locally
**So that** I can start developing with either pnpm dev or Docker Compose

**Acceptance Criteria**:
- [x] **AC-US2-01**: DEPLOY.md documents the pnpm-based local dev flow (pnpm install, pnpm dev) with expected ports (web:3000, admin:3001, api:4000)
- [x] **AC-US2-02**: DEPLOY.md documents the Docker Compose flow (docker compose up) including all four services (postgres, web, admin, api)
- [x] **AC-US2-03**: DEPLOY.md explains how to run individual apps or packages using Turbo filters (e.g., pnpm turbo dev --filter=api)

### US-003: Database Migration and Seeding
**Project**: shopvui
**As a** developer
**I want** database setup instructions covering migration and seeding
**So that** I can initialize and maintain the database schema correctly

**Acceptance Criteria**:
- [x] **AC-US3-01**: DEPLOY.md documents Prisma migration commands (npx prisma migrate dev, npx prisma migrate deploy) with when to use each
- [x] **AC-US3-02**: DEPLOY.md documents database seeding (npx prisma db seed) and explains what seed data is created
- [x] **AC-US3-03**: DEPLOY.md documents how to reset the database (npx prisma migrate reset) and regenerate the Prisma client

### US-004: Google OAuth Configuration
**Project**: shopvui
**As a** developer
**I want** instructions for setting up Google OAuth2 credentials
**So that** I can configure authentication for both the storefront and admin panel

**Acceptance Criteria**:
- [x] **AC-US4-01**: DEPLOY.md provides step-by-step Google Cloud Console instructions for creating OAuth2 credentials
- [x] **AC-US4-02**: DEPLOY.md lists the required callback URLs for local dev (localhost:4000/api/auth/google/callback) and production
- [x] **AC-US4-03**: DEPLOY.md maps OAuth environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL) to config files

### US-005: Production Deployment Checklist
**Project**: shopvui
**As a** DevOps engineer
**I want** a production deployment checklist and common commands reference
**So that** I can deploy and operate the application safely in production

**Acceptance Criteria**:
- [x] **AC-US5-01**: DEPLOY.md includes a pre-deployment checklist covering build verification, env vars, database migration, and CORS/domain configuration
- [x] **AC-US5-02**: DEPLOY.md provides a common commands reference table (build, dev, test, lint, typecheck, format, Prisma commands)
- [x] **AC-US5-03**: DEPLOY.md documents production-specific concerns: helmet CSP, JWT secret rotation, DATABASE_URL with SSL, and API docs endpoint (api/docs)

## Out of Scope

- CI/CD pipeline configuration (GitHub Actions, etc.)
- Cloud provider-specific deployment guides (AWS, GCP, Vercel)
- Kubernetes or container orchestration setup
- Monitoring and alerting configuration
- Channel sync (Shopee/TikTok) API credential setup (covered in separate docs)

## Technical Notes

### Dependencies
- Existing docker-compose.yml at repo root
- Prisma schema at packages/db/prisma/schema.prisma
- Turbo configuration at turbo.json

### Constraints
- Must be a single DEPLOY.md file at the repo root
- Must stay under 1500 lines
- Must not contain actual secrets or credentials

## Success Metrics

- New developer can run `pnpm dev` successfully within 15 minutes of reading the guide
- All environment variables documented match what the codebase actually reads
- Zero questions about "how to set up" in the first week after guide is published
