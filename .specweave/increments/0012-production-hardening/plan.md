# Architecture Plan: 0012 - Production Readiness Hardening

## Overview

This increment adds defensive layers to the existing ShopVUI monorepo (NestJS API + two Next.js 15 apps + Prisma). All changes are additive and backward-compatible. The plan is organized around the NestJS request lifecycle because the registration order of middleware, pipes, guards, and filters determines how they interact.

---

## D1: NestJS Bootstrap Registration Order in main.ts

### Problem

main.ts currently registers only CORS, a global prefix, and Swagger. We need to add helmet, ThrottlerGuard, ValidationPipe, HttpExceptionFilter, request logging middleware, and process-level error handlers. The order matters because NestJS processes the request lifecycle as:

```
Middleware -> Guards -> Pipes -> Controller -> Exception Filters
```

### Decision

Register everything in main.ts in this exact order:

```
1. helmet()                     -- Express middleware, runs first on every request
2. Request logging middleware   -- Express middleware, wraps response to capture timing
3. CORS                         -- Already exists, keep in place
4. Global prefix                -- Already exists
5. ValidationPipe (global)      -- Pipe: validates DTOs before controller execution
6. ThrottlerGuard (global)      -- Guard: registered via APP_GUARD in ThrottlerModule, not main.ts
7. HttpExceptionFilter (global) -- Filter: catches all exceptions, formats response
8. Swagger setup                -- Dev tooling, keep at end
9. Process handlers             -- unhandledRejection + uncaughtException listeners
10. app.listen()
```

**Key interactions:**

- **ThrottlerGuard fires before ValidationPipe.** A rate-limited request gets a 429 before any body parsing. This is correct -- we want to reject abusive clients cheaply.
- **ValidationPipe fires before the controller.** Invalid payloads get a 400 with field-level messages. The thrown `BadRequestException` is caught by the HttpExceptionFilter.
- **HttpExceptionFilter catches everything.** Both NestJS HttpExceptions (from ValidationPipe, ThrottlerGuard, business logic) and unexpected errors are formatted into the standardized shape.
- **Helmet runs on every response** including error responses, because it is Express-level middleware applied before NestJS routing.

### Registration details

**Helmet** -- `app.use(helmet())` before any other setup. Default CSP policy is sufficient; we override `contentSecurityPolicy` only if Swagger UI breaks (it may need `'unsafe-inline'` for script-src in dev).

**ThrottlerGuard** -- Do NOT register via `app.useGlobalGuards()`. Instead, register via `APP_GUARD` token inside AppModule providers. This ensures the guard has access to NestJS DI context, which is required for `@SkipThrottle()` and `@Throttle()` decorators to work on individual controllers.

**ValidationPipe** -- `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))`. The `whitelist` strips unknown properties. The `transform` enables `class-transformer` for auto-converting query string types. The `forbidNonWhitelisted` returns 400 if unknown properties are sent (defense against parameter pollution).

**HttpExceptionFilter** -- `app.useGlobalFilters(new HttpExceptionFilter())`. Registered last among the app-level calls because filters are a catch-all.

---

## D2: HttpExceptionFilter Design

### File Location

`apps/api/src/common/filters/http-exception.filter.ts`

### Response Shape

Every error response, regardless of source, will match:

```typescript
{
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;    // ISO 8601
  path: string;         // request URL
}
```

### Implementation

- Extend `ExceptionFilter` and decorate with `@Catch()` (no arguments = catches everything).
- For `HttpException` instances: extract status and response. If the response is an object with `message` as an array (ValidationPipe output), preserve it as-is for field-level errors.
- For non-HttpException: return 500, use a generic message ("Internal server error"), log the full error with stack trace server-side, and never leak it to the client.
- Inject `Logger` for structured error logging.

### Why a single filter instead of multiple

Multiple filters (one for Http, one for all) create ordering ambiguity. A single `@Catch()` filter handles both cases with a simple `instanceof HttpException` branch. Simpler to test, simpler to maintain.

---

## D3: ThrottlerModule Configuration

### File Location

Configuration in `apps/api/src/app.module.ts` via `ThrottlerModule.forRoot()`.

### Rate Limit Tiers

| Scope | Limit | Window | Implementation |
|-------|-------|--------|----------------|
| General (all endpoints) | 100 requests | 60 seconds | `ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])` |
| Auth endpoints | 5 requests | 60 seconds | `@Throttle([{ default: { ttl: 60000, limit: 5 } }])` on auth controller |

