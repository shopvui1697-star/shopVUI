---
increment: 0012-production-hardening
title: "Production Readiness Hardening"
status: active
generated_by: sw:test-aware-planner
total_tasks: 13
completed_tasks: 13
by_user_story:
  US-001: [T-004, T-005]
  US-002: [T-006, T-007]
  US-003: [T-001, T-002, T-003]
  US-004: [T-008, T-009]
  US-005: [T-010]
  US-006: [T-011, T-012, T-013]
---

# Tasks: 0012 - Production Readiness Hardening

<!-- Implementation order: US-003 → US-001 → US-002 → US-004 → US-005 → US-006 -->

---

## User Story: US-003 - Global Error Handling

**Linked ACs**: AC-US3-01, AC-US3-02, AC-US3-03
**Tasks**: 3 total, 3 completed

### T-001: Create HttpExceptionFilter with standardized error shape

**User Story**: US-003
**Satisfies ACs**: AC-US3-01, AC-US3-02
**Status**: [x] completed

**Test Plan**:
- **Given** the HttpExceptionFilter is registered globally in main.ts
- **When** an endpoint throws an HttpException (e.g., 404 NotFoundException)
- **Then** the response body matches `{ statusCode, message, error, timestamp, path }`

- **Given** an endpoint throws an unexpected non-HTTP error
- **When** the filter catches it
- **Then** the response is 500 with the standardized shape and no stack trace in the body

**Test Cases**:
1. **Unit**: `apps/api/src/common/filters/http-exception.filter.spec.ts`
   - `catchHttpException_returnsStandardShape()`: Mock ExecutionContext + HttpException(404), assert response body has statusCode/message/error/timestamp/path
   - `catchNonHttpException_returns500WithNoStackTrace()`: Throw generic `new Error('boom')`, assert statusCode=500, body has no `stack` key
   - `catchValidationException_preservesArrayMessages()`: Throw BadRequestException with array message (ValidationPipe output), assert message is preserved as array
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/test/error-handling.e2e-spec.ts`
   - `GET /api/nonexistent returns 404 with standard shape`
   - `POST /api/products with bad data returns 400 with field messages`
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/common/filters/http-exception.filter.ts` using `@Catch()` (no args = catches all)
2. Branch on `instanceof HttpException` — extract status + response; preserve array messages from ValidationPipe
3. For non-HttpException: log full error server-side, return 500 with generic message
4. Register via `app.useGlobalFilters(new HttpExceptionFilter())` in `apps/api/src/main.ts`

---

### T-002: Verify error shape never leaks stack traces

**User Story**: US-003
**Satisfies ACs**: AC-US3-02
**Status**: [x] completed

**Test Plan**:
- **Given** the HttpExceptionFilter is active
- **When** any unhandled error (database error, null reference, etc.) reaches the filter
- **Then** the response body does not contain `stack`, `cause`, or internal file paths

**Test Cases**:
1. **Unit**: `apps/api/src/common/filters/http-exception.filter.spec.ts`
   - `catchDatabaseError_responseBodyHasNoStack()`: Throw a Prisma-style error, assert body keys are exactly `[statusCode, message, error, timestamp, path]`
   - **Coverage Target**: 90%

**Implementation**:
1. In the non-HttpException branch, construct the response object with only the whitelisted keys
2. Add server-side `Logger.error(error.stack)` call to preserve observability without leaking to client

---

### T-003: Register process-level unhandledRejection and uncaughtException handlers

**User Story**: US-003
**Satisfies ACs**: AC-US3-03
**Status**: [x] completed

**Test Plan**:
- **Given** the API process starts
- **When** `process.on('unhandledRejection', ...)` and `process.on('uncaughtException', ...)` handlers are registered in main.ts
- **Then** unhandled rejections are logged without crashing; uncaught exceptions are logged and the process exits with code 1

**Test Cases**:
1. **Unit**: `apps/api/src/main.spec.ts`
   - `unhandledRejection_logsErrorWithoutExit()`: Spy on `Logger.error`, emit `unhandledRejection`, assert logger called, `process.exit` not called
   - `uncaughtException_logsAndExits()`: Spy on `process.exit`, emit `uncaughtException`, assert `process.exit(1)` called
   - **Coverage Target**: 85%

