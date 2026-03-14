---
increment: 0001-project-setup
title: "ShopVui Monorepo Scaffold"
total_tasks: 15
completed_tasks: 15
by_user_story:
  US-001: [T-001, T-002, T-003]
  US-002: [T-004, T-005]
  US-003: [T-006, T-007]
  US-004: [T-008, T-009]
  US-005: [T-010, T-011]
  US-006: [T-012, T-013]
  US-007: [T-014, T-015]
---

# Tasks: ShopVui Monorepo Scaffold

---

## User Story: US-001 - Turborepo Monorepo Initialization

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US1-04
**Tasks**: 3 total, 3 completed

---

### T-001: Initialize pnpm workspace and root package.json

**User Story**: US-001 | **Satisfies ACs**: AC-US1-01, AC-US1-04 | **Status**: [x] completed

**Test Plan**:
- **Given** a fresh clone of the repository
- **When** I run `pnpm install` at the monorepo root
- **Then** all workspace dependencies resolve without errors and `node_modules` is populated

**Test Cases**:
1. **Unit**: `packages/shared/src/__tests__/workspace.test.ts`
   - `workspaceGlobsAreDeclared()`: Read `pnpm-workspace.yaml` and assert it contains `apps/*` and `packages/*` globs
   - **Coverage Target**: 80%

**Implementation**:
1. Create `pnpm-workspace.yaml` with `apps/*`, `packages/*`, `tooling/*` globs
2. Create root `package.json` with `name: "shopvui"`, `private: true`, `packageManager: "pnpm@9.x"`, Turborepo as devDependency
3. Run `pnpm install` and confirm zero errors

---

### T-002: Create turbo.json with pipeline definitions

**User Story**: US-001 | **Satisfies ACs**: AC-US1-02, AC-US1-03 | **Status**: [x] completed

**Test Plan**:
- **Given** the monorepo root has a valid `turbo.json`
- **When** I run `pnpm turbo build`
- **Then** Turborepo builds all apps and packages in correct dependency order with zero errors

**Test Cases**:
1. **Unit**: `packages/shared/src/__tests__/turbo-config.test.ts`
   - `turboPipelineHasRequiredTasks()`: Parse `turbo.json` and assert `build`, `lint`, `typecheck`, `test`, `dev` tasks exist
   - `turboBuildDependsOnUpstream()`: Assert `build` task has `"dependsOn": ["^build"]`
   - **Coverage Target**: 80%

**Implementation**:
1. Create `turbo.json` with `$schema` field and tasks: `build` (dependsOn `^build`, outputs `.next/**` and `dist/**`), `lint` (dependsOn `^build`), `typecheck` (dependsOn `^build`), `test` (dependsOn `^build`), `dev` (cache: false, persistent: true)
2. Verify pipeline with `pnpm turbo build --dry-run`

---

### T-003: Create tooling config packages (TypeScript, ESLint, Prettier)

**User Story**: US-001 | **Satisfies ACs**: AC-US1-01, AC-US6-02, AC-US6-04 | **Status**: [x] completed

**Test Plan**:
- **Given** `tooling/typescript`, `tooling/eslint`, and `tooling/prettier` packages exist as workspace packages
- **When** an app's `tsconfig.json` extends `@shopvui/tsconfig/tsconfig.base.json`
- **Then** TypeScript resolves the base config and `pnpm install` resolves all tooling workspace dependencies

**Test Cases**:
1. **Unit**: `tooling/typescript/src/__tests__/tsconfig.test.ts`
   - `baseConfigHasStrictMode()`: Read `tooling/typescript/tsconfig.base.json` and assert `"strict": true`
   - `baseConfigTargetsESM()`: Assert `"module"` is set to a modern ESM target
   - **Coverage Target**: 80%

**Implementation**:
1. Create `tooling/typescript/` with `package.json` (`name: "@shopvui/tsconfig"`) and `tsconfig.base.json` (strict: true, ESM target, no emit)
2. Create `tooling/eslint/` with `package.json` (`name: "@shopvui/eslint-config"`) and flat config `index.js` with TypeScript plugin
3. Create `tooling/prettier/` with `package.json` (`name: "@shopvui/prettier-config"`) and `index.js` exporting config (trailingComma: "all", singleQuote: true, semi: true)
4. Create root `.prettierrc` referencing `@shopvui/prettier-config`

