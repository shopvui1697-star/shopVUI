---
increment: 0005-reseller-system
title: Reseller Affiliate Coupon System
status: completed
priority: P1
type: feature
created: 2026-03-11T00:00:00.000Z
structure: user-stories
test_mode: TDD
coverage_target: 80
---

# Reseller Affiliate Coupon System

## Problem Statement

ShopVui has a coupon system (increment 0004) with reseller fields pre-wired in the Prisma schema (resellerId, commissionType, commissionValue, isResellerCoupon on Coupon; resellerId on Order), but no reseller logic exists. Affiliates, influencers, and partners have no way to register, manage coupon codes, track orders, or earn commissions. Without a reseller system, ShopVui misses an entire acquisition channel and revenue-sharing model.

## Goals

- Allow resellers to register, get approved, and manage their affiliate coupons
- Track commissions through a full lifecycle (pending, maturing, approved, paid, voided)
- Provide a self-service Reseller Portal with real-time dashboards
- Send email notifications at 5 key events in the order/commission lifecycle
- Enable admin review and management of resellers, coupons, and payouts

## Dependencies

- Increment 0004 (e-commerce flow): Coupon system, Order model, Checkout flow
- Increment 0002 (Google OAuth): Authentication system with JWT
- Existing Prisma schema fields: Coupon.resellerId, Coupon.commissionType, Coupon.commissionValue, Coupon.isResellerCoupon, Order.channel

## User Stories

### US-001: Reseller Registration and Onboarding
**Project**: shopvui
**As a** potential reseller
**I want** to submit an application with my details
**So that** I can be reviewed and approved to earn commissions

**Acceptance Criteria**:
- [x] **AC-US1-01**: Given I visit /reseller/register, when I submit the form with name, email, phone, social profiles (JSON), and reason, then an application is created with status "pending" and I see a confirmation message
- [x] **AC-US1-02**: Given a pending application exists, when an admin views the reseller management page, then they see the application details and can approve or reject it
- [x] **AC-US1-03**: Given an admin approves my application, when I next visit the site, then my Reseller record status is "active" and I can access the Reseller Portal at /reseller/dashboard
- [x] **AC-US1-04**: Given an admin rejects my application, when I check my status, then I see "rejected" with no portal access
- [x] **AC-US1-05**: Given the Reseller model, then it stores id, userId, name, email, phone, socialProfiles (JSON), status (pending|active|inactive|rejected), bankInfo (JSON), defaultCommissionType, defaultCommissionValue, createdAt, updatedAt

---

### US-002: Reseller Coupon Creation and Approval
**Project**: shopvui
**As an** active reseller
**I want** to propose a unique coupon code with my preferred name
**So that** I can share it with my audience for tracked purchases

**Acceptance Criteria**:
- [x] **AC-US2-01**: Given I am an active reseller on the portal, when I submit a proposed coupon code (e.g., "ANNA10"), then a coupon request is created linking to my reseller ID with status awaiting admin approval
- [x] **AC-US2-02**: Given I propose a code that already exists in the system, when I submit, then I receive an error "Coupon code already taken" and must choose another
- [x] **AC-US2-03**: Given an admin reviews my coupon request, when they approve it, then the Coupon record is created with isResellerCoupon=true, my resellerId, admin-set discount value, commission_type, commission_value, and commission_base (subtotal|final_total)
- [x] **AC-US2-04**: Given a reseller coupon is created, then it has a maturity_days field defaulting to 30 that determines the commission waiting period after delivery
- [x] **AC-US2-05**: Given a reseller coupon, then it follows all existing coupon validation rules (expiry, usage limits, min purchase) from increment 0004

---

### US-003: Order Flow with Reseller Coupon
**Project**: shopvui
**As a** customer
**I want** to use a reseller's coupon code at checkout
**So that** I get a discount while the reseller earns commission

**Acceptance Criteria**:
- [x] **AC-US3-01**: Given a valid reseller coupon "ANNA10" (10% off), when I apply it at checkout with subtotal 3,000,000 VND, then discount of 300,000 VND is applied and the order records resellerId from the coupon
- [x] **AC-US3-02**: Given an order is placed with a reseller coupon, then a Commission record is created with status "pending", the couponCode, orderTotal, and calculated commissionAmount
- [x] **AC-US3-03**: Given commission_type is "percentage" and commission_value is 5 and commission_base is "final_total", when order final total (after discount + shipping) is 2,730,000 VND, then commissionAmount is 136,500 VND
- [x] **AC-US3-04**: Given commission_type is "fixed" and commission_value is 50,000, when any order is placed with this reseller coupon, then commissionAmount is 50,000 VND regardless of order total
- [x] **AC-US3-05**: Given an order with a reseller coupon, then the order's channel field is set to "reseller"

---

### US-004: Commission Lifecycle Management
**Project**: shopvui
**As a** system
**I want** to track commissions through their full lifecycle
**So that** resellers are paid accurately and only for completed orders

**Acceptance Criteria**:
- [x] **AC-US4-01**: Given a commission with status "pending" and the order status changes to "delivered", when the delivery is confirmed, then the commission status changes to "maturing" with orderDeliveredAt set and maturityDate calculated as deliveredAt + maturity_days
- [x] **AC-US4-02**: Given a commission with status "maturing" and maturityDate has passed with no return or cancellation, when the maturity check runs, then the commission status changes to "approved" with approvedAt set
- [x] **AC-US4-03**: Given a commission with status "pending" or "maturing" and the order is cancelled or returned, when the cancellation/return is processed, then the commission status changes to "voided" with voidedAt and voidReason set
- [x] **AC-US4-04**: Given a commission with status "approved", when an admin processes the payout, then the commission status changes to "paid" with paidAt set
- [x] **AC-US4-05**: Given the Commission model, then it stores id, orderId, resellerId, couponCode, orderTotal, commissionAmount, status (pending|maturing|approved|paid|voided), orderDeliveredAt, maturityDate, approvedAt, paidAt, voidedAt, voidReason, createdAt