**Implementation**:
1. In `apps/api/src/main.ts`, after `await app.init()` and before `app.listen()`:
   ```ts
   process.on('unhandledRejection', (reason) => logger.error('Unhandled Rejection', reason));
   process.on('uncaughtException', (error) => { logger.error('Uncaught Exception', error); process.exit(1); });
   ```

---

## User Story: US-001 - Input Validation

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US1-04
**Tasks**: 2 total, 2 completed

### T-004: Install dependencies and register global ValidationPipe

**User Story**: US-001
**Satisfies ACs**: AC-US1-01, AC-US1-03, AC-US1-04
**Status**: [x] completed

**Test Plan**:
- **Given** class-validator and class-transformer are installed and ValidationPipe is registered globally with whitelist and transform options
- **When** a POST request arrives with an invalid payload
- **Then** the response is 400 with field-level error messages in the body

- **Given** a POST request with a valid payload
- **When** ValidationPipe processes it
- **Then** the request passes through to the controller unchanged

**Test Cases**:
1. **Integration**: `apps/api/test/validation.e2e-spec.ts`
   - `POST /api/auth/register with missing email returns 400 with field errors`
   - `POST /api/auth/register with valid body returns 201`
   - `POST /api/products with negative price returns 400`
   - `POST request with extra unknown field returns 400 (forbidNonWhitelisted)`
   - **Coverage Target**: 90%

**Implementation**:
1. `pnpm --filter @shopvui/api add class-validator class-transformer`
2. In `apps/api/src/main.ts`, register before `app.listen()`:
   ```ts
   app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
   ```
3. Confirm `emitDecoratorMetadata: true` in `apps/api/tsconfig.json`

---

### T-005: Convert all 9 DTO files from interfaces to validated classes

**User Story**: US-001
**Satisfies ACs**: AC-US1-02
**Status**: [x] completed

**Test Plan**:
- **Given** each DTO is converted to a class with class-validator decorators
- **When** each DTO is instantiated with invalid data and validated via `validate(plainToInstance(...))`
- **Then** the appropriate decorator violations are reported for each invalid field

**Test Cases**:
1. **Unit**: `apps/api/src/auth/dto/create-reseller.dto.spec.ts`
   - `LoginDto_invalidEmail_failsIsEmail()`: Pass `{ email: 'notEmail', password: 'x' }`, assert errors contain `email`
   - `CreateResellerDto_shortPassword_failsMinLength()`: Pass password `'abc'`, assert `MinLength` violation reported
   - **Coverage Target**: 90%

2. **Unit**: `apps/api/src/admin/dto/admin-order-filters.dto.spec.ts`
   - `AdminOrderFiltersDto_invalidStatus_failsIsEnum()`
   - `AdminOrderFiltersDto_invalidPage_failsIsInt()`
   - `BulkOrderActionDto_nonArrayOrderIds_failsIsArray()`
   - **Coverage Target**: 90%

3. **Unit**: `apps/api/src/admin/dto/admin-product.dto.spec.ts`
   - `AdminProductDto_missingName_failsIsNotEmpty()`
   - `AdminProductDto_negativePriceInteger_failsMin()`
   - **Coverage Target**: 90%

**Implementation**:
Convert each file from `export interface` to `export class` with decorators per plan.md D5 table:
- `create-reseller.dto.ts` (CreateResellerDto + LoginDto)
- `admin-order-filters.dto.ts` (AdminOrderFiltersDto + UpdateOrderStatusDto + BulkOrderActionDto)
- `admin-product.dto.ts`
- `admin-coupon.dto.ts`
- `admin-reseller.dto.ts`
- `admin-customer.dto.ts`
- `admin-analytics.dto.ts`
- `price-tier.dto.ts`
- `coupon.dto.ts`

---

## User Story: US-002 - Security Middleware

**Linked ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04
**Tasks**: 2 total, 2 completed

### T-006: Install helmet and register security headers middleware

**User Story**: US-002
**Satisfies ACs**: AC-US2-01
**Status**: [x] completed

**Test Plan**:
- **Given** helmet is installed and `app.use(helmet())` is the first middleware registered in main.ts
- **When** any API response is returned
- **Then** response headers include `X-Frame-Options`, `Strict-Transport-Security`, and `Content-Security-Policy`

