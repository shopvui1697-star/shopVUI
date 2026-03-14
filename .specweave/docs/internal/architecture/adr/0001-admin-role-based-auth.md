# ADR-0001: Admin Role-Based Authentication

## Status
Accepted

## Date
2026-03-11

## Context
ShopVui needs an admin dashboard (increment 0006) that restricts access to users with the "admin" role. The existing auth system uses Google OAuth with JWT tokens but has no role concept. The User model has no role field.

## Decision

### Schema Change
Add a `UserRole` enum (`CUSTOMER`, `ADMIN`, `RESELLER`) and a `role` field to the User model, defaulting to `CUSTOMER`. This is a non-breaking additive migration.

### API-Side Guard (NestJS)
Create an `AdminGuard` that extends the existing `JwtAuthGuard` pattern. It reads the JWT payload (which will now include `role`) and rejects non-admin users with 403. The JWT payload changes from `{ sub, email }` to `{ sub, email, role }`.

### Admin Frontend Auth (Next.js 15)
The `apps/admin` Next.js app calls the same NestJS auth endpoints. It stores the JWT in an httpOnly cookie and uses Next.js middleware to check the role claim client-side for route protection. All data fetches go through the NestJS API (not direct Prisma), so the API guard is the authoritative enforcement point.

### Why Not Separate Admin Users Table
A separate table would require duplicate auth flows and complicate the relationship between orders/customers/resellers. A role field on the existing User model is simpler and sufficient since multi-admin permission levels are out of scope.

## Consequences
- `AuthUser` type in `@shopvui/shared` gains a `role` field
- `AuthService.toAuthUser()` must include role
- `AuthService.generateTokens()` must include role in JWT payload
- Existing customer-facing flows are unaffected (role defaults to CUSTOMER)
