---
increment: 0004-ecommerce-flow
title: Full Customer E-Commerce Flow
status: completed
priority: P0
type: feature
created: 2026-03-11T00:00:00.000Z
---

# Full Customer E-Commerce Flow

## Problem Statement

ShopVui has a product catalog (increment 0003) but no way for customers to actually purchase products. There is no pricing tier system, no cart, no checkout, and no order tracking. Without a complete buying journey, the catalog is purely informational and generates zero revenue.

## Goals

- Enable end-to-end purchasing from browsing to order confirmation
- Support quantity-based pricing tiers (VND, integer math)
- Provide 5 coupon types with flexible rules and reseller-ready schema
- Integrate VNPay, Momo, bank transfer, and COD payment methods
- Give customers order history and saved address management
- Lay schema groundwork for future reseller and multi-channel increments

## User Stories

### US-001: Quantity-Based Pricing Tiers
**Project**: shopvui
**As a** customer
**I want** to see prices that decrease when I buy larger quantities
**So that** I am incentivized to purchase more units at a better rate

**Acceptance Criteria**:
- [x] **AC-US1-01**: Given a product with price tiers (1-5: 1,500,000 / 6-10: 1,300,000 / 11+: 1,100,000), when I view the product detail page, then all tier breakpoints and their unit prices are displayed
- [x] **AC-US1-02**: Given I select quantity 7 for a product with the tiers above, when the price is calculated, then the unit price is 1,300,000 VND and subtotal is 9,100,000 VND
- [x] **AC-US1-03**: Given a product has no price tiers defined, when I view the product, then the base price is used as the unit price for any quantity
- [x] **AC-US1-04**: Given the PriceTier model, then it stores product_id, min_qty, max_qty (nullable for open-ended), and price as integer (VND)
- [x] **AC-US1-05**: Given an admin creates overlapping tier ranges for a product, when saving, then a validation error is returned preventing the overlap

---

### US-002: Coupon Code System
**Project**: shopvui
**As a** customer
**I want** to apply coupon codes at checkout for discounts
**So that** I can save money on my purchases

**Acceptance Criteria**:
- [x] **AC-US2-01**: Given a percentage coupon (SAVE10, 10%, max discount 500,000), when applied to a 3,000,000 VND subtotal, then discount is 300,000 VND
- [x] **AC-US2-02**: Given a percentage coupon (SAVE50, 50%, max discount 500,000), when applied to a 3,000,000 VND subtotal, then discount is capped at 500,000 VND
- [x] **AC-US2-03**: Given a fixed-amount coupon (FLAT200K, 200,000), when applied, then exactly 200,000 VND is subtracted from subtotal
- [x] **AC-US2-04**: Given a free-shipping coupon (FREESHIP), when applied, then shipping fee becomes 0 VND
- [x] **AC-US2-05**: Given a buy-X-get-Y coupon (BUY2GET1, buy 2 get 1 free), when cart has 3+ of the applicable product, then the cheapest qualifying item is free

---

### US-003: Coupon Validation Rules
**Project**: shopvui
**As a** system
**I want** to enforce coupon constraints before applying discounts
**So that** coupons are only used within their intended rules

**Acceptance Criteria**:
- [x] **AC-US3-01**: Given a coupon with valid_until in the past, when a customer applies it, then it is rejected with message "Coupon has expired"
- [x] **AC-US3-02**: Given a coupon with usage_limit of 100 and 100 redemptions already recorded, when applied, then it is rejected with "Coupon usage limit reached"
- [x] **AC-US3-03**: Given a coupon with per_user_limit of 1 and the current user has already used it once, when applied again, then it is rejected with "You have already used this coupon"
- [x] **AC-US3-04**: Given a coupon restricted to category "Electronics" and the cart contains only "Clothing" items, then the coupon is rejected with "Coupon not applicable to items in cart"
- [x] **AC-US3-05**: Given a min_purchase coupon (BIG500K, requires 500,000 minimum), when subtotal is 400,000, then it is rejected with "Minimum purchase of 500,000 VND required"

### US-004: Shopping Cart
**Project**: shopvui
**As a** customer
**I want** to add products to a cart, adjust quantities, and see real-time price updates
**So that** I can review my selections before proceeding to checkout

**Acceptance Criteria**:
- [x] **AC-US4-01**: Given I am on a product page, when I select quantity and click "Add to Cart", then the item is added with the correct tier-based unit price and the cart icon updates with the item count
- [x] **AC-US4-02**: Given I have items in my cart, when I change the quantity of an item, then the unit price recalculates based on the new quantity tier and the subtotal updates accordingly
- [x] **AC-US4-03**: Given I am a guest user, when I add items to the cart, then items are persisted in localStorage and survive page refreshes
- [x] **AC-US4-04**: Given I am a guest with items in localStorage cart and I log in, when login completes, then guest cart items are merged into my DB-backed cart (quantities summed for duplicate products)
- [x] **AC-US4-05**: Given I have items in my cart, when I apply a valid coupon code, then the discount is calculated instantly and the order summary shows subtotal, quantity discount, coupon discount, shipping, and final total

