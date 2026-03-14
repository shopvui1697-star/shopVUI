---
id: US-005
feature: FS-004
title: "Checkout and Payment"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As a** customer."
project: shopvui
---

# US-005: Checkout and Payment

**Feature**: [FS-004](./FEATURE.md)

**As a** customer
**I want** to complete my purchase using VNPay, Momo, bank transfer, or COD
**So that** I can pay with my preferred method and receive an order confirmation

---

## Acceptance Criteria

- [x] **AC-US5-01**: Given I proceed to checkout with items in my cart, when I select a delivery address and payment method, then I see a final order summary with all line items, discounts, shipping, and total before confirming
- [x] **AC-US5-02**: Given I choose VNPay, when I confirm the order, then I am redirected to VNPay payment gateway, and upon successful IPN callback the order status is set to "confirmed" and payment_status to "paid"
- [x] **AC-US5-03**: Given I choose Momo, when I confirm the order, then I am redirected to Momo payment page, and upon successful IPN callback the order status is set to "confirmed" and payment_status to "paid"
- [x] **AC-US5-04**: Given I choose COD, when I confirm the order, then the order is created with status "pending" and payment_status "unpaid", and I see a confirmation page with my order number
- [x] **AC-US5-05**: Given I choose bank transfer, when I confirm the order, then the order is created with status "pending" and payment_status "unpaid", and I see bank account details and the order reference code

---

## Implementation

**Increment**: [0004-ecommerce-flow](../../../../../increments/0004-ecommerce-flow/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-020**: CheckoutModule - Preview and Place-Order Endpoints
- [x] **T-021**: CheckoutModule - VNPay Payment Initiation
- [x] **T-022**: CheckoutModule - Momo Payment Initiation
- [x] **T-023**: PaymentModule - VNPay IPN Webhook Handler
- [x] **T-024**: PaymentModule - Momo IPN Webhook Handler
- [x] **T-025**: Checkout Page - Frontend Full Checkout Flow
- [x] **T-026**: Order Confirmation and Bank Transfer Details Page
