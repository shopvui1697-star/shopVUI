---
increment: 0005-reseller-system
title: Reseller Affiliate Coupon System
generated: 2026-03-11
test_mode: TDD
coverage_target: 80
by_user_story:
  US-001: [T-001, T-002, T-003]
  US-002: [T-004, T-005, T-006]
  US-003: [T-007, T-008, T-009]
  US-004: [T-010, T-011, T-012]
  US-005: [T-013, T-014]
  US-006: [T-015, T-016, T-017]
  US-007: [T-018, T-019, T-020]
---

# Tasks: Reseller Affiliate Coupon System

## User Story: US-001 - Reseller Registration and Onboarding

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US1-04, AC-US1-05
**Tasks**: 3 total, 0 completed

---

### T-001: Prisma Schema - Reseller and Commission Models

**User Story**: US-001
**Satisfies ACs**: AC-US1-05, AC-US4-05
**Status**: [x] completed

**Test Plan**:
- **Given** a fresh Prisma migration is applied to the database
- **When** the schema includes Reseller, Commission, new enums, and User/Coupon/Order extensions
- **Then** all models exist with correct fields, constraints, and relations as specified

**Test Cases**:
1. **Integration**: `apps/api/src/prisma/schema.spec.ts`
   - testResellerModelFields(): Verify id (cuid), userId (unique FK), name, email (unique), phone?, socialProfiles?, reason?, status (PENDING default), bankInfo?, defaultCommissionType?, defaultCommissionValue?, createdAt, updatedAt
   - testCommissionModelFields(): Verify all 14 fields including orderId, resellerId, couponCode, commissionAmount, status (PENDING default), six nullable datetime/string fields, createdAt
   - testUserModelExtensions(): passwordHash nullable, role defaults to "customer", googleId becomes optional, reseller relation added
   - testCouponModelExtensions(): maturityDays Int default 30, commissionBase enum, Reseller relation via resellerId
   - testOrderModelExtensions(): resellerId nullable FK, reseller relation, commissions collection
   - testEnums(): ResellerStatus (PENDING/ACTIVE/INACTIVE/REJECTED), CommissionStatus (PENDING/MATURING/APPROVED/PAID/VOIDED), CommissionType (PERCENTAGE/FIXED), CommissionBase (SUBTOTAL/FINAL_TOTAL)
   - **Coverage Target**: 90%

**Implementation**:
1. Add enums ResellerStatus, CommissionStatus, CommissionType, CommissionBase to `packages/database/prisma/schema.prisma`
2. Modify User: add `passwordHash String?`, `role String @default("customer")`, make `googleId String?` optional, add `reseller Reseller?`
3. Add Reseller model with all fields per spec Data Models table
4. Add Commission model with all 14 fields per spec
5. Modify Coupon: add `reseller Reseller? @relation(...)`, `maturityDays Int @default(30) @map("maturity_days")`
6. Modify Order: add `resellerId String? @map("reseller_id")`, `reseller Reseller? @relation(...)`, `commissions Commission[]`
7. Run `pnpm prisma migrate dev --name reseller-system`
8. Run `pnpm prisma generate`

---

### T-002: Auth Extension - Local Strategy, Guards, and Reseller Auth Endpoints

**User Story**: US-001
**Satisfies ACs**: AC-US1-01, AC-US1-03, AC-US1-04
**Status**: [x] completed

**Test Plan**:
- **Given** a potential reseller POSTs /resellers/register with name, email, password, phone, socialProfiles, reason
- **When** the registration endpoint processes the request
- **Then** a User (role="reseller") and Reseller (status=PENDING) are created, password is bcrypt-hashed, and a 201 confirmation is returned

- **Given** an active reseller POSTs /resellers/login with correct email and password
- **When** LocalStrategy validates credentials
- **Then** a JWT containing role="reseller" is returned

- **Given** a JWT with role="reseller" but reseller.status=REJECTED
- **When** ResellerGuard validates the request
- **Then** 403 Forbidden is returned

**Test Cases**:
1. **Unit**: `apps/api/src/resellers/guards/reseller.guard.spec.ts`
   - testAllowsActiveReseller(): role=reseller + status=ACTIVE passes guard
   - testBlocksPendingReseller(): status=PENDING throws ForbiddenException
   - testBlocksRejectedReseller(): status=REJECTED throws ForbiddenException
   - testBlocksCustomerRole(): role=customer throws ForbiddenException
   - **Coverage Target**: 95%

2. **Unit**: `apps/api/src/resellers/reseller-auth.service.spec.ts`
   - testRegister_hashesPassword(): bcrypt hash stored, raw password never in DB
   - testValidateCredentials_success(): returns user on correct email + password
   - testValidateCredentials_wrongPassword(): returns null
   - testValidateCredentials_unknownEmail(): returns null
   - **Coverage Target**: 95%