---

### US-005: Checkout and Payment
**Project**: shopvui
**As a** customer
**I want** to complete my purchase using VNPay, Momo, bank transfer, or COD
**So that** I can pay with my preferred method and receive an order confirmation

**Acceptance Criteria**:
- [x] **AC-US5-01**: Given I proceed to checkout with items in my cart, when I select a delivery address and payment method, then I see a final order summary with all line items, discounts, shipping, and total before confirming
- [x] **AC-US5-02**: Given I choose VNPay, when I confirm the order, then I am redirected to VNPay payment gateway, and upon successful IPN callback the order status is set to "confirmed" and payment_status to "paid"
- [x] **AC-US5-03**: Given I choose Momo, when I confirm the order, then I am redirected to Momo payment page, and upon successful IPN callback the order status is set to "confirmed" and payment_status to "paid"
- [x] **AC-US5-04**: Given I choose COD, when I confirm the order, then the order is created with status "pending" and payment_status "unpaid", and I see a confirmation page with my order number
- [x] **AC-US5-05**: Given I choose bank transfer, when I confirm the order, then the order is created with status "pending" and payment_status "unpaid", and I see bank account details and the order reference code

---

### US-006: Customer Saved Addresses
**Project**: shopvui
**As a** customer
**I want** to save and manage my delivery addresses
**So that** I can quickly select an address during checkout without re-entering it

**Acceptance Criteria**:
- [x] **AC-US6-01**: Given I am logged in, when I navigate to my account, then I can add a new address with fields: full name, phone, street, ward, district, province, and set one as default
- [x] **AC-US6-02**: Given I have saved addresses, when I proceed to checkout, then my saved addresses are listed and I can select one or enter a new address
- [x] **AC-US6-03**: Given I have multiple addresses, when I edit or delete an address, then the changes are persisted and reflected in my address list
- [x] **AC-US6-04**: Given I delete my default address, when the deletion completes, then no address is marked as default until I explicitly set another one

---

### US-007: Order History and Tracking
**Project**: shopvui
**As a** customer
**I want** to view my past orders and their current status
**So that** I can track deliveries and reference previous purchases

**Acceptance Criteria**:
- [x] **AC-US7-01**: Given I am logged in, when I navigate to "My Orders", then I see a paginated list of my orders sorted by most recent, showing order number, date, total, and status
- [x] **AC-US7-02**: Given I click on an order, when the detail page loads, then I see all line items with quantities and prices, applied coupon, shipping fee, payment method, delivery address, and status history
- [x] **AC-US7-03**: Given an order status changes (e.g., from "confirmed" to "shipping"), then the status history records the transition timestamp and the new status is reflected on the order detail page
- [x] **AC-US7-04**: Given I have an order with status "pending" (not yet confirmed), when I click "Cancel Order", then the order status changes to "cancelled" and any payment hold is released

---

## Out of Scope

- Reseller logic, commission calculations, and reseller dashboards (future increment -- schema fields are included but unused)
- Multi-channel order ingestion from Shopee, TikTok, Facebook (channel field defaults to "website")
- Wishlist functionality
- Admin coupon management UI (API-only for now; admin UI in a later increment)
- Inventory/stock management
- Shipping cost calculation engine (flat fee or free for MVP)
- Email/SMS order notifications

## Technical Notes

### Dependencies
- Increment 0002: Google OAuth + JWT authentication
- Increment 0003: Product and Category models, product browsing

### Constraints
- All prices in VND as integers (no floating point)
- Cart: DB-backed for authenticated users, localStorage for guests, merge on login
- Payment webhooks: VNPay and Momo use IPN callbacks; COD and bank transfer are manual status updates
- Coupon model includes reseller fields (is_reseller_coupon, reseller_id, commission_type, commission_value, commission_base) but they are NOT processed in this increment
- Order model includes channel field defaulting to "website"

### Architecture Decisions
- Price calculation is server-side only (API computes totals, frontend displays)
- Coupon validation happens both client-side (instant feedback) and server-side (authoritative)
- Guest cart stored in localStorage; merged into DB cart upon login via dedicated endpoint

## Success Metrics

- Cart-to-order conversion: baseline measurement established
- Average order value tracked with tier pricing impact
- Coupon redemption rate tracked per coupon type
- Payment success rate per method (VNPay, Momo, COD, bank transfer)
