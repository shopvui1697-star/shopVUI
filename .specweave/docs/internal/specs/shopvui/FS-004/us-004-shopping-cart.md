---
id: US-004
feature: FS-004
title: "Shopping Cart"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As a** customer."
project: shopvui
---

# US-004: Shopping Cart

**Feature**: [FS-004](./FEATURE.md)

**As a** customer
**I want** to add products to a cart, adjust quantities, and see real-time price updates
**So that** I can review my selections before proceeding to checkout

---

## Acceptance Criteria

- [x] **AC-US4-01**: Given I am on a product page, when I select quantity and click "Add to Cart", then the item is added with the correct tier-based unit price and the cart icon updates with the item count
- [x] **AC-US4-02**: Given I have items in my cart, when I change the quantity of an item, then the unit price recalculates based on the new quantity tier and the subtotal updates accordingly
- [x] **AC-US4-03**: Given I am a guest user, when I add items to the cart, then items are persisted in localStorage and survive page refreshes
- [x] **AC-US4-04**: Given I am a guest with items in localStorage cart and I log in, when login completes, then guest cart items are merged into my DB-backed cart (quantities summed for duplicate products)
- [x] **AC-US4-05**: Given I have items in my cart, when I apply a valid coupon code, then the discount is calculated instantly and the order summary shows subtotal, quantity discount, coupon discount, shipping, and final total

---

## Implementation

**Increment**: [0004-ecommerce-flow](../../../../../increments/0004-ecommerce-flow/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-014**: CartModule - Backend CRUD Endpoints
- [x] **T-015**: Cart Merge Endpoint - Guest Cart Login Merge
- [x] **T-016**: CartContext - React Context for Cart State Management
- [x] **T-017**: Cart Page - UI with Quantity Editing and Coupon Input
- [x] **T-018**: AddToCartButton Component - Product Page Integration
- [x] **T-019**: Guest Cart localStorage Persistence