3. **Integration**: `apps/api/src/resellers/reseller-auth.controller.e2e.spec.ts`
   - testRegister_createsBothRecords(): POST /resellers/register creates User and Reseller
   - testRegister_returnsConfirmation(): 201 with confirmation message, no JWT issued
   - testLogin_returnsJwt(): POST /resellers/login returns access_token
   - testLogin_rejectsWrongPassword(): 401 returned
   - **Coverage Target**: 85%

**Implementation**:
1. Install: `pnpm add bcryptjs && pnpm add -D @types/bcryptjs` (filter: apps/api)
2. Create `apps/api/src/auth/strategies/local.strategy.ts` (Passport LocalStrategy)
3. Create `apps/api/src/resellers/reseller-auth.service.ts` with register() and validateCredentials()
4. Create `apps/api/src/resellers/reseller-auth.controller.ts` with POST /resellers/register and POST /resellers/login
5. Create `apps/api/src/resellers/guards/reseller.guard.ts` extending JwtAuthGuard, checking role + status
6. Create `apps/api/src/resellers/guards/admin.guard.ts` checking role=admin
7. Add `role` to JWT payload in existing JwtStrategy
8. Create DTOs: CreateResellerDto, LoginDto
9. Wire into ResellersModule

---

### T-003: Admin Reseller Approval, Rejection, and Profile Endpoints

**User Story**: US-001
**Satisfies ACs**: AC-US1-02, AC-US1-03, AC-US1-04
**Status**: [x] completed

**Test Plan**:
- **Given** a pending Reseller record exists
- **When** an admin calls PUT /admin/resellers/:id/approve
- **Then** Reseller.status becomes ACTIVE and the reseller can subsequently pass ResellerGuard

- **Given** an admin calls PUT /admin/resellers/:id/reject
- **When** the request is processed
- **Then** Reseller.status becomes REJECTED and portal access is denied

**Test Cases**:
1. **Unit**: `apps/api/src/resellers/resellers.service.spec.ts`
   - testApprove_transitionsPendingToActive(): PENDING -> ACTIVE, updatedAt changes
   - testReject_transitionsPendingToRejected(): PENDING -> REJECTED
   - testApprove_alreadyActive_throwsConflict(): ConflictException thrown
   - testFindAll_returnsResellers(): paginated list with status filter
   - testFindById_returnsFullProfile(): includes linked coupons and commission counts
   - **Coverage Target**: 90%

2. **Integration**: `apps/api/src/resellers/resellers-admin.controller.e2e.spec.ts`
   - testListResellers_requiresAdminJwt(): GET /admin/resellers returns 403 without admin token
   - testApprove_setsActive(): PUT approve -> status=ACTIVE in DB
   - testReject_setsRejected(): PUT reject -> status=REJECTED in DB
   - testApprovedReseller_passesResellerGuard(): active JWT accepted on protected endpoints
   - testRejectedReseller_failsResellerGuard(): rejected JWT denied
   - **Coverage Target**: 85%

**Implementation**:
1. Create `apps/api/src/resellers/resellers.service.ts` with approve(), reject(), findAll(), findById(), updateProfile()
2. Create `apps/api/src/resellers/resellers-admin.controller.ts` with GET /admin/resellers, GET /admin/resellers/:id, PUT approve/reject/deactivate
3. Create `apps/api/src/resellers/resellers.controller.ts` for GET /resellers/me, PUT /resellers/me
4. Create `apps/api/src/resellers/resellers.module.ts` registering all providers
5. Import ResellersModule into AppModule

---

## User Story: US-002 - Reseller Coupon Creation and Approval

**Linked ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04, AC-US2-05
**Tasks**: 3 total, 0 completed

---

### T-004: Reseller Coupon Proposal Endpoint

**User Story**: US-002
**Satisfies ACs**: AC-US2-01, AC-US2-02
**Status**: [x] completed

**Test Plan**:
- **Given** an authenticated active reseller POSTs /resellers/me/coupons with code "ANNA10"
- **When** the endpoint processes the request
- **Then** a Coupon record is created with isResellerCoupon=true, isActive=false, and resellerId set

- **Given** "ANNA10" already exists as a coupon code
- **When** the reseller submits the same code
- **Then** 409 Conflict "Coupon code already taken" is returned

**Test Cases**:
1. **Unit**: `apps/api/src/resellers/resellers.service.spec.ts` (extends T-003 file)
   - testProposeCoupon_success(): Coupon created with isActive=false, isResellerCoupon=true, correct resellerId
   - testProposeCoupon_duplicateCode(): throws ConflictException("Coupon code already taken")
   - testProposeCoupon_inactiveReseller(): throws ForbiddenException
   - **Coverage Target**: 90%

