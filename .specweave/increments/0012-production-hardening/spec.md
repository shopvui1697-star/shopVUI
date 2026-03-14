---
increment: 0012-production-hardening
title: Production Readiness Hardening
type: feature
priority: P0
status: completed
created: 2026-03-13T00:00:00.000Z
structure: user-stories
test_mode: TDD
coverage_target: 80
---

# Production Readiness Hardening

## Problem Statement

ShopVUI's core e-commerce features (products, cart, checkout, payments, reseller system, admin dashboard, channel sync) are functionally complete but lack the defensive layers required for production traffic: input validation, security headers, rate limiting, standardized errors, structured logging, database indexes, and frontend error resilience. Without these, the platform is vulnerable to malformed input, abuse, inconsistent error responses, poor observability, slow queries, and broken user experiences on failure.

## Goals

- Reject all invalid API payloads with field-level error messages before they reach business logic
- Protect the API surface with security headers and rate limiting
- Standardize every error response format across the entire API
- Provide structured request logging and a reliable health check for monitoring
- Optimize database query performance on high-traffic read paths
- Ensure frontend apps degrade gracefully on errors and load states

## User Stories

### US-001: Input Validation (P0)
**Project**: shopvui
**As a** platform operator
**I want** all API endpoints to validate incoming payloads with field-level rules
**So that** malformed or malicious input is rejected before reaching business logic

**Acceptance Criteria**:
- [x] **AC-US1-01**: Given class-validator and class-transformer are installed, when the API bootstraps, then a global ValidationPipe is registered in apps/api/src/main.ts with whitelist and transform options enabled
- [x] **AC-US1-02**: Given all 9 existing DTO files, when each is converted from a plain interface to a validated class, then every field has appropriate decorators (@IsNotEmpty, @IsEmail, @IsString, @IsNumber, @IsEnum, etc.)
- [x] **AC-US1-03**: Given a POST/PUT/PATCH request with an invalid body, when the ValidationPipe processes it, then the response is 400 with a JSON body containing field-level error messages
- [x] **AC-US1-04**: Given a POST/PUT/PATCH request with a valid body, when the ValidationPipe processes it, then the request passes through to the controller unchanged

---

### US-002: Security Middleware (P0)
**Project**: shopvui
**As a** platform operator
**I want** HTTP security headers and rate limiting on all API endpoints
**So that** the platform is protected against common web attacks and API abuse

**Acceptance Criteria**:
- [x] **AC-US2-01**: Given helmet is installed and configured, when any API response is returned, then it includes CSP, X-Frame-Options, and HSTS headers
- [x] **AC-US2-02**: Given @nestjs/throttler is installed and ThrottlerGuard is registered globally, when a client exceeds 100 requests per minute on general endpoints, then subsequent requests receive 429 Too Many Requests
- [x] **AC-US2-03**: Given auth endpoints have a stricter throttle override, when a client exceeds 5 requests per minute on auth routes, then subsequent requests receive 429 Too Many Requests
- [x] **AC-US2-04**: Given rate limiting is active, when a client stays within the configured limits, then requests are processed normally without throttle interference

---

### US-003: Global Error Handling (P0)
**Project**: shopvui
**As a** developer
**I want** a single global exception filter that standardizes all API error responses
**So that** consumers receive a consistent error format regardless of which endpoint fails

**Acceptance Criteria**:
- [x] **AC-US3-01**: Given a global HttpExceptionFilter is registered in main.ts, when any endpoint throws an HttpException, then the response body matches the shape { statusCode, message, error, timestamp, path }
- [x] **AC-US3-02**: Given an unhandled non-HTTP exception occurs, when the filter catches it, then the response is 500 with the standardized error shape and no internal stack trace is leaked
- [x] **AC-US3-03**: Given process bootstrap, when unhandledRejection or uncaughtException events fire, then they are caught by registered handlers that log the error and do not crash silently

---

### US-004: Structured Logging and Health Check (P0)
**Project**: shopvui
**As a** platform operator
**I want** structured request logging and a database-aware health check
**So that** I can monitor API traffic and detect database connectivity issues before they impact users

**Acceptance Criteria**:
- [x] **AC-US4-01**: Given a request logging middleware is registered in AppModule, when any HTTP request completes, then a structured log entry is emitted containing method, url, status code, and response time in milliseconds
- [x] **AC-US4-02**: Given the existing /api/health endpoint is enhanced, when the database is reachable, then it returns 200 with { status: "ok", database: "connected" } after running Prisma $queryRaw SELECT 1
- [x] **AC-US4-03**: Given the database is unreachable, when /api/health is called, then it returns 503 with { status: "error", database: "disconnected" }

---

### US-005: Database Performance Indexes (P1)
**Project**: shopvui
**As a** platform operator
**I want** database indexes on frequently-queried foreign keys and filter columns
**So that** read-heavy queries on orders, commissions, cart items, and products perform well under production load

**Acceptance Criteria**:
- [x] **AC-US5-01**: Given the Prisma schema is updated, when indexes are added for Order (userId, status, createdAt, resellerId, orderNumber), Commission (resellerId, status), CouponUsage (couponId, userId), CartItem (cartId, productId), OrderItem (orderId, productId), and Product (categoryId, isActive), then the schema is valid and prisma validate passes
- [x] **AC-US5-02**: Given the index definitions are in the schema, when prisma migrate dev is run, then a new migration is created and applied successfully without data loss
- [x] **AC-US5-03**: Given the migration is applied, when querying orders by userId+status or products by categoryId+isActive, then the database query planner uses the new indexes

---

### US-006: Frontend Error Resilience (P1)
**Project**: shopvui
**As a** customer or admin user
**I want** graceful error boundaries and loading states in both web and admin apps
**So that** I see helpful feedback instead of a blank screen when something fails or is loading

**Acceptance Criteria**:
- [x] **AC-US6-01**: Given Next.js App Router error boundaries, when an unhandled error occurs in any route segment of apps/web or apps/admin, then an error.tsx component renders with a user-friendly message and a retry button
- [x] **AC-US6-02**: Given loading.tsx files are added to route segments, when a page is loading via server components, then a loading skeleton or spinner is displayed
- [x] **AC-US6-03**: Given apps/web root layout, when the page renders, then it includes enhanced metadata with proper Open Graph tags (og:title, og:description, og:image, og:type)
- [x] **AC-US6-04**: Given a product detail page in apps/web, when the page renders, then it generates dynamic metadata using the product's name, description, and image for SEO and social sharing

## Out of Scope

- APM integration (Datadog, New Relic) -- future increment
- CI/CD pipeline hardening (deployment automation)
- Load testing and performance benchmarking
- Secrets management (Vault, AWS Secrets Manager)
- CDN or edge caching configuration
- Database connection pooling tuning (PgBouncer)
- Monitoring dashboards and alerting rules

## Technical Notes

### Dependencies
- class-validator, class-transformer (US-001)
- helmet (US-002)
- @nestjs/throttler (US-002)
- Prisma CLI for migration (US-005)

### Constraints
- All changes must be backward-compatible with existing API consumers
- Rate limit values should be configurable via environment variables
- Error responses must never leak internal stack traces or implementation details

## Success Metrics

- 100% of POST/PUT/PATCH endpoints reject invalid payloads with field-level errors
- All API responses include security headers (CSP, HSTS, X-Frame-Options)
- Zero unhandled promise rejections in production logs
- /api/health returns accurate database status within 2 seconds
- All listed database indexes are confirmed via migration
- No blank error screens in web or admin apps under failure conditions
