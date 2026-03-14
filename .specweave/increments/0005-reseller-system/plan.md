# Architecture Plan: 0005 - Reseller Affiliate Coupon System

## 1. Architecture Overview

The reseller system introduces a new bounded context (Reseller Domain) that integrates with the existing e-commerce flow. It adds:

- **3 new API modules**: `resellers`, `commissions`, `email`
- **2 new Prisma models**: `Reseller`, `Commission` + extensions to `Coupon`, `User`, `Order`
- **Reseller auth**: email/password strategy alongside existing Google OAuth
- **Scheduled job**: Cron for commission maturity transitions
- **Frontend routes**: `/reseller/*` portal pages + admin reseller management

```
                         ┌──────────────────┐
                         │   Next.js Web    │
                         │  /reseller/*     │
                         │  (Portal Pages)  │
                         └────────┬─────────┘
                                  │ API calls
                                  ▼
┌─────────────┐    ┌─────────────────────────────────────────┐
│  Existing   │    │            NestJS API                   │
│  Modules    │    │                                         │
│             │    │  ┌────────────┐  ┌──────────────────┐   │
│ Checkout ◄──┼────┼──┤ Resellers  │  │   Commissions    │   │
│ Coupons  ◄──┼────┼──┤ Module     │  │   Module         │   │
│ Orders   ◄──┼────┼──┤            │  │   (+ cron job)   │   │
│ Auth     ◄──┼────┼──┤            │  └──────────────────┘   │
│             │    │  └────────────┘                          │
│             │    │  ┌────────────┐                          │
│             │    │  │   Email    │                          │
│             │    │  │   Module   │                          │
│             │    │  └────────────┘                          │
└─────────────┘    └─────────────────────────────────────────┘
                                  │
                                  ▼
                         ┌────────────────┐
                         │   PostgreSQL    │
                         │  + Reseller     │
                         │  + Commission   │
                         └────────────────┘
```

---

## 2. Key Architecture Decisions

### AD-01: Reseller Auth Strategy -- Email/Password via Local Strategy

**Decision**: Add a `LocalStrategy` (Passport) for resellers, reusing the existing JWT infrastructure. Resellers authenticate with email/password and receive the same JWT token format.

**Rationale**:
- Existing auth uses Google OAuth with JWT. Resellers need email/password per spec.
- The JWT payload already carries `{ sub, email }`. Adding a `role` claim ("customer" | "reseller" | "admin") enables role-based guards.
- `User` model gains optional `passwordHash` and `role` fields. Reseller registration creates a User with role="reseller" + a linked Reseller record.
- A new `ResellerGuard` (extends JwtAuthGuard) checks `role === "reseller"` AND `reseller.status === "active"`.

**Trade-offs**:
- (+) Reuses JWT signing/refresh infrastructure -- no second auth system
- (+) Single `users` table simplifies foreign key references
- (-) User model grows slightly; need null handling for googleId on reseller users

**Schema change**: `User` model adds `passwordHash String?`, `role String @default("customer")`. The `googleId` field changes from required to optional (`String?`).

### AD-02: Commission Calculation in Checkout Transaction

**Decision**: Calculate and create Commission records inside the `CheckoutService.placeOrder` transaction.

**Rationale**:
- Spec AC-US3-02 requires "zero commission leakage" -- every reseller-coupon order must create a Commission.
- Creating Commission inside the same Prisma `$transaction` as the Order guarantees atomicity.
- The checkout service already loads the Coupon for validation; adding commission calculation is a minor extension.

**Implementation**: After order creation within the transaction, if `coupon.isResellerCoupon === true`, calculate commission and create the Commission record with status "pending".

### AD-03: Commission Maturity via NestJS Cron (ScheduleModule)

**Decision**: Use `@nestjs/schedule` with a `@Cron` decorator running every hour to transition maturing commissions.

**Rationale**:
- The maturity check (AC-US4-02) needs to run periodically -- commissions become "approved" when `maturityDate` passes.
- NestJS ScheduleModule is the idiomatic solution -- no external job runner needed.
- Hourly frequency is sufficient (commission maturity is 30+ days; hour-level granularity is fine).

**Implementation**: `CommissionCronService` queries `WHERE status = 'maturing' AND maturityDate <= NOW()` and batch-updates to "approved", then triggers email notifications.

### AD-04: Email Module with Pluggable Transport

**Decision**: Create an `EmailModule` with an `EmailService` that wraps Nodemailer. Use Handlebars templates for the 5 notification types.

**Rationale**:
- 5 distinct email types (AC-US5-01 through AC-US5-05) need structured templates.
- Nodemailer is lightweight, zero-dependency for SMTP. In development, use Ethereal (fake SMTP) or console transport.
- Handlebars templates in `apps/api/src/email/templates/` keep email content out of business logic.