2. **Integration**: `apps/api/src/resellers/reseller-coupons.e2e.spec.ts`
   - testProposeCoupon_createsInactiveRecord(): POST /resellers/me/coupons -> isActive=false in DB
   - testDuplicateCode_returns409(): second identical code returns 409
   - testUnauthenticated_returns401(): missing JWT returns 401
   - **Coverage Target**: 85%

**Implementation**:
1. Add proposeCoupon(resellerId, dto) to ResellersService; check code uniqueness before create
2. Create ProposeResellerCouponDto with `code: string`
3. Add POST /resellers/me/coupons and GET /resellers/me/coupons to resellers.controller.ts

---

### T-005: Admin Reseller Coupon Approval

**User Story**: US-002
**Satisfies ACs**: AC-US2-03, AC-US2-04, AC-US2-05
**Status**: [x] completed

**Test Plan**:
- **Given** an inactive reseller coupon exists (proposed by reseller)
- **When** admin calls PUT /admin/resellers/:id/coupons/:couponId/approve with all commission/discount fields
- **Then** Coupon is activated (isActive=true) with discountType, discountValue, commissionType, commissionValue, commissionBase, maturityDays all set per admin input

**Test Cases**:
1. **Unit**: `apps/api/src/resellers/resellers.service.spec.ts` (extends)
   - testApproveCoupon_setsAllFields(): all 6 admin-provided fields written to Coupon, isActive=true
   - testApproveCoupon_defaultMaturityDays30(): omitting maturityDays defaults to 30
   - testApproveCoupon_notFound(): throws NotFoundException
   - testApproveCoupon_alreadyActive(): throws ConflictException
   - **Coverage Target**: 90%

2. **Integration**: `apps/api/src/resellers/reseller-coupons.e2e.spec.ts` (extends)
   - testApproveCoupon_activatesRecord(): PUT approve -> isActive=true in DB
   - testApprovedCoupon_validatesAtCheckout(): existing CouponsService rejects expired coupon
   - **Coverage Target**: 85%

**Implementation**:
1. Create ApproveResellerCouponDto with discountType, discountValue, commissionType, commissionValue, commissionBase, maturityDays (optional, default 30)
2. Add approveCoupon(couponId, dto) to ResellersService; update Coupon in DB
3. Add PUT /admin/resellers/:id/coupons/:couponId/approve to resellers-admin.controller.ts

---

### T-006: Reseller Deactivation Cascades to Coupons

**User Story**: US-002
**Satisfies ACs**: AC-US2-05
**Status**: [x] completed

**Test Plan**:
- **Given** an active reseller has two active coupon codes
- **When** an admin calls PUT /admin/resellers/:id/deactivate
- **Then** Reseller.status = INACTIVE and both Coupons have isActive=false; the coupons are rejected at checkout

**Test Cases**:
1. **Unit**: `apps/api/src/resellers/resellers.service.spec.ts` (extends)
   - testDeactivate_setsResellerInactive(): status -> INACTIVE
   - testDeactivate_bulkDeactivatesLinkedCoupons(): updateMany on coupons where resellerId matches
   - testDeactivatedCoupon_failsCheckoutValidation(): CouponsService rejects inactive coupon
   - **Coverage Target**: 90%

2. **Integration**: `apps/api/src/resellers/resellers-admin.controller.e2e.spec.ts` (extends)
   - testDeactivate_couponsBecomeInactive(): PUT deactivate -> linked coupons isActive=false in DB
   - **Coverage Target**: 85%

**Implementation**:
1. Add deactivateReseller(id) to ResellersService: set status=INACTIVE then `prisma.coupon.updateMany({ where: { resellerId: id }, data: { isActive: false } })`
2. Wire PUT /admin/resellers/:id/deactivate to call deactivateReseller()

---

## User Story: US-003 - Order Flow with Reseller Coupon

**Linked ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04, AC-US3-05
**Tasks**: 3 total, 0 completed

---

### T-007: Commission Calculation Service

**User Story**: US-003
**Satisfies ACs**: AC-US3-03, AC-US3-04
**Status**: [x] completed

**Test Plan**:
- **Given** commissionType=PERCENTAGE, commissionValue=5, commissionBase=FINAL_TOTAL, order.total=2,730,000
- **When** calculateCommission(coupon, order) is called
- **Then** returns 136,500 VND

- **Given** commissionType=FIXED, commissionValue=50,000
- **When** calculateCommission is called with any order total
- **Then** returns exactly 50,000 VND

**Test Cases**:
1. **Unit**: `apps/api/src/commissions/commissions.service.spec.ts`
   - testPercentageFinalTotal(): 5% of 2,730,000 = 136,500
   - testPercentageSubtotal(): 5% of 3,000,000 = 150,000
   - testFixedAmount(): returns commissionValue regardless of order total
   - testRounding(): fractional VND is rounded (Math.round)
   - testZeroCommissionValue(): returns 0
   - **Coverage Target**: 95%