---

## User Story: US-002 - NextJS 15 Web Storefront (PWA)

**Linked ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04
**Tasks**: 2 total, 2 completed

---

### T-004: Scaffold apps/web Next.js 15 App Router application

**User Story**: US-002 | **Satisfies ACs**: AC-US2-01, AC-US2-02 | **Status**: [x] completed

**Test Plan**:
- **Given** `apps/web` is scaffolded with Next.js 15 App Router
- **When** I run `pnpm --filter web dev`
- **Then** the dev server starts on port 3000 without errors and serves the root layout and placeholder home page

**Test Cases**:
1. **Unit**: `apps/web/src/__tests__/home-page.test.tsx`
   - `homePageRendersPlaceholder()`: Render the home page component and assert a "ShopVui" heading is present
   - **Coverage Target**: 80%

**Implementation**:
1. Create `apps/web/package.json` with `name: "web"`, Next.js 15 and React 19 dependencies
2. Create `apps/web/app/layout.tsx` (root layout with `<html lang="en">` and `<body>`)
3. Create `apps/web/app/page.tsx` (placeholder home page with `<h1>ShopVui</h1>`)
4. Create `apps/web/tsconfig.json` extending `@shopvui/tsconfig/tsconfig.base.json` with Next.js plugin
5. Create `apps/web/next.config.ts` (minimal config, dev server on port 3000)
6. Configure Vitest with jsdom environment for component tests

---

### T-005: Add PWA manifest and service worker entry point to apps/web

**User Story**: US-002 | **Satisfies ACs**: AC-US2-03, AC-US2-04 | **Status**: [x] completed

**Test Plan**:
- **Given** `apps/web/public/manifest.json` exists and `next.config.ts` is configured for PWA
- **When** the app is built and I request `/manifest.json`
- **Then** a valid JSON with ShopVui metadata (name, short_name, start_url, display, icons) is returned

**Test Cases**:
1. **Unit**: `apps/web/src/__tests__/manifest.test.ts`
   - `manifestHasRequiredFields()`: Read `public/manifest.json` and assert required PWA fields exist (name, short_name, start_url, display, icons)
   - `manifestNameIsShopVui()`: Assert `name` field equals `"ShopVui"`
   - **Coverage Target**: 80%

**Implementation**:
1. Create `apps/web/public/manifest.json` with ShopVui PWA metadata (name, short_name, description, start_url: "/", display: "standalone", theme_color, icons array)
2. Update `apps/web/next.config.ts` with PWA configuration (use `@ducanh2912/next-pwa` or manual service worker registration)
3. Add `<link rel="manifest" href="/manifest.json">` to root layout `<head>`

---

## User Story: US-003 - NextJS 15 Admin Panel

**Linked ACs**: AC-US3-01, AC-US3-02, AC-US3-03
**Tasks**: 2 total, 2 completed

---

### T-006: Scaffold apps/admin Next.js 15 App Router application

**User Story**: US-003 | **Satisfies ACs**: AC-US3-01, AC-US3-02 | **Status**: [x] completed