**Configuration**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` env vars. `EmailService` is injectable anywhere.

### AD-05: Reseller Coupon Approval as Admin Workflow

**Decision**: Reseller coupon requests are stored as Coupon records with `isActive=false` until admin approves. No separate "CouponRequest" model.

**Rationale**:
- The Coupon model already has all needed fields (resellerId, commissionType, etc.).
- Creating a coupon in "inactive" state and activating on approval is simpler than a separate request entity.
- Admin sets discount and commission values during approval (AC-US2-03), updating the existing record.

### AD-06: Frontend -- Reseller Portal as Protected Route Group

**Decision**: All reseller portal pages live under `apps/web/src/app/reseller/` as a Next.js route group with a shared layout that enforces reseller auth.

**Routes**:
- `/reseller/register` -- public registration form
- `/reseller/login` -- email/password login
- `/reseller/dashboard` -- protected: summary cards
- `/reseller/orders` -- protected: order list
- `/reseller/commissions` -- protected: commission list with filters
- `/reseller/payouts` -- protected: payout history
- `/reseller/profile` -- protected: edit bank info, phone, socials
- `/reseller/coupons` -- protected: view coupons, generate shareable links

The reseller layout checks JWT role and redirects unauthenticated/unauthorized users.

---

## 3. Data Model Changes

### 3.1 New Enums

```prisma
enum ResellerStatus {
  PENDING
  ACTIVE
  INACTIVE
  REJECTED
}

enum CommissionStatus {
  PENDING
  MATURING
  APPROVED
  PAID
  VOIDED
}

enum CommissionType {
  PERCENTAGE
  FIXED
}

enum CommissionBase {
  SUBTOTAL
  FINAL_TOTAL
}
```

### 3.2 New Models

```prisma
model Reseller {
  id                     String         @id @default(cuid())
  userId                 String         @unique @map("user_id")
  user                   User           @relation(fields: [userId], references: [id])
  name                   String
  email                  String         @unique
  phone                  String?
  socialProfiles         Json?          @map("social_profiles")
  reason                 String?
  status                 ResellerStatus @default(PENDING)
  bankInfo               Json?          @map("bank_info")
  defaultCommissionType  CommissionType? @map("default_commission_type")
  defaultCommissionValue Int?           @map("default_commission_value")
  coupons                Coupon[]
  commissions            Commission[]
  orders                 Order[]
  createdAt              DateTime       @default(now()) @map("created_at")
  updatedAt              DateTime       @updatedAt @map("updated_at")

  @@map("resellers")
}