**Implementation**:
1. Create `apps/api/src/commissions/commissions.service.ts` with calculateCommission(coupon, order): number
2. Logic: base = (commissionBase === FINAL_TOTAL) ? order.total : order.subtotal; return PERCENTAGE ? Math.round(base * value / 100) : value
3. Create `apps/api/src/commissions/commissions.module.ts`

---

### T-008: Checkout Integration - Commission Creation on Order Placement

**User Story**: US-003
**Satisfies ACs**: AC-US3-01, AC-US3-02, AC-US3-05
**Status**: [x] completed

**Test Plan**:
- **Given** a customer applies reseller coupon "ANNA10" (10% off, isResellerCoupon=true) at checkout with subtotal 3,000,000 VND
- **When** placeOrder transaction completes
- **Then** Order.channel="reseller", Order.resellerId is set, and a Commission record exists with status=PENDING and commissionAmount=300,000 VND

- **Given** a non-reseller coupon is used
- **When** placeOrder completes
- **Then** no Commission record is created

**Test Cases**:
1. **Unit**: `apps/api/src/checkout/checkout.service.spec.ts` (extends existing file)
   - testPlaceOrder_resellerCoupon_setsChannel(): Order.channel="reseller"
   - testPlaceOrder_resellerCoupon_setsResellerId(): Order.resellerId = coupon.resellerId
   - testPlaceOrder_resellerCoupon_createsCommission(): Commission created with status=PENDING
   - testPlaceOrder_regularCoupon_noCommission(): Commission NOT created
   - testPlaceOrder_atomicity(): if Commission create fails, entire transaction rolls back
   - **Coverage Target**: 90%

2. **Integration**: `apps/api/src/checkout/checkout.e2e.spec.ts` (extends existing)
   - testCheckoutWithResellerCoupon_createsCommission(): full checkout flow, Commission row exists in DB
   - testCommissionAmount_percentageCorrect(): 10% of subtotal 3,000,000 = 300,000 stored
   - **Coverage Target**: 85%

**Implementation**:
1. Inject CommissionsService into CheckoutService
2. Inside placeOrder $transaction: if coupon.isResellerCoupon, set order.channel="reseller", order.resellerId=coupon.resellerId, create Commission with calculateCommission result
3. After transaction (outside): fire-and-forget `emailService.sendResellerNewOrder(data).catch(err => logger.error(err))`

---

### T-009: Order Status Hooks - Commission Lifecycle Triggers

**User Story**: US-003
**Satisfies ACs**: AC-US3-02, AC-US4-01, AC-US4-03
**Status**: [x] completed

**Test Plan**:
- **Given** an order with a linked PENDING Commission
- **When** order status is updated to DELIVERED
- **Then** Commission becomes MATURING, orderDeliveredAt is set, maturityDate = deliveredAt + coupon.maturityDays

- **Given** a Commission with status=PENDING or MATURING
- **When** order status is updated to CANCELLED
- **Then** Commission becomes VOIDED with voidedAt and voidReason="Order cancelled"

**Test Cases**:
1. **Unit**: `apps/api/src/orders/orders.service.spec.ts` (extends existing)
   - testUpdateStatus_delivered_transitionsToMaturing(): PENDING -> MATURING
   - testUpdateStatus_delivered_setsOrderDeliveredAt(): timestamp stored
   - testUpdateStatus_delivered_calculatesMaturityDate(): deliveredAt + maturityDays days
   - testUpdateStatus_cancelled_voidsCommission(): PENDING -> VOIDED, voidReason set
   - testUpdateStatus_returned_voidsMaturingCommission(): MATURING -> VOIDED
   - testUpdateStatus_nonResellerOrder_noEffect(): no Commission action if no reseller order
   - **Coverage Target**: 90%

2. **Integration**: `apps/api/src/orders/order-commission-hooks.e2e.spec.ts`
   - testDelivered_commissionBecomesMaturing(): full flow, DB status=MATURING
   - testCancelled_commissionBecomesVoided(): DB status=VOIDED
   - **Coverage Target**: 85%

**Implementation**:
1. Inject CommissionsService into OrdersService
2. In updateStatus(): if DELIVERED -> CommissionsService.transitionToMaturing(orderId, deliveredAt, maturityDays)
3. If CANCELLED or RETURNED -> CommissionsService.voidByOrderId(orderId, "Order cancelled" | "Order returned")
4. Add transitionToMaturing() and voidByOrderId() to CommissionsService

---

## User Story: US-004 - Commission Lifecycle Management

**Linked ACs**: AC-US4-01, AC-US4-02, AC-US4-03, AC-US4-04, AC-US4-05
**Tasks**: 3 total, 0 completed

