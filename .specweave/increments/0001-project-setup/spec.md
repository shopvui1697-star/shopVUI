---
increment: 0001-project-setup
title: ShopVui Monorepo Scaffold
status: completed
priority: P0
type: feature
created: 2026-03-10T00:00:00.000Z
structure: user-stories
test_mode: TDD
coverage_target: 80
---

# ShopVui Monorepo Scaffold

## Problem Statement

ShopVui is a greenfield e-commerce platform with no codebase yet. The team needs a well-structured Turborepo monorepo that enforces consistent tooling, enables independent app development, and supports a TDD workflow from day one. Without proper scaffolding, teams will diverge on configurations, duplicate shared code, and lack a reliable local development environment.

## Goals

- Establish a Turborepo monorepo with pnpm workspaces as the single source of truth for all ShopVui code
- Provide runnable skeleton apps (web storefront, admin panel, API) that compile and pass linting out of the box
- Share TypeScript types and UI components across apps via internal packages
- Enable local development with a single command using Docker Compose
- Ensure CI-readiness so a pipeline can lint, typecheck, and test from the first commit

## User Stories

### US-001: Turborepo Monorepo Initialization
**Project**: shopvui
**As a** developer
**I want** a Turborepo monorepo with pnpm workspaces
**So that** all apps and packages live in one repository with efficient, cacheable builds

**Acceptance Criteria**:
- [x] **AC-US1-01**: Given a fresh clone, when I run `pnpm install`, then all workspace dependencies resolve without errors
- [x] **AC-US1-02**: Given the monorepo root, when I run `pnpm turbo build`, then Turborepo builds all apps and packages in the correct dependency order
- [x] **AC-US1-03**: Given the monorepo root, when I inspect `turbo.json`, then it defines `build`, `lint`, `typecheck`, and `test` pipelines with correct dependency graphs
- [x] **AC-US1-04**: Given `pnpm-workspace.yaml`, then it declares `apps/*` and `packages/*` as workspace globs

---

### US-002: NextJS 15 Web Storefront (PWA)
**Project**: shopvui
**As a** developer
**I want** a NextJS 15 App Router application in `apps/web` with PWA support
**So that** I have a runnable storefront skeleton that works offline-capable from day one

**Acceptance Criteria**:
- [x] **AC-US2-01**: Given `apps/web`, when I run `pnpm --filter web dev`, then the Next.js 15 dev server starts on a configurable port without errors
- [x] **AC-US2-02**: Given `apps/web`, when I inspect the project, then it uses the App Router (`app/` directory) with a root layout and a placeholder home page
- [x] **AC-US2-03**: Given `apps/web`, when I build and serve the app, then a valid `manifest.json` is served at `/manifest.json` with ShopVui metadata
- [x] **AC-US2-04**: Given `apps/web`, when I inspect `next.config`, then it is configured for PWA with a service worker registration entry point

---

### US-003: NextJS 15 Admin Panel
**Project**: shopvui
**As a** developer
**I want** a NextJS 15 App Router application in `apps/admin`
**So that** I have a runnable admin panel skeleton separate from the storefront

**Acceptance Criteria**:
- [x] **AC-US3-01**: Given `apps/admin`, when I run `pnpm --filter admin dev`, then the Next.js 15 dev server starts on a different port than the web app without errors
- [x] **AC-US3-02**: Given `apps/admin`, when I inspect the project, then it uses the App Router with a root layout and a placeholder dashboard page
- [x] **AC-US3-03**: Given `apps/admin`, when I run `pnpm --filter admin build`, then it compiles with zero TypeScript errors

---

### US-004: NestJS API Service
**Project**: shopvui
**As a** developer
**I want** a NestJS application in `apps/api` with Swagger documentation
**So that** I have a runnable API skeleton with auto-generated REST docs

