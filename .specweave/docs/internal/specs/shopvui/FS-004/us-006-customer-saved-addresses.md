---
id: US-006
feature: FS-004
title: "Customer Saved Addresses"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As a** customer."
project: shopvui
---

# US-006: Customer Saved Addresses

**Feature**: [FS-004](./FEATURE.md)

**As a** customer
**I want** to save and manage my delivery addresses
**So that** I can quickly select an address during checkout without re-entering it

---

## Acceptance Criteria

- [x] **AC-US6-01**: Given I am logged in, when I navigate to my account, then I can add a new address with fields: full name, phone, street, ward, district, province, and set one as default
- [x] **AC-US6-02**: Given I have saved addresses, when I proceed to checkout, then my saved addresses are listed and I can select one or enter a new address
- [x] **AC-US6-03**: Given I have multiple addresses, when I edit or delete an address, then the changes are persisted and reflected in my address list
- [x] **AC-US6-04**: Given I delete my default address, when the deletion completes, then no address is marked as default until I explicitly set another one

---

## Implementation

**Increment**: [0004-ecommerce-flow](../../../../../increments/0004-ecommerce-flow/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-027**: AddressModule - Backend CRUD and Default Logic
- [x] **T-028**: Address Management Page - Frontend
- [x] **T-029**: AddressSelector in Checkout
- [x] **T-030**: Address API - PATCH /addresses/:id/default Endpoint