---

### US-005: Email Notifications for Resellers
**Project**: shopvui
**As a** reseller
**I want** to receive email notifications at key events
**So that** I stay informed about orders and commissions tied to my coupon

**Acceptance Criteria**:
- [x] **AC-US5-01**: Given a new order is placed with my reseller coupon, then I receive an email with order ID, product names, order total, estimated commission, and customer city
- [x] **AC-US5-02**: Given an order linked to my coupon is marked "delivered", then I receive an email confirming delivery and that the 30-day maturity countdown has started
- [x] **AC-US5-03**: Given a commission transitions to "approved", then I receive an email confirming the commission amount is ready for payout
- [x] **AC-US5-04**: Given an admin processes my commission payout, then I receive an email with payment amount and payment method
- [x] **AC-US5-05**: Given an order linked to my coupon is cancelled or returned within the maturity period, then I receive an email stating the commission has been voided with the reason

---

### US-006: Reseller Portal Dashboard
**Project**: shopvui
**As an** active reseller
**I want** a self-service portal with real-time statistics
**So that** I can track my performance and manage my account

**Acceptance Criteria**:
- [x] **AC-US6-01**: Given I am logged in as an active reseller at /reseller/dashboard, then I see summary cards showing total orders, total revenue generated, total commission earned, and total commission paid
- [x] **AC-US6-02**: Given I navigate to the orders tab, then I see a list of all orders placed using my coupon code(s) with order ID, date, total, and commission status
- [x] **AC-US6-03**: Given I navigate to the commissions tab, then I see all commissions with filterable statuses (pending, maturing, approved, paid, voided) showing amounts, dates, and maturity countdown for "maturing" entries
- [x] **AC-US6-04**: Given I navigate to the payout history tab, then I see all paid commissions with payment date, amount, and method
- [x] **AC-US6-05**: Given I navigate to profile settings, then I can update my bank/payment details (bankInfo JSON), phone, and social profiles
- [x] **AC-US6-06**: Given I view my coupon section, then I see my active coupon code(s), their discount values, and can generate a shareable link with the coupon pre-applied (e.g., shopvui.com?coupon=ANNA10)

---

### US-007: Admin Reseller Management
**Project**: shopvui
**As an** admin
**I want** to manage resellers, their coupons, and commission payouts
**So that** I maintain control over the affiliate program

**Acceptance Criteria**:
- [x] **AC-US7-01**: Given I am on the admin reseller page, then I see a list of all resellers with status, total orders, total revenue, and pending commission amount
- [x] **AC-US7-02**: Given I click on a reseller, then I see their full profile, linked coupons, order history, and commission breakdown by status
- [x] **AC-US7-03**: Given there are approved commissions, when I select commissions and click "Process Payout", then the selected commissions transition to "paid" and the reseller is notified via email
- [x] **AC-US7-04**: Given I want to deactivate a reseller, when I set their status to "inactive", then their linked coupons are also deactivated and cannot be used at checkout
- [x] **AC-US7-05**: Given I am creating/approving a reseller coupon, then I can set discount_type, discount_value, commission_type (percentage|fixed), commission_value, commission_base (subtotal|final_total), and maturity_days

## Data Models

### Reseller (NEW)
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| userId | String | FK to User |
| name | String | Full name |
| email | String | Contact email |
| phone | String? | Phone number |
| socialProfiles | Json? | Instagram, TikTok, YouTube, etc. |
| reason | String? | Application reason |
| status | Enum | pending, active, inactive, rejected |
| bankInfo | Json? | Bank name, account number, holder name |
| defaultCommissionType | Enum? | percentage, fixed |
| defaultCommissionValue | Int? | Rate or fixed VND amount |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Commission (NEW)
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| orderId | String | FK to Order |
| resellerId | String | FK to Reseller |
| couponCode | String | Coupon used |
| orderTotal | Int | Order total in VND |
| commissionAmount | Int | Calculated commission in VND |
| status | Enum | pending, maturing, approved, paid, voided |
| orderDeliveredAt | DateTime? | When order was delivered |
| maturityDate | DateTime? | deliveredAt + maturity_days |
| approvedAt | DateTime? | When commission was approved |
| paidAt | DateTime? | When payout was processed |
| voidedAt | DateTime? | When commission was voided |
| voidReason | String? | Reason for voiding |
| createdAt | DateTime | |

### Coupon (EXTEND existing - add fields)
| Field | Type | Notes |
|-------|------|-------|
| commissionBase | Enum? | subtotal, final_total |
| maturityDays | Int | Default 30 |

Note: resellerId, commissionType, commissionValue, isResellerCoupon already exist in schema.

## Success Criteria

- Reseller registration-to-active flow completes in under 3 clicks for admin
- Commission calculation matches the documented formula (see PRD section 3.7)
- All 5 email notification types are sent at the correct lifecycle events
- Reseller portal loads dashboard data in under 2 seconds
- Zero commission leakage: every reseller-coupon order creates a Commission record

## Out of Scope

- Automated payout via payment gateway (payouts are admin-triggered manual process)
- Multi-level or tiered affiliate structures (no referral chains)
- Reseller self-registration of coupon discount values (admin controls discount and commission rates)
- Public reseller directory or marketplace
- Real-time websocket updates on the portal (polling or page refresh is acceptable)
- Reseller-specific landing pages or storefronts