**Test Plan**:
- **Given** `apps/admin` is scaffolded with Next.js 15 App Router
- **When** I run `pnpm --filter admin dev`
- **Then** the dev server starts on port 3001 (distinct from web's port 3000) without errors

**Test Cases**:
1. **Unit**: `apps/admin/src/__tests__/dashboard-page.test.tsx`
   - `dashboardPageRendersPlaceholder()`: Render the dashboard page component and assert "Admin Dashboard" heading is present
   - **Coverage Target**: 80%

**Implementation**:
1. Create `apps/admin/package.json` with `name: "admin"`, Next.js 15 and React 19 dependencies
2. Create `apps/admin/app/layout.tsx` (root layout)
3. Create `apps/admin/app/page.tsx` (placeholder dashboard page with `<h1>Admin Dashboard</h1>`)
4. Create `apps/admin/tsconfig.json` extending `@shopvui/tsconfig/tsconfig.base.json`
5. Create `apps/admin/next.config.ts` (dev server on port 3001)
6. Configure Vitest with jsdom environment for component tests

---

### T-007: Verify apps/admin TypeScript compilation

**User Story**: US-003 | **Satisfies ACs**: AC-US3-03 | **Status**: [x] completed

**Test Plan**:
- **Given** `apps/admin` is fully scaffolded with all files in place
- **When** I run `pnpm --filter admin build`
- **Then** it compiles with zero TypeScript errors

**Test Cases**:
1. **Unit**: `apps/admin/src/__tests__/config.test.ts`
   - `adminPackageJsonHasCorrectName()`: Assert `package.json` `name` field equals `"admin"`
   - `adminPortIsNotWebPort()`: Assert admin dev port config is `3001` (not `3000`)
   - **Coverage Target**: 80%

**Implementation**:
1. Ensure `apps/admin/tsconfig.json` has correct `include` paths for the `app/` directory
2. Verify all imports (layout, page) resolve correctly
3. Run `pnpm --filter admin build` and confirm zero type errors

---

## User Story: US-004 - NestJS API Service

**Linked ACs**: AC-US4-01, AC-US4-02, AC-US4-03, AC-US4-04
**Tasks**: 2 total, 2 completed

---

### T-008: Scaffold apps/api NestJS application with health endpoint

**User Story**: US-004 | **Satisfies ACs**: AC-US4-01, AC-US4-03, AC-US4-04 | **Status**: [x] completed

**Test Plan**:
- **Given** `apps/api` NestJS application is scaffolded with a HealthModule
- **When** the server starts and I send `GET /health`
- **Then** it responds with HTTP 200 and body `{ "status": "ok" }`

**Test Cases**:
1. **Unit**: `apps/api/src/health/__tests__/health.controller.spec.ts`
   - `getHealthReturnsOk()`: Instantiate `HealthController` directly and assert `getHealth()` returns `{ status: "ok" }`
   - **Coverage Target**: 85%
2. **Integration**: `apps/api/src/__tests__/app.e2e.spec.ts`
   - `healthEndpointReturns200()`: Bootstrap NestJS app in test mode, send `GET /health`, assert HTTP 200 and `{ status: "ok" }` body
   - **Coverage Target**: 85%

**Implementation**:
1. Create `apps/api/package.json` with `name: "api"`, NestJS core dependencies (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`)
2. Create `src/main.ts` (bootstrap), `src/app.module.ts` (root module)
3. Create `src/health/health.module.ts` and `src/health/health.controller.ts` (`GET /health` returns `{ status: "ok" }`)
4. Create `apps/api/tsconfig.json` extending base config with `emitDecoratorMetadata: true` and `experimentalDecorators: true`
5. Configure Vitest for unit tests and supertest for integration

---

### T-009: Add Swagger documentation to apps/api

**User Story**: US-004 | **Satisfies ACs**: AC-US4-02 | **Status**: [x] completed

**Test Plan**:
- **Given** NestJS API is configured with `SwaggerModule` at bootstrap
- **When** I navigate to `/api/docs`
- **Then** Swagger UI renders the OpenAPI specification with at least the health endpoint documented

**Test Cases**:
1. **Unit**: `apps/api/src/__tests__/swagger.test.ts`
   - `swaggerModuleIsBootstrapped()`: Assert `main.ts` calls `SwaggerModule.setup` with path `"api/docs"`
   - **Coverage Target**: 80%

**Implementation**:
1. Add `@nestjs/swagger` dependency to `apps/api/package.json`
2. Update `src/main.ts` to configure `SwaggerModule` using `DocumentBuilder` (title: "ShopVui API", version: "1.0")
3. Set global API prefix `/api` and Swagger path to `api/docs` (resolves to `/api/docs`)
4. Decorate `HealthController` with `@ApiTags('health')` and `@ApiOperation({ summary: 'Health check' })`

---

## User Story: US-005 - Shared Packages

**Linked ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04
**Tasks**: 2 total, 2 completed

---

### T-010: Scaffold packages/shared with types and utility functions

**User Story**: US-005 | **Satisfies ACs**: AC-US5-01, AC-US5-02, AC-US5-04 | **Status**: [x] completed

**Test Plan**:
- **Given** `packages/shared` exports `AppConfig`, `ApiResponse<T>` types and `formatCurrency` utility
- **When** I import them in `apps/web` or `apps/api`
- **Then** imports resolve and typecheck without errors, and `formatCurrency` returns correct formatted output

**Test Cases**:
1. **Unit**: `packages/shared/src/__tests__/utils.test.ts`
   - `formatCurrencyFormatsUSD()`: Call `formatCurrency(1999, "USD")` and assert the result is a non-empty currency string
   - `formatCurrencyHandlesZero()`: Call `formatCurrency(0, "USD")` and assert result is a valid string (not empty or undefined)
   - **Coverage Target**: 90%

**Implementation**:
1. Create `packages/shared/package.json` with `name: "@shopvui/shared"`, proper `exports` field (ESM + CJS), TypeScript build
2. Create `src/types.ts` exporting `AppConfig` interface and `ApiResponse<T>` generic type
3. Create `src/utils/currency.ts` exporting `formatCurrency(amount: number, currency: string): string` using `Intl.NumberFormat`
4. Create `src/index.ts` barrel re-exporting all types and utils
5. Create `packages/shared/tsconfig.json` extending `@shopvui/tsconfig/tsconfig.base.json`
6. Add Vitest config and run tests

---

### T-011: Scaffold packages/ui with shared React component library

**User Story**: US-005 | **Satisfies ACs**: AC-US5-03, AC-US5-04 | **Status**: [x] completed

**Test Plan**:
- **Given** `packages/ui` exports a `Button` component built with tsup
- **When** I import `Button` in `apps/web` or `apps/admin`
- **Then** the component renders without errors and responds to click events

**Test Cases**:
1. **Unit**: `packages/ui/src/__tests__/button.test.tsx`
   - `buttonRendersWithLabel()`: Render `<Button>Click me</Button>` and assert text "Click me" is in the document
   - `buttonAcceptsOnClickHandler()`: Render button with a mock `onClick` prop, simulate click, assert mock was called once
   - **Coverage Target**: 90%

**Implementation**:
1. Create `packages/ui/package.json` with `name: "@shopvui/ui"`, React peer dependencies, tsup build (`"build": "tsup src/index.ts --format esm,cjs --dts"`)
2. Create `src/components/Button.tsx` (accepts `children`, `onClick`, optional `variant?: "primary" | "secondary"`)
3. Create `src/index.ts` barrel re-exporting `Button`
4. Create `packages/ui/tsconfig.json` extending base config with `"jsx": "react-jsx"`
5. Add Vitest config with `environment: "jsdom"` and `@testing-library/react`
6. Run tests and `pnpm build` to verify tsup output

---

## User Story: US-006 - Root Tooling Configuration

**Linked ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-04
**Tasks**: 2 total, 2 completed

---

### T-012: Configure ESLint across all workspaces

**User Story**: US-006 | **Satisfies ACs**: AC-US6-01 | **Status**: [x] completed

**Test Plan**:
- **Given** ESLint is configured at the monorepo root via `@shopvui/eslint-config`
- **When** I run `pnpm turbo lint`
- **Then** ESLint runs across all apps and packages with zero errors on the scaffolded code

**Test Cases**:
1. **Unit**: `tooling/eslint/src/__tests__/eslint-config.test.ts`
   - `eslintConfigExportsArray()`: Import `@shopvui/eslint-config` and assert it exports a non-empty array (ESLint v9 flat config format)
   - **Coverage Target**: 80%

**Implementation**:
1. Finalize `tooling/eslint/index.js` with TypeScript-aware rules using `typescript-eslint` flat config
2. Create root `eslint.config.js` extending `@shopvui/eslint-config`
3. Add `"lint": "eslint ."` script to each workspace `package.json`
4. Run `pnpm turbo lint` and resolve any zero-tolerance errors on scaffolded code

---

### T-013: Verify TypeScript typecheck and Prettier formatting across all workspaces

**User Story**: US-006 | **Satisfies ACs**: AC-US6-02, AC-US6-03, AC-US6-04 | **Status**: [x] completed

**Test Plan**:
- **Given** all workspaces extend `@shopvui/tsconfig/tsconfig.base.json` and `.prettierrc` references `@shopvui/prettier-config`
- **When** I run `pnpm turbo typecheck`
- **Then** TypeScript typechecking passes across all workspaces with zero errors

**Test Cases**:
1. **Unit**: `tooling/typescript/src/__tests__/base-config.test.ts`
   - `allWorkspaceTsconfigsExtendBase()`: For each known workspace directory, read its `tsconfig.json` and assert `extends` references `@shopvui/tsconfig`
   - **Coverage Target**: 80%

**Implementation**:
1. Add `"typecheck": "tsc --noEmit"` script to each app and package `package.json`
2. Verify all workspace `tsconfig.json` files have correct `extends`, `include`, and `exclude` fields
3. Run `pnpm turbo typecheck` and fix any type errors
4. Run `prettier --check .` and ensure all scaffolded files are consistently formatted

---

## User Story: US-007 - Docker Compose for Local Development

**Linked ACs**: AC-US7-01, AC-US7-02, AC-US7-03
**Tasks**: 2 total, 2 completed

---

### T-014: Create docker-compose.yml with all three services

**User Story**: US-007 | **Satisfies ACs**: AC-US7-01, AC-US7-02 | **Status**: [x] completed

**Test Plan**:
- **Given** `docker-compose.yml` defines `web`, `admin`, and `api` services with port mappings
- **When** I run `docker compose up`
- **Then** all three services start and become reachable at localhost:3000 (web), localhost:3001 (admin), and localhost:4000 (api)

**Test Cases**:
1. **Unit**: `scripts/__tests__/docker-compose.test.ts`
   - `dockerComposeHasAllServices()`: Parse `docker-compose.yml` and assert `web`, `admin`, `api` service keys exist
   - `dockerComposeHasCorrectPorts()`: Assert port bindings are `"3000:3000"`, `"3001:3001"`, `"4000:4000"` respectively
   - **Coverage Target**: 80%

**Implementation**:
1. Create `docker-compose.yml` with three named services: `web`, `admin`, `api`
2. Each service uses a `Dockerfile.dev` in its respective `apps/*` directory
3. Port bindings: `3000:3000` (web), `3001:3001` (admin), `4000:4000` (api)
4. Create per-app `Dockerfile.dev` using Node 20 LTS, installing deps inside container, running the dev server
5. Create root `.dockerignore` excluding `node_modules`, `.next`, `dist`, `.specweave`

---

### T-015: Configure Docker volume mounts for hot reload

**User Story**: US-007 | **Satisfies ACs**: AC-US7-03 | **Status**: [x] completed

**Test Plan**:
- **Given** Docker Compose services have volume mounts for source directories but not `node_modules`
- **When** I edit a source file on the host
- **Then** the running container picks up the change (Next.js/NestJS hot reload) without a container restart

**Test Cases**:
1. **Unit**: `scripts/__tests__/docker-volumes.test.ts`
   - `dockerComposeHasVolumeMountsForSrc()`: Parse `docker-compose.yml` and assert each service has at least one volume mounting the app's source directory
   - `nodeModulesNotMountedFromHost()`: Assert no volume mount references `./node_modules` from the host path
   - **Coverage Target**: 80%

**Implementation**:
1. Update `docker-compose.yml` volume mounts to target only source dirs (e.g., `./apps/web:/app/apps/web` excluding node_modules via named volume)
2. Use a named Docker volume for each service's `node_modules` to prevent host/container binary conflicts
3. Verify Next.js Fast Refresh and NestJS hot reload (`--watch`) are active in the container dev commands
4. Add inline comments in `docker-compose.yml` documenting the volume strategy