model Commission {
  id               String           @id @default(cuid())
  orderId          String           @map("order_id")
  order            Order            @relation(fields: [orderId], references: [id])
  resellerId       String           @map("reseller_id")
  reseller         Reseller         @relation(fields: [resellerId], references: [id])
  couponCode       String           @map("coupon_code")
  orderTotal       Int              @map("order_total")
  commissionAmount Int              @map("commission_amount")
  status           CommissionStatus @default(PENDING)
  orderDeliveredAt DateTime?        @map("order_delivered_at")
  maturityDate     DateTime?        @map("maturity_date")
  approvedAt       DateTime?        @map("approved_at")
  paidAt           DateTime?        @map("paid_at")
  voidedAt         DateTime?        @map("voided_at")
  voidReason       String?          @map("void_reason")
  createdAt        DateTime         @default(now()) @map("created_at")

  @@map("commissions")
}
```

### 3.3 Model Modifications

**User** -- add fields:
```prisma
passwordHash String?        @map("password_hash")
role         String         @default("customer")
googleId     String?        @unique @map("google_id")  // change: required -> optional
reseller     Reseller?
```

**Coupon** -- add relation + fields:
```prisma
reseller     Reseller?      @relation(fields: [resellerId], references: [id])
maturityDays Int            @default(30) @map("maturity_days")
// commissionBase already exists as String; migrate to CommissionBase enum
// commissionType already exists as String; migrate to CommissionType enum
```

**Order** -- add relation + field:
```prisma
resellerId   String?        @map("reseller_id")
reseller     Reseller?      @relation(fields: [resellerId], references: [id])
commissions  Commission[]
```

---

## 4. API Module Design

### 4.1 ResellersModule

**Path**: `apps/api/src/resellers/`

| File | Purpose |
|------|---------|
| `resellers.module.ts` | Module registration, imports EmailModule |
| `resellers.service.ts` | CRUD: register, approve, reject, deactivate, update profile |
| `resellers.controller.ts` | REST endpoints for reseller self-service |
| `resellers-admin.controller.ts` | REST endpoints for admin management |
| `reseller-auth.controller.ts` | Login/register endpoints (email/password) |
| `reseller-auth.service.ts` | Password hashing (bcrypt), token generation |
| `guards/reseller.guard.ts` | Ensures JWT user has role=reseller and status=active |
| `guards/admin.guard.ts` | Ensures JWT user has role=admin |
| `dto/` | CreateResellerDto, UpdateResellerDto, ApproveResellerDto, LoginDto |

**Key Endpoints**:

Reseller Self-Service:
- `POST /resellers/register` -- public, creates User + Reseller with status=pending
- `POST /resellers/login` -- public, email/password auth returns JWT
- `GET /resellers/me` -- reseller guard, returns own profile
- `PUT /resellers/me` -- reseller guard, update bank info / phone / socials
- `POST /resellers/me/coupons` -- reseller guard, propose coupon code
- `GET /resellers/me/coupons` -- reseller guard, list own coupons
- `GET /resellers/me/orders` -- reseller guard, list orders using own coupons
- `GET /resellers/me/dashboard` -- reseller guard, aggregated stats

Admin Management:
- `GET /admin/resellers` -- admin guard, list all resellers
- `GET /admin/resellers/:id` -- admin guard, reseller detail
- `PUT /admin/resellers/:id/approve` -- admin guard
- `PUT /admin/resellers/:id/reject` -- admin guard
- `PUT /admin/resellers/:id/deactivate` -- admin guard, also deactivates linked coupons
- `PUT /admin/resellers/:id/coupons/:couponId/approve` -- admin guard, sets discount/commission values

### 4.2 CommissionsModule

**Path**: `apps/api/src/commissions/`

| File | Purpose |
|------|---------|
| `commissions.module.ts` | Module registration, imports ScheduleModule, EmailModule |
| `commissions.service.ts` | Commission CRUD, lifecycle transitions, calculation |
| `commissions.controller.ts` | Reseller-facing commission endpoints |
| `commissions-admin.controller.ts` | Admin commission/payout endpoints |
| `commissions-cron.service.ts` | Scheduled maturity check |
| `dto/` | ProcessPayoutDto, FilterCommissionsDto |

**Key Endpoints**:
- `GET /resellers/me/commissions` -- reseller guard, list with status filter
- `GET /resellers/me/commissions/stats` -- reseller guard, aggregated commission stats
- `GET /admin/commissions` -- admin guard, list all commissions
- `POST /admin/commissions/payout` -- admin guard, batch mark as paid

**Commission Calculation Logic** (in `CommissionsService`):
```typescript
calculateCommission(coupon: Coupon, order: Order): number {
  const base = coupon.commissionBase === 'FINAL_TOTAL'
    ? order.total        // after discount + shipping
    : order.subtotal;    // before discount

  if (coupon.commissionType === 'PERCENTAGE') {
    return Math.round(base * coupon.commissionValue / 100);
  }
  return coupon.commissionValue; // fixed amount
}
```

### 4.3 EmailModule

**Path**: `apps/api/src/email/`

| File | Purpose |
|------|---------|
| `email.module.ts` | Global module, configures Nodemailer transport |
| `email.service.ts` | Send methods for each notification type |
| `templates/` | Handlebars templates for 5 email types |

**Email Types**:
1. `reseller-new-order.hbs` -- New order placed with reseller coupon
2. `reseller-order-delivered.hbs` -- Order delivered, maturity countdown started
3. `reseller-commission-approved.hbs` -- Commission ready for payout
4. `reseller-commission-paid.hbs` -- Payout processed
5. `reseller-commission-voided.hbs` -- Commission voided with reason

The EmailModule is `@Global()` so any module can inject EmailService.

---

## 5. Integration Points (Modifications to Existing Code)

### 5.1 CheckoutService (Critical Path)

**File**: `apps/api/src/checkout/checkout.service.ts`

Modify `placeOrder` transaction to:
1. Check if coupon is a reseller coupon (`isResellerCoupon === true`)
2. Set `order.channel = "reseller"` and `order.resellerId = coupon.resellerId`
3. Create Commission record with calculated amount and status "pending"
4. After transaction, trigger `EmailService.sendResellerNewOrder()`

### 5.2 OrdersService -- Status Transition Hooks

**File**: `apps/api/src/orders/orders.service.ts`

Add methods for admin order status updates that trigger commission lifecycle:
- `updateStatus(orderId, newStatus)`:
  - If `DELIVERED`: find pending Commission for this order, transition to "maturing", set `orderDeliveredAt` and `maturityDate`, send delivery email
  - If `CANCELLED` or `RETURNED`: find pending/maturing Commission, transition to "voided", set voidReason, send voided email

### 5.3 CouponsService -- Reseller Coupon Deactivation

When admin deactivates a reseller, `CouponsService.deactivateByResellerId(resellerId)` sets `isActive=false` on all linked coupons.

### 5.4 Auth Module -- Local Strategy

Add `local.strategy.ts` to `apps/api/src/auth/strategies/` for email/password validation. The existing `JwtStrategy` works unchanged since JWT payload format is the same -- just add `role` to the payload.

---

## 6. Frontend Architecture

### 6.1 Route Structure

```
apps/web/src/app/reseller/
  layout.tsx              -- shared reseller layout (sidebar nav, auth check)
  register/page.tsx       -- public registration form
  login/page.tsx          -- email/password login
  dashboard/page.tsx      -- summary cards (total orders, revenue, commissions)
  orders/page.tsx         -- order list table
  commissions/page.tsx    -- commissions with status filter tabs
  payouts/page.tsx        -- payout history table
  profile/page.tsx        -- edit bank info, phone, socials
  coupons/page.tsx        -- view coupons, generate shareable links