### Guard Registration

```typescript
// In AppModule imports:
ThrottlerModule.forRoot([{
  ttl: parseInt(process.env.THROTTLE_TTL || '60000'),
  limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
}])

// In AppModule providers:
{ provide: APP_GUARD, useClass: ThrottlerGuard }
```

### Health Endpoint Exemption

The `/api/health` endpoint must be excluded from rate limiting via `@SkipThrottle()` on `HealthController`. Monitoring systems poll this frequently and must never be throttled.

---

## D4: Request Logging Middleware

### File Location

`apps/api/src/common/middleware/request-logger.middleware.ts`

### Design

Implement as a NestJS `NestMiddleware` class, not a raw Express middleware, so it integrates with NestJS `Logger`. Register it in `AppModule.configure()` via `consumer.apply(RequestLoggerMiddleware).forRoutes('*')`.

### Log Entry Format

```
[HTTP] GET /api/products 200 45ms
[HTTP] POST /api/orders 201 128ms
[HTTP] POST /api/auth/login 429 2ms
```

Fields: method, url, status code, response time in ms. Use NestJS `Logger` so the output format follows whatever logging configuration is set (JSON in production, pretty in dev).

### Implementation

- Capture `Date.now()` on request entry.
- Hook `res.on('finish', ...)` to log after the response is sent.
- Exclude `/api/health` from logging to reduce noise (configurable).

---

## D5: DTO Validation Conversion Strategy

### Scope

9 DTO files need conversion from TypeScript interfaces to classes with `class-validator` decorators.

### Pattern

Every DTO follows this pattern:

```typescript
// BEFORE (current state)
export interface CreateResellerDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

// AFTER
import { IsNotEmpty, IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CreateResellerDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
```

### DTO-Specific Validation Rules

| DTO File | Key Validations |
|----------|----------------|
| `create-reseller.dto.ts` (CreateResellerDto) | `@IsEmail` on email, `@MinLength(8)` on password, `@IsOptional` on phone/socialProfiles/reason |
| `create-reseller.dto.ts` (LoginDto) | `@IsEmail` on email, `@IsNotEmpty` on password |
| `admin-order-filters.dto.ts` (AdminOrderFiltersDto) | `@IsOptional` + `@IsEnum(OrderStatus)` on status, `@IsDateString` on dateFrom/dateTo, `@Type(() => Number) @IsInt @Min(1)` on page/pageSize |
| `admin-order-filters.dto.ts` (UpdateOrderStatusDto) | `@IsEnum(OrderStatus)` on status, `@IsOptional` on note |
| `admin-order-filters.dto.ts` (BulkOrderActionDto) | `@IsArray @IsString({ each: true })` on orderIds, `@IsEnum` on action |
| `admin-product.dto.ts` | `@IsNotEmpty` on name/description, `@IsInt @Min(0)` on price/stockQuantity, `@IsOptional` on compareAtPrice |
| `admin-coupon.dto.ts` | `@IsNotEmpty` on code, `@IsEnum(CouponType)` on type, `@IsOptional` on value/maxDiscount/minPurchase |
| `admin-reseller.dto.ts` | `@IsEnum(ResellerStatus)` on status updates |
| `admin-customer.dto.ts` | `@IsOptional` + pagination validators |
| `admin-analytics.dto.ts` | `@IsDateString` on date range params |
| `price-tier.dto.ts` | `@IsInt @Min(1)` on minQty, `@IsInt @Min(0)` on price |
| `coupon.dto.ts` | `@IsNotEmpty` on code, `@IsEnum(CouponType)` on type |

### Backward Compatibility

- Changing `interface` to `class` is backward-compatible for consumers. The runtime shape is identical.
- `whitelist: true` on ValidationPipe strips unknown properties silently. `forbidNonWhitelisted: true` makes this an explicit 400. If any existing consumer sends extra fields, this could be a breaking change. **Decision**: Use `forbidNonWhitelisted: true` because we want strict input validation. If a consumer breaks, they were sending garbage anyway.

---

## D6: Database Index Strategy

### Indexes to Add

Based on the spec's AC-US5-01 and analysis of query patterns from existing services:

```prisma
model Order {
  // Existing indexes:
  // @@index([channel])
  // @@index([externalOrderId, channel])

  // New indexes:
  @@index([userId])              // Customer order history: WHERE user_id = ?
  @@index([status])              // Admin order filtering: WHERE status = ?
  @@index([createdAt])           // Admin date range queries: WHERE created_at BETWEEN
  @@index([resellerId])          // Reseller order lookup: WHERE reseller_id = ?
  // orderNumber already has @unique which creates an index
}

model Commission {
  @@index([resellerId])          // Reseller commission lookup
  @@index([status])              // Admin commission filtering by status
}

model CouponUsage {
  @@index([couponId])            // Coupon usage count queries
  @@index([userId])              // Per-user coupon usage check
}

model CartItem {
  // @@unique([cartId, productId]) already exists, creates a composite index
  // No additional indexes needed -- cartId and productId are covered
}

model OrderItem {
  @@index([orderId])             // Order detail loading
  @@index([productId])           // Product sales aggregation
}

model Product {
  @@index([categoryId])          // Category page product listing
  @@index([isActive])            // Active product filtering
  @@index([categoryId, isActive]) // Combined filter (most common storefront query)
}
```

### Migration Strategy

1. All indexes are additive (no schema changes to existing columns).
2. Run `prisma migrate dev --name add_performance_indexes` to generate and apply.
3. On production: `prisma migrate deploy` applies non-destructively. PostgreSQL `CREATE INDEX` on these table sizes (<100K rows at current scale) completes in milliseconds. No `CONCURRENTLY` needed yet.
4. Verify via `EXPLAIN ANALYZE` on key queries (manual verification step, not automated).

### Why Not Composite Indexes Everywhere

Composite indexes (e.g., `[userId, status, createdAt]`) are beneficial only when queries consistently filter on all columns in the prefix order. The current services use these columns independently in different combinations. Single-column indexes with PostgreSQL's bitmap index scan handle arbitrary combinations well at this scale. The one exception is `[categoryId, isActive]` which is used together in virtually every product listing query.

---

## D7: Health Check Enhancement

### File

`apps/api/src/health/health.controller.ts`

### Design

Import `prisma` from `@shopvui/db` and run `prisma.$queryRaw\`SELECT 1\`` in a try/catch.

```typescript
@Get()
@SkipThrottle()
async getHealth() {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 2000)
      ),
    ]);
    return { status: 'ok', database: 'connected' };
  } catch {
    throw new ServiceUnavailableException({
      status: 'error',
      database: 'disconnected',
    });
  }
}
```

The `ServiceUnavailableException` (503) will be caught by the HttpExceptionFilter but the response body shape from the health endpoint takes priority because the filter preserves the `response` object from HttpException. The 2-second timeout via `Promise.race` ensures the health endpoint responds promptly even if the database is hanging (not just down).

---

## D8: Frontend Error Boundary Hierarchy (Next.js App Router)

### Architecture

Next.js App Router error boundaries follow the segment hierarchy. We place `error.tsx` and `loading.tsx` at strategic levels:

```
apps/web/src/app/
  error.tsx              -- Root catch-all for web app
  loading.tsx            -- Root loading skeleton
  products/
    error.tsx            -- Product-specific error (offer "browse other products")
    loading.tsx          -- Product grid skeleton
    [id]/
      error.tsx          -- Single product error (offer "go back to products")
      loading.tsx        -- Product detail skeleton
  cart/
    error.tsx
    loading.tsx
  checkout/
    error.tsx            -- Checkout error (preserve cart state message)
    loading.tsx
  orders/
    error.tsx
    loading.tsx

apps/admin/src/app/
  error.tsx              -- Root catch-all for admin app
  loading.tsx            -- Root loading skeleton
```

### Error Component Pattern

All error.tsx files follow the same pattern:

```typescript
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{/* Context-specific message, NOT error.message */}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

Rules:
- Never display `error.message` to users (could leak internal details).
- Each error.tsx provides context-appropriate messaging (e.g., checkout error suggests "your cart is still saved").
- `reset()` re-renders the segment, which re-runs the server component.

### Loading Component Pattern

Loading.tsx files render a skeleton/spinner appropriate to the page layout. Use simple CSS animations (no external library needed). The admin app uses a centered spinner; the web app uses content-shaped skeletons.

### Metadata Enhancement (AC-US6-03, AC-US6-04)

**Root layout metadata** (`apps/web/src/app/layout.tsx`):
- Convert the existing `metadata` export to include Open Graph tags.
- Add `og:title`, `og:description`, `og:type` ("website"), `og:image` (a default ShopVUI social card).

**Product detail dynamic metadata** (`apps/web/src/app/products/[id]/page.tsx`):
- Export a `generateMetadata` async function that fetches the product and returns `title`, `description`, and `openGraph` with product-specific values.
- This coexists with the page component's own data fetching (Next.js deduplicates the fetch).

---

## D9: Process-Level Error Handlers

### Location

Bottom of `apps/api/src/main.ts`, before `app.listen()`.

### Implementation

```typescript
const logger = new Logger('Bootstrap');

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});
```

`unhandledRejection` logs but does not exit (the rejection is handled by logging it). `uncaughtException` logs and exits because the Node.js docs explicitly warn that continuing after an uncaught exception is unsafe.

---

## D10: New File/Folder Structure

All new files created by this increment:

```
apps/api/src/
  common/
    filters/
      http-exception.filter.ts       -- D2
    middleware/
      request-logger.middleware.ts    -- D4