**Test Cases**:
1. **Integration**: `apps/api/test/security-headers.e2e-spec.ts`
   - `anyEndpoint_returnsXFrameOptionsHeader()`
   - `anyEndpoint_returnsStrictTransportSecurityHeader()`
   - `anyEndpoint_returnsContentSecurityPolicyHeader()`
   - `swaggerUI_notBrokenByCSP_inDev()`: In non-production mode, assert Swagger docs route still returns 200
   - **Coverage Target**: 85%

**Implementation**:
1. `pnpm --filter @shopvui/api add helmet`
2. In `apps/api/src/main.ts`, as the very first setup call:
   ```ts
   app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' }));
   ```

---

### T-007: Install @nestjs/throttler and configure rate limiting tiers

**User Story**: US-002
**Satisfies ACs**: AC-US2-02, AC-US2-03, AC-US2-04
**Status**: [x] completed

**Test Plan**:
- **Given** ThrottlerModule is configured with 100 req/min general limit via APP_GUARD
- **When** a client sends 101 requests in one minute to a general endpoint
- **Then** the 101st request receives 429 Too Many Requests

- **Given** auth endpoints have a @Throttle override of 5 req/min
- **When** a client sends 6 requests to an auth route in one minute
- **Then** the 6th request receives 429

- **Given** /api/health has @SkipThrottle()
- **When** a monitoring system polls it continuously
- **Then** it never receives 429

**Test Cases**:
1. **Integration**: `apps/api/test/rate-limiting.e2e-spec.ts`
   - `generalEndpoint_exceeds100rpm_returns429()`
   - `authEndpoint_exceeds5rpm_returns429()`
   - `healthEndpoint_isNeverThrottled()`: Call /api/health 200 times, assert all responses are 200
   - `withinLimit_requestProcessedNormally()`: Send 50 requests, assert all succeed
   - **Coverage Target**: 85%

**Implementation**:
1. `pnpm --filter @shopvui/api add @nestjs/throttler`
2. In `apps/api/src/app.module.ts`:
   ```ts
   ThrottlerModule.forRoot([{ ttl: parseInt(process.env.THROTTLE_TTL || '60000'), limit: parseInt(process.env.THROTTLE_LIMIT || '100') }])
   { provide: APP_GUARD, useClass: ThrottlerGuard }
   ```
3. Add `@Throttle([{ default: { ttl: 60000, limit: 5 } }])` on `apps/api/src/auth/auth.controller.ts`
4. Add `@SkipThrottle()` on `apps/api/src/health/health.controller.ts`

---

## User Story: US-004 - Structured Logging and Health Check

**Linked ACs**: AC-US4-01, AC-US4-02, AC-US4-03
**Tasks**: 2 total, 2 completed

### T-008: Create RequestLoggerMiddleware

**User Story**: US-004
**Satisfies ACs**: AC-US4-01
**Status**: [x] completed

**Test Plan**:
- **Given** RequestLoggerMiddleware is registered in AppModule for all routes
- **When** a GET /api/products request completes with status 200
- **Then** a structured log entry is emitted: `[HTTP] GET /api/products 200 <N>ms`

- **Given** the request is to /api/health
- **When** the middleware processes it
- **Then** no log entry is emitted (excluded to reduce noise)