**Acceptance Criteria**:
- [x] **AC-US4-01**: Given `apps/api`, when I run `pnpm --filter api start:dev`, then the NestJS server starts and responds to `GET /health` with a 200 status
- [x] **AC-US4-02**: Given `apps/api`, when I navigate to `/api/docs`, then Swagger UI renders the OpenAPI specification
- [x] **AC-US4-03**: Given `apps/api`, when I run `pnpm --filter api build`, then it compiles with zero TypeScript errors
- [x] **AC-US4-04**: Given `apps/api`, when I run `pnpm --filter api test`, then the default health-check test passes

---

### US-005: Shared Packages
**Project**: shopvui
**As a** developer
**I want** shared internal packages for types/utilities and UI components
**So that** common code is reused across apps without duplication

**Acceptance Criteria**:
- [x] **AC-US5-01**: Given `packages/shared`, when I export a TypeScript type and import it in `apps/web`, then the import resolves and typechecks without errors
- [x] **AC-US5-02**: Given `packages/shared`, when I export a utility function, then it is importable and callable from any app in the monorepo
- [x] **AC-US5-03**: Given `packages/ui`, when I export a React component, then it is importable and renderable in both `apps/web` and `apps/admin`
- [x] **AC-US5-04**: Given either shared package, when I run `pnpm turbo build`, then the package builds before its dependent apps

---

### US-006: Root Tooling Configuration
**Project**: shopvui
**As a** developer
**I want** shared ESLint, Prettier, and TypeScript base configurations at the monorepo root
**So that** all apps and packages follow consistent code quality standards

**Acceptance Criteria**:
- [x] **AC-US6-01**: Given the monorepo root, when I run `pnpm turbo lint`, then ESLint runs across all apps and packages with zero errors on the scaffolded code
- [x] **AC-US6-02**: Given any app or package, when I inspect its `tsconfig.json`, then it extends a shared base config from the root
- [x] **AC-US6-03**: Given the monorepo root, when I run `pnpm turbo typecheck`, then TypeScript typechecking passes across all workspaces with zero errors
- [x] **AC-US6-04**: Given any source file, when I run Prettier, then it formats consistently using the root `.prettierrc` configuration

---

### US-007: Docker Compose for Local Development
**Project**: shopvui
**As a** developer
**I want** a Docker Compose configuration for local development
**So that** I can spin up the entire stack with a single command

**Acceptance Criteria**:
- [x] **AC-US7-01**: Given the monorepo root, when I run `docker compose up`, then the web, admin, and api services all start and become reachable on their respective ports
- [x] **AC-US7-02**: Given `docker-compose.yml`, when I inspect the service definitions, then each app maps to its own named service with appropriate port bindings
- [x] **AC-US7-03**: Given the Docker setup, when I edit a source file in any app, then the change is reflected in the running container via volume mounts (hot reload)

## Out of Scope

- Database setup, ORM configuration, or migrations
- Authentication and authorization
- Product catalog, cart, or checkout features
- Admin CRUD operations
- Payment integration
- Deployment pipelines (CI config structure is in scope; actual deployment is not)
- Production-optimized Docker images (only local dev Docker Compose)

## Technical Notes

### Dependencies
- Turborepo (latest stable)
- pnpm (v9+)
- Next.js 15 with App Router
- NestJS (latest stable)
- TypeScript 5.x
- Docker and Docker Compose

### Constraints
- All apps must share a single TypeScript base config from the root
- Internal packages must be buildable and importable by any app
- The web storefront must include PWA manifest and service worker entry point
- NestJS API must expose Swagger documentation at `/api/docs`

### Architecture Decisions
- Turborepo over Nx for lighter-weight, zero-config monorepo orchestration
- pnpm over npm/yarn for strict dependency isolation and disk efficiency
- App Router over Pages Router to align with Next.js 15 conventions
- Separate `packages/shared` (types/utils) and `packages/ui` (components) to enforce clean dependency boundaries

## Success Metrics

- All apps start in dev mode with a single `pnpm turbo dev` command
- `pnpm turbo build` completes with zero errors across all workspaces
- `pnpm turbo lint` and `pnpm turbo typecheck` pass with zero warnings
- Docker Compose brings up all services with `docker compose up`
- A new developer can clone, install, and run the full stack in under 5 minutes