apps/web/src/app/
  error.tsx                           -- D8
  loading.tsx                         -- D8
  products/error.tsx                  -- D8
  products/loading.tsx                -- D8
  products/[id]/error.tsx             -- D8
  products/[id]/loading.tsx           -- D8
  cart/error.tsx                      -- D8
  cart/loading.tsx                    -- D8
  checkout/error.tsx                  -- D8
  checkout/loading.tsx                -- D8
  orders/error.tsx                    -- D8
  orders/loading.tsx                  -- D8

apps/admin/src/app/
  error.tsx                           -- D8
  loading.tsx                         -- D8
```

Modified files:

```
apps/api/src/main.ts                 -- D1, D9 (helmet, pipes, filters, process handlers)
apps/api/src/app.module.ts           -- D3, D4 (ThrottlerModule, APP_GUARD, logging middleware)
apps/api/src/health/health.controller.ts -- D7 (database check, SkipThrottle)
apps/api/src/auth/auth.controller.ts -- D3 (stricter @Throttle decorator)
packages/db/prisma/schema.prisma     -- D6 (index additions)
apps/web/src/app/layout.tsx          -- D8 (metadata enhancement)
apps/web/src/app/products/[id]/page.tsx -- D8 (generateMetadata)
+ All 9 DTO files                    -- D5 (interface -> class with decorators)
```

---

## D11: Dependency Additions

| Package | Workspace | Purpose |
|---------|-----------|---------|
| `class-validator` | `apps/api` | DTO validation decorators |
| `class-transformer` | `apps/api` | Transform decorator support for ValidationPipe |
| `helmet` | `apps/api` | Security headers middleware |
| `@nestjs/throttler` | `apps/api` | Rate limiting module and guard |

No new dependencies for frontend apps or shared packages.

---

## Implementation Order

The user stories map to a natural dependency chain:

1. **US-003 (Global Error Handling)** -- HttpExceptionFilter first, because all subsequent features (validation, throttling) throw exceptions that need the standardized format.
2. **US-001 (Input Validation)** -- ValidationPipe and DTO conversion. Depends on the filter being in place to format validation errors.
3. **US-002 (Security Middleware)** -- Helmet and ThrottlerGuard. ThrottlerGuard's 429 responses need the filter.
4. **US-004 (Logging and Health)** -- Request logger and health check enhancement. Independent of 1-3 but should be done after because the logger will capture all the new error responses.
5. **US-005 (Database Indexes)** -- Schema-only change, fully independent. Can be done in parallel with anything.
6. **US-006 (Frontend Error Resilience)** -- Fully independent of backend changes. Can be done in parallel with 1-4.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `forbidNonWhitelisted` breaks an existing consumer | 400 errors on endpoints that previously accepted extra fields | Monitor API logs after deployment; can downgrade to `whitelist: true` only (strips silently) |
| Helmet CSP blocks Swagger UI | Swagger docs unusable in dev | Conditionally relax CSP in dev: `contentSecurityPolicy: process.env.NODE_ENV === 'production'` |
| ThrottlerGuard applied to health check | Monitoring 429s trigger false alerts | `@SkipThrottle()` on HealthController |
| Index migration on large tables | Lock contention in production | Tables are small (<100K rows). Standard CREATE INDEX is fine. If scale grows, use `CREATE INDEX CONCURRENTLY` via raw SQL migration |

---

## Domain Skill Delegation

After plan approval:

- **Backend implementation** (US-001 through US-004): `backend:nodejs` -- NestJS middleware, pipes, guards, filters
- **Frontend implementation** (US-006): `frontend:architect` -- Next.js App Router error boundaries, loading states, metadata
- **Database changes** (US-005): No special domain skill needed; Prisma schema edits are straightforward