**Test Cases**:
1. **Unit**: `apps/api/src/common/middleware/request-logger.middleware.spec.ts`
   - `middleware_logsMethodUrlStatusAndTime()`: Create mock req/res/next, call middleware, trigger `res.emit('finish')`, assert `Logger.log` called with string matching `[HTTP] GET /api/products 200`
   - `middleware_skipsHealthRoute()`: Set `req.url = '/api/health'`, assert `Logger.log` not called after finish
   - `middleware_includesResponseTimeInMs()`: Assert log string contains a number followed by `ms`
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/common/middleware/request-logger.middleware.ts` implementing `NestMiddleware`
2. Capture `Date.now()` on entry; hook `res.on('finish', ...)` to log after response is sent
3. In `AppModule`, implement `configure(consumer: MiddlewareConsumer)` applying middleware to `'*'`

---

### T-009: Enhance health endpoint with live database connectivity check

**User Story**: US-004
**Satisfies ACs**: AC-US4-02, AC-US4-03
**Status**: [x] completed

**Test Plan**:
- **Given** the database is reachable
- **When** GET /api/health is called
- **Then** response is 200 with body `{ status: "ok", database: "connected" }`

- **Given** the database is unreachable or times out after 2 seconds
- **When** GET /api/health is called
- **Then** response is 503 with body `{ status: "error", database: "disconnected" }`

**Test Cases**:
1. **Unit**: `apps/api/src/health/health.controller.spec.ts`
   - `getHealth_dbReachable_returns200WithOkBody()`: Mock `prisma.$queryRaw` resolving, assert `{ status: 'ok', database: 'connected' }`
   - `getHealth_dbUnreachable_throws503()`: Mock `prisma.$queryRaw` rejecting, assert `ServiceUnavailableException` thrown
   - `getHealth_dbTimeout_throws503Within2100ms()`: Mock never-resolving promise, assert exception thrown before 2.1s
   - **Coverage Target**: 95%

**Implementation**:
1. In `apps/api/src/health/health.controller.ts`, wrap `prisma.$queryRaw\`SELECT 1\`` in `Promise.race` with a 2000ms timeout
2. On success: `return { status: 'ok', database: 'connected' }`
3. On catch: `throw new ServiceUnavailableException({ status: 'error', database: 'disconnected' })`
4. Decorate with `@SkipThrottle()` (requires T-007)

---

## User Story: US-005 - Database Performance Indexes

**Linked ACs**: AC-US5-01, AC-US5-02, AC-US5-03
**Tasks**: 1 total, 1 completed

### T-010: Add performance indexes to Prisma schema and generate migration

**User Story**: US-005
**Satisfies ACs**: AC-US5-01, AC-US5-02, AC-US5-03
**Status**: [x] completed

**Test Plan**:
- **Given** index directives are added to Order, Commission, CouponUsage, OrderItem, and Product models in schema.prisma
- **When** `prisma validate` is run
- **Then** it exits with code 0

- **Given** the schema passes validation
- **When** `prisma migrate dev --name add_performance_indexes` is run
- **Then** a migration file is created containing `CREATE INDEX` statements and applies without errors

**Test Cases**:
1. **Schema validation** (CI gate):
   - `pnpm --filter @shopvui/db exec prisma validate` exits 0
   - Generated migration SQL contains expected `CREATE INDEX` for each model
   - **Coverage Target**: N/A (verified by migration success + CI)

2. **Manual verification note** (post-deploy):
   - `EXPLAIN ANALYZE SELECT * FROM "Order" WHERE "userId" = ? AND status = ?` shows Index Scan
   - `EXPLAIN ANALYZE SELECT * FROM "Product" WHERE "categoryId" = ? AND "isActive" = true` shows Index Scan

**Implementation**:
Edit `packages/db/prisma/schema.prisma` — add per plan.md D6:
- `Order`: `@@index([userId])`, `@@index([status])`, `@@index([createdAt])`, `@@index([resellerId])`
- `Commission`: `@@index([resellerId])`, `@@index([status])`
- `CouponUsage`: `@@index([couponId])`, `@@index([userId])`
- `OrderItem`: `@@index([orderId])`, `@@index([productId])`
- `Product`: `@@index([categoryId])`, `@@index([isActive])`, `@@index([categoryId, isActive])`

Then run:
```bash
pnpm --filter @shopvui/db exec prisma validate
pnpm --filter @shopvui/db exec prisma migrate dev --name add_performance_indexes
```

---

## User Story: US-006 - Frontend Error Resilience

**Linked ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-04
**Tasks**: 3 total, 3 completed

### T-011: Add error.tsx and loading.tsx to web app route segments

**User Story**: US-006
**Satisfies ACs**: AC-US6-01, AC-US6-02
**Status**: [x] completed

**Test Plan**:
- **Given** error.tsx files exist at root, products, products/[id], cart, checkout, and orders segments of apps/web
- **When** an unhandled error occurs in any of those segments
- **Then** the error component renders with a user-friendly message and a "Try again" button — not a blank screen

- **Given** loading.tsx files are at those same segments
- **When** a route is in a loading state
- **Then** a skeleton or spinner is displayed