```

### 6.2 Shareable Coupon Links

Coupon link format: `https://shopvui.com?coupon=ANNA10`

Implementation:
- Reseller portal generates the URL (client-side string concatenation)
- `apps/web/src/app/layout.tsx` (or a middleware) reads `?coupon=` from URL params and stores in cookie/localStorage
- Checkout page auto-fills the coupon code from stored value

### 6.3 Admin Reseller Pages

Add to existing admin section (or create if not present):
```
apps/web/src/app/admin/resellers/
  page.tsx                -- reseller list with status, total orders, revenue
  [id]/page.tsx           -- reseller detail with coupons, orders, commissions
  [id]/coupons/[couponId]/approve/page.tsx -- coupon approval form
```

---

## 7. Security Considerations

1. **Role-based access**: All reseller endpoints require `ResellerGuard` (JWT role=reseller + status=active). All admin endpoints require `AdminGuard` (JWT role=admin).
2. **Password storage**: bcrypt with salt rounds=12 for reseller passwords.
3. **Data isolation**: Resellers can only see their own orders/commissions. Query always filters by `resellerId`.
4. **Commission tampering**: Commission amounts are calculated server-side from coupon config at order time. Resellers cannot modify commission values.
5. **Coupon code uniqueness**: Enforced at DB level (unique constraint on `code`) + service-level check before creation.

---

## 8. Implementation Order

The recommended implementation sequence respects dependencies:

1. **Schema first**: Prisma model changes (Reseller, Commission, User modifications, enums)
2. **Auth extension**: Local strategy, role field, ResellerGuard, AdminGuard
3. **EmailModule**: Nodemailer setup + templates (needed by later modules)
4. **ResellersModule**: Registration, admin approval, profile management
5. **CommissionsModule**: Commission service + calculation logic
6. **Checkout integration**: Modify placeOrder to create commissions
7. **Order status hooks**: Delivery/cancellation triggers commission transitions
8. **Commission cron**: ScheduleModule for maturity processing
9. **Frontend -- Reseller portal**: Registration, login, dashboard, orders, commissions, profile, coupons
10. **Frontend -- Admin pages**: Reseller management, coupon approval, payout processing
11. **Shareable links**: URL parameter handling on frontend

---

## 9. Technology Additions

| Package | Purpose | Install Location |
|---------|---------|-----------------|
| `@nestjs/schedule` | Cron jobs for commission maturity | `apps/api` |
| `nodemailer` | Email sending | `apps/api` |
| `@types/nodemailer` | TypeScript types | `apps/api` (devDep) |
| `handlebars` | Email templates | `apps/api` |
| `bcryptjs` | Password hashing | `apps/api` |
| `@types/bcryptjs` | TypeScript types | `apps/api` (devDep) |

No new packages needed on the frontend -- existing Next.js 15 App Router handles all routing and data fetching.

---

## 10. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Commission leakage (order without commission) | Atomic transaction in checkout; integration test verifying every reseller-coupon order has a Commission |
| Cron job misses maturity window | Idempotent query (`maturityDate <= NOW()`); hourly frequency with monitoring |
| googleId migration breaks existing users | Migration sets `googleId` as optional; existing users retain their value unchanged |
| Email delivery failures | Fire-and-forget with logging; do not block order flow on email send |
| Admin role bootstrap | Seed script or manual DB update to set first admin user |

---

## 11. Domain Skill Recommendations

For implementation, recommend chaining:
- **backend:nestjs** -- for ResellersModule, CommissionsModule, EmailModule, auth extensions, cron service
- **frontend:nextjs** -- for reseller portal pages, admin pages, shareable link handling