---

### T-010: Commission Service - Full Lifecycle Transitions

**User Story**: US-004
**Satisfies ACs**: AC-US4-01, AC-US4-02, AC-US4-03, AC-US4-04, AC-US4-05
**Status**: [x] completed

**Test Plan**:
- **Given** a Commission with status=MATURING where maturityDate <= NOW()
- **When** approveMaturedCommissions() runs
- **Then** status becomes APPROVED with approvedAt set

- **Given** an APPROVED Commission
- **When** admin calls processPayouts([commissionId])
- **Then** status becomes PAID with paidAt set

**Test Cases**:
1. **Unit**: `apps/api/src/commissions/commissions.service.spec.ts` (extends T-007)
   - testTransitionToMaturing_setsAllDates(): orderDeliveredAt, maturityDate set correctly
   - testApproveMatured_onlyExpired(): commissions with future maturityDate untouched
   - testApproveMatured_setsApprovedAt(): approvedAt timestamp stored
   - testVoidByOrderId_pending(): PENDING -> VOIDED
   - testVoidByOrderId_maturing(): MATURING -> VOIDED
   - testVoidByOrderId_alreadyApproved(): throws ConflictException
   - testProcessPayouts_approved(): APPROVED -> PAID, paidAt set
   - testProcessPayouts_notApproved(): throws ConflictException
   - testCommissionModel_allFields(): all 14 AC-US4-05 fields present
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/commissions/commissions.controller.e2e.spec.ts`
   - testGetCommissions_resellerScopedToOwn(): reseller cannot see other resellers' commissions
   - testProcessPayouts_adminOnly(): non-admin returns 403
   - testProcessPayouts_batchMarksAllPaid(): multiple commission IDs all set to PAID
   - **Coverage Target**: 85%

**Implementation**:
1. Extend CommissionsService with transitionToMaturing(), approveMaturedCommissions(), voidByOrderId(), processPayouts(ids[])
2. Create `apps/api/src/commissions/commissions.controller.ts`: GET /resellers/me/commissions (status filter), GET /resellers/me/commissions/stats
3. Create `apps/api/src/commissions/commissions-admin.controller.ts`: GET /admin/commissions, POST /admin/commissions/payout
4. Create DTOs: ProcessPayoutDto { commissionIds: string[] }, FilterCommissionsDto { status? }

---

### T-011: Commission Maturity Cron Job

**User Story**: US-004
**Satisfies ACs**: AC-US4-02
**Status**: [x] completed

**Test Plan**:
- **Given** commissions with status=MATURING and maturityDate in the past exist in DB
- **When** the hourly cron fires
- **Then** all eligible commissions are set to APPROVED and each affected reseller receives an approval email

**Test Cases**:
1. **Unit**: `apps/api/src/commissions/commissions-cron.service.spec.ts`
   - testCron_queriesExpiredMaturityDate(): WHERE status=MATURING AND maturityDate <= NOW()
   - testCron_batchUpdatesToApproved(): all matching rows updated
   - testCron_sendsEmailPerReseller(): one email per unique resellerId (not per commission)
   - testCron_idempotent(): second run does not re-approve already-approved commissions
   - testCron_skipsFutureMaturityDate(): future-dated commissions unchanged
   - **Coverage Target**: 90%

**Implementation**:
1. Install: `pnpm add @nestjs/schedule --filter api`
2. Create `apps/api/src/commissions/commissions-cron.service.ts`
3. Add `@Cron(CronExpression.EVERY_HOUR)` method calling CommissionsService.approveMaturedCommissions()
4. Group results by resellerId, send one approval email per reseller via EmailService
5. Add ScheduleModule.forRoot() to CommissionsModule imports

---

### T-012: Admin Payout Processing

**User Story**: US-004
**Satisfies ACs**: AC-US4-04
**Status**: [x] completed

**Test Plan**:
- **Given** several commissions have status=APPROVED
- **When** admin POSTs /admin/commissions/payout with selected commission IDs
- **Then** all selected commissions become PAID with paidAt set and affected resellers receive payout emails

**Test Cases**:
1. **Integration**: `apps/api/src/commissions/commissions-admin.controller.e2e.spec.ts` (extends T-010)
   - testPayout_batchSuccess(): multiple IDs all set to PAID in one request
   - testPayout_mixedStatuses_rollsBack(): including non-APPROVED commission rolls back entire batch
   - testPayout_triggersEmailPerReseller(): EmailService.sendResellerCommissionPaid called per reseller
   - **Coverage Target**: 85%

**Implementation**:
1. processPayouts(ids) in CommissionsService: verify all APPROVED, update inside $transaction with paidAt=now()
2. After transaction: group by resellerId, fire-and-forget payout email per reseller
3. POST /admin/commissions/payout with ProcessPayoutDto

---

## User Story: US-005 - Email Notifications for Resellers

**Linked ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04, AC-US5-05
**Tasks**: 2 total, 0 completed

---

### T-013: EmailModule Setup - Nodemailer and Handlebars Templates

**User Story**: US-005
**Satisfies ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04, AC-US5-05
**Status**: [x] completed

**Test Plan**:
- **Given** SMTP env vars are configured (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
- **When** EmailService.sendResellerNewOrder(data) is called
- **Then** email is sent containing orderId, product names, order total, estimated commission, and customer city

**Test Cases**:
1. **Unit**: `apps/api/src/email/email.service.spec.ts`
   - testSendNewOrder_includesRequiredFields(): orderId, products, total, estimatedCommission, customerCity in rendered template
   - testSendOrderDelivered_includesMaturityInfo(): deliveryDate and maturityDate countdown present
   - testSendCommissionApproved_includesAmount(): commissionAmount in email
   - testSendCommissionPaid_includesPaymentDetails(): paidAt, amount, method present
   - testSendCommissionVoided_includesReason(): voidReason in email
   - testSendFailure_neverThrows(): transport error is caught and logged, caller receives void
   - **Coverage Target**: 90%

**Implementation**:
1. Install: `pnpm add nodemailer handlebars && pnpm add -D @types/nodemailer` (filter: apps/api)
2. Create `apps/api/src/email/email.module.ts` as `@Global()` module
3. Create `apps/api/src/email/email.service.ts` with 5 typed send methods
4. Create Handlebars templates in `apps/api/src/email/templates/`:
   - `reseller-new-order.hbs`
   - `reseller-order-delivered.hbs`
   - `reseller-commission-approved.hbs`
   - `reseller-commission-paid.hbs`
   - `reseller-commission-voided.hbs`
5. Configure Nodemailer transport from env vars; use console transport in test/dev
6. Import EmailModule into AppModule

---

### T-014: Email Integration at All Lifecycle Events

**User Story**: US-005
**Satisfies ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04, AC-US5-05
**Status**: [x] completed

**Test Plan**:
- **Given** a reseller coupon order is placed
- **When** CheckoutService.placeOrder() completes
- **Then** EmailService.sendResellerNewOrder() is called fire-and-forget (does not block order response)

- **Given** EmailService throws an error
- **When** any lifecycle caller invokes a send method
- **Then** the caller succeeds and the error is only logged, never propagated

**Test Cases**:
1. **Unit** (mocked EmailService in each calling service spec):
   - testCheckout_emailCalledAfterTransaction(): spy confirms sendResellerNewOrder called once
   - testOrderDelivered_emailCalledWithMaturityDate(): spy confirms sendResellerOrderDelivered called with maturityDate
   - testCronApproved_emailCalledPerReseller(): spy confirms sendResellerCommissionApproved grouped by reseller
   - testPayout_emailCalledPerReseller(): spy confirms sendResellerCommissionPaid called per reseller
   - testVoided_emailCalledWithReason(): spy confirms sendResellerCommissionVoided called with voidReason
   - testEmailThrows_callerDoesNotFail(): mock throws, caller returns success
   - **Coverage Target**: 90%

**Implementation**:
1. All email calls pattern: `emailService.sendX(data).catch(err => this.logger.error('Email failed', err))`
2. Verify email is wired in: CheckoutService (new order), OrdersService (delivered + voided), CommissionsCronService (approved), CommissionsService.processPayouts (paid)
3. Ensure all callers inject EmailService via constructor DI

---

## User Story: US-006 - Reseller Portal Dashboard

**Linked ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-04, AC-US6-05, AC-US6-06
**Tasks**: 3 total, 0 completed

---

### T-015: Reseller Portal - Layout, Registration, and Login Pages

**User Story**: US-006
**Satisfies ACs**: AC-US6-01 (access control gate)
**Status**: [x] completed

**Test Plan**:
- **Given** a visitor navigates to /reseller/register
- **When** they submit the form with name, email, password, phone, socialProfiles, reason
- **Then** POST /resellers/register is called and a success message is shown

- **Given** a visitor has no valid JWT and navigates to /reseller/dashboard
- **When** the reseller layout auth check runs
- **Then** they are redirected to /reseller/login

**Test Cases**:
1. **Unit**: `apps/web/src/app/reseller/register/page.test.tsx`
   - testFormRendersAllRequiredFields(): name, email, password, phone, socialProfiles, reason fields
   - testSubmit_callsRegisterEndpoint(): POST /resellers/register called on submit
   - testSuccess_showsConfirmationMessage(): confirmation banner shown after 201
   - testValidation_emptyRequiredFields(): error messages shown without submit
   - **Coverage Target**: 85%

2. **Unit**: `apps/web/src/app/reseller/layout.test.tsx`
   - testLayout_redirectsUnauthenticated(): no JWT -> redirect to /reseller/login
   - testLayout_redirectsCustomerRole(): customer JWT -> redirect
   - testLayout_allowsActiveResellerJwt(): reseller JWT passes layout check
   - **Coverage Target**: 85%

**Implementation**:
1. Create `apps/web/src/app/reseller/layout.tsx`: reads JWT from cookie, checks role=reseller, redirects to /reseller/login if invalid
2. Create `apps/web/src/app/reseller/register/page.tsx`: public form, POST /resellers/register on submit
3. Create `apps/web/src/app/reseller/login/page.tsx`: email/password form, POST /resellers/login, stores JWT in cookie on success

---

### T-016: Reseller Portal - Dashboard, Orders, Commissions, and Payouts Pages

**User Story**: US-006
**Satisfies ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-04
**Status**: [x] completed

**Test Plan**:
- **Given** an active reseller is authenticated at /reseller/dashboard
- **When** the page loads
- **Then** 4 summary cards display total orders, total revenue, total commission earned, total commission paid

- **Given** an active reseller navigates to /reseller/commissions
- **When** they click the "maturing" status tab
- **Then** only MATURING commissions are shown with a days-remaining countdown to maturityDate

**Test Cases**:
1. **Unit**: `apps/web/src/app/reseller/dashboard/page.test.tsx`
   - testDashboardRenders4SummaryCards(): 4 metric cards with labels rendered
   - testDashboardFetches_meEndpoint(): GET /resellers/me/dashboard called on mount
   - **Coverage Target**: 80%

2. **Unit**: `apps/web/src/app/reseller/commissions/page.test.tsx`
   - testCommissions_statusFilterTabs(): 5 tabs (pending, maturing, approved, paid, voided) rendered
   - testCommissions_maturingShowsCountdown(): days remaining field displayed for MATURING rows
   - testCommissions_tabChangeUpdatesApiParam(): status query param changes on tab click
   - **Coverage Target**: 80%

3. **Unit**: `apps/web/src/app/reseller/orders/page.test.tsx`
   - testOrders_showsRequiredColumns(): orderId, date, total, commissionStatus columns
   - **Coverage Target**: 80%

**Implementation**:
1. Create `apps/web/src/app/reseller/dashboard/page.tsx`: fetch GET /resellers/me/dashboard, render 4 summary cards
2. Create `apps/web/src/app/reseller/orders/page.tsx`: fetch GET /resellers/me/orders, paginated table
3. Create `apps/web/src/app/reseller/commissions/page.tsx`: status tab filter, commission rows, maturity countdown for MATURING
4. Create `apps/web/src/app/reseller/payouts/page.tsx`: commissions filtered to PAID, shows paidAt + amount

---

### T-017: Reseller Portal - Profile Settings and Coupon Shareable Links

**User Story**: US-006
**Satisfies ACs**: AC-US6-05, AC-US6-06
**Status**: [x] completed

**Test Plan**:
- **Given** a reseller views /reseller/profile and updates their bank info
- **When** they click Save
- **Then** PUT /resellers/me is called and a success toast is shown

- **Given** a reseller views /reseller/coupons with code "ANNA10"
- **When** they click "Copy shareable link"
- **Then** clipboard receives "https://shopvui.com?coupon=ANNA10"

**Test Cases**:
1. **Unit**: `apps/web/src/app/reseller/profile/page.test.tsx`
   - testProfile_preFilledFromGetMe(): form pre-populates from GET /resellers/me response
   - testProfile_saveCallsPutEndpoint(): PUT /resellers/me called on submit
   - testProfile_bankInfoFieldsRendered(): bank name, account number, holder name fields present
   - **Coverage Target**: 80%

2. **Unit**: `apps/web/src/app/reseller/coupons/page.test.tsx`
   - testCoupons_showsCouponCode(): code displayed in list
   - testCoupons_shareableLinkFormat(): link is `${origin}?coupon=${code}`
   - testCoupons_copyToClipboard(): navigator.clipboard.writeText called with correct URL
   - **Coverage Target**: 80%

**Implementation**:
1. Create `apps/web/src/app/reseller/profile/page.tsx`: form for bankInfo (bank name/account/holder), phone, socialProfiles; PUT /resellers/me on save
2. Create `apps/web/src/app/reseller/coupons/page.tsx`: GET /resellers/me/coupons, "Copy link" button uses navigator.clipboard.writeText
3. Handle shareable link auto-fill: in `apps/web/src/app/layout.tsx` middleware, read `?coupon=` from URL params, store in localStorage for checkout pre-fill

---

## User Story: US-007 - Admin Reseller Management

**Linked ACs**: AC-US7-01, AC-US7-02, AC-US7-03, AC-US7-04, AC-US7-05
**Tasks**: 3 total, 0 completed

---

### T-018: Admin Reseller List and Detail Pages

**User Story**: US-007
**Satisfies ACs**: AC-US7-01, AC-US7-02
**Status**: [x] completed

**Test Plan**:
- **Given** an admin is on /admin/resellers
- **When** the page loads
- **Then** a table shows all resellers with status, total orders, total revenue, and pending commission amount

- **Given** the admin clicks a reseller row
- **When** /admin/resellers/:id loads
- **Then** full profile, linked coupons, order history, and commission breakdown by status are shown

**Test Cases**:
1. **Unit**: `apps/web/src/app/admin/resellers/page.test.tsx`
   - testAdminList_showsRequiredColumns(): status, total orders, revenue, pending commission columns
   - testAdminList_fetchesAdminEndpoint(): GET /admin/resellers called
   - testAdminList_rowClickNavigatesToDetail(): router.push to /admin/resellers/:id on row click
   - **Coverage Target**: 80%

2. **Unit**: `apps/web/src/app/admin/resellers/[id]/page.test.tsx`
   - testDetail_showsProfileFields(): name, email, phone, status, socialProfiles rendered
   - testDetail_showsLinkedCoupons(): coupon code list rendered
   - testDetail_showsCommissionBreakdown(): counts by status (5 statuses)
   - **Coverage Target**: 80%

**Implementation**:
1. Create `apps/web/src/app/admin/resellers/page.tsx`: table fetching GET /admin/resellers
2. Create `apps/web/src/app/admin/resellers/[id]/page.tsx`: tabs for profile, coupons, orders, commissions

---

### T-019: Admin Coupon Approval Form

**User Story**: US-007
**Satisfies ACs**: AC-US7-05
**Status**: [x] completed

**Test Plan**:
- **Given** an admin navigates to the coupon approval page for a pending reseller coupon
- **When** they fill all 6 fields and submit
- **Then** PUT /admin/resellers/:id/coupons/:couponId/approve is called and the coupon is activated

**Test Cases**:
1. **Unit**: `apps/web/src/app/admin/resellers/[id]/coupons/[couponId]/approve/page.test.tsx`
   - testForm_renders6Fields(): discountType, discountValue, commissionType, commissionValue, commissionBase, maturityDays
   - testForm_commissionBaseOptions(): SUBTOTAL and FINAL_TOTAL select options present
   - testForm_maturityDaysDefaults30(): maturityDays input initializes to 30
   - testForm_submit_callsApproveEndpoint(): PUT approve called with all field values
   - **Coverage Target**: 80%

**Implementation**:
1. Create `apps/web/src/app/admin/resellers/[id]/coupons/[couponId]/approve/page.tsx`
2. Form fields: discountType (select: PERCENTAGE/FIXED), discountValue (number), commissionType (select), commissionValue (number), commissionBase (select: SUBTOTAL/FINAL_TOTAL), maturityDays (number, default 30)
3. On submit: PUT /admin/resellers/:resellerId/coupons/:couponId/approve

---

### T-020: Admin Payout Processing and Reseller Deactivation UI

**User Story**: US-007
**Satisfies ACs**: AC-US7-03, AC-US7-04
**Status**: [x] completed

**Test Plan**:
- **Given** an admin views a reseller's APPROVED commissions
- **When** they select commissions and click "Process Payout"
- **Then** POST /admin/commissions/payout is called with selected IDs and commissions transition to PAID

- **Given** an admin clicks "Deactivate Reseller" and confirms the dialog
- **When** the request is processed
- **Then** PUT /admin/resellers/:id/deactivate is called and the page shows the reseller as INACTIVE

**Test Cases**:
1. **Unit**: `apps/web/src/app/admin/resellers/[id]/page.test.tsx` (extends T-018)
   - testPayoutButton_visibleForApproved(): "Process Payout" visible when APPROVED commissions exist
   - testPayoutSubmit_sendsSelectedIds(): POST /admin/commissions/payout called with checked IDs
   - testDeactivateButton_showsConfirmDialog(): clicking deactivate opens confirmation modal
   - testDeactivateConfirmed_callsEndpoint(): confirm -> PUT /admin/resellers/:id/deactivate called
   - testDeactivateSuccess_statusBecomesInactive(): page refreshes showing INACTIVE status
   - **Coverage Target**: 80%

**Implementation**:
1. In reseller detail page commissions tab: add checkbox column, "Process Payout" button (enabled when at least one APPROVED is selected)
2. Payout submit calls POST /admin/commissions/payout with selected commissionIds
3. Add "Deactivate Reseller" button with confirmation modal; on confirm: PUT /admin/resellers/:id/deactivate, then refetch page data