**Test Cases**:
1. **Component** (Vitest + RTL): `apps/web/src/app/error.spec.tsx`
   - `rootError_rendersRetryButton()`: Render root error.tsx, assert "Try again" button present
   - `rootError_doesNotDisplayErrorMessage()`: Assert `error.message` text is NOT rendered
   - `checkoutError_mentionsCartSaved()`: Assert "cart" or "saved" text present in checkout error
   - **Coverage Target**: 85%

2. **E2E** (Playwright): `apps/web/e2e/error-resilience.spec.ts`
   - `productsPage_withNetworkError_showsErrorBoundary()`: Block API, navigate to /products, assert error UI visible
   - `checkoutPage_withError_showsCartSavedMessage()`
   - **Coverage Target**: 100% of AC scenarios

**Implementation**:
Create per plan.md D8 pattern (`'use client'`, reset prop, context-aware message, never render `error.message`):
- `apps/web/src/app/error.tsx` + `loading.tsx`
- `apps/web/src/app/products/error.tsx` + `loading.tsx`
- `apps/web/src/app/products/[id]/error.tsx` + `loading.tsx`
- `apps/web/src/app/cart/error.tsx` + `loading.tsx`
- `apps/web/src/app/checkout/error.tsx` + `loading.tsx`
- `apps/web/src/app/orders/error.tsx` + `loading.tsx`

---

### T-012: Add admin app root error boundary and loading state

**User Story**: US-006
**Satisfies ACs**: AC-US6-01, AC-US6-02
**Status**: [x] completed

**Test Plan**:
- **Given** error.tsx and loading.tsx are added to apps/admin root segment
- **When** an unhandled error occurs in any admin route
- **Then** an error boundary renders with a retry button (no blank screen)

**Test Cases**:
1. **Component**: `apps/admin/src/app/error.spec.tsx`
   - `adminError_rendersRetryButton()`: Render with mock error + reset fn, assert "Try again" button present
   - `adminError_doesNotLeakErrorMessage()`: Assert `error.message` not rendered
   - **Coverage Target**: 85%

**Implementation**:
1. Create `apps/admin/src/app/error.tsx` with `'use client'` directive and reset button
2. Create `apps/admin/src/app/loading.tsx` with centered spinner

---

### T-013: Enhance Open Graph metadata for web app root and product detail pages

**User Story**: US-006
**Satisfies ACs**: AC-US6-03, AC-US6-04
**Status**: [x] completed

**Test Plan**:
- **Given** the root layout.tsx in apps/web has Open Graph metadata
- **When** the page HTML is rendered
- **Then** it includes `og:title`, `og:description`, `og:image`, and `og:type` meta tags

- **Given** the product detail page exports a `generateMetadata` function
- **When** the page is server-rendered for a specific product
- **Then** the og:title and og:description match the product's name and description

**Test Cases**:
1. **Unit**: `apps/web/src/app/products/[id]/page.spec.ts`
   - `generateMetadata_returnsProductNameAsTitle()`: Mock product fetch, call `generateMetadata({ params: { id: '1' } })`, assert `title` equals product name
   - `generateMetadata_returnsProductImageAsOgImage()`: Assert `openGraph.images[0].url` equals product image URL
   - `generateMetadata_unknownProduct_returnsDefaultTitle()`: Mock 404 fetch, assert fallback title returned
   - **Coverage Target**: 85%

2. **E2E** (Playwright): `apps/web/e2e/metadata.spec.ts`
   - `productDetailPage_hasCorrectOgTitle()`: Navigate to `/products/[id]`, assert `og:title` meta content equals product name
   - **Coverage Target**: 100% of AC scenarios

**Implementation**:
1. In `apps/web/src/app/layout.tsx`, expand `metadata` export:
   ```ts
   openGraph: { title: '...', description: '...', type: 'website', images: [{ url: '/og-default.png' }] }
   ```
2. In `apps/web/src/app/products/[id]/page.tsx`, add:
   ```ts
   export async function generateMetadata({ params }) {
     const product = await fetchProduct(params.id);
     return { title: product.name, description: product.description, openGraph: { title: product.name, description: product.description, images: [{ url: product.imageUrl }] } };
   }
   ```
