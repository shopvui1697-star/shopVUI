---
id: US-001
feature: FS-007
title: "Customer Wishlist"
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
tldr: "**As a** logged-in customer."
project: shopvui
---

# US-001: Customer Wishlist

**Feature**: [FS-007](./FEATURE.md)

**As a** logged-in customer
**I want** to save products to a wishlist and manage them from my account
**So that** I can bookmark products I am interested in and return to purchase them later

---

## Acceptance Criteria

- [x] **AC-US1-01**: Given a logged-in customer viewing a product page, when they click "Add to Wishlist", then the product is saved to their wishlist and the button reflects the saved state
- [x] **AC-US1-02**: Given a customer with wishlist items, when they navigate to their account wishlist page, then all saved products are displayed with name, image, price, and stock status
- [x] **AC-US1-03**: Given a customer viewing their wishlist, when they click "Remove" on an item, then the product is removed from the wishlist immediately
- [x] **AC-US1-04**: Given a customer who logs out and logs back in, when they view their wishlist, then all previously saved items persist
- [x] **AC-US1-05**: Given an unauthenticated visitor, when they click "Add to Wishlist", then they are redirected to login with a return URL back to the product page

---

## Implementation

**Increment**: [0007-feature-enhancements](../../../../../increments/0007-feature-enhancements/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-001**: Add Wishlist Prisma model and run migration
- [x] **T-002**: Implement WishlistModule backend (NestJS)
- [x] **T-003**: Build Wishlist UI — Add to Wishlist button (customer web)
- [x] **T-004**: Build Wishlist page (customer account)
