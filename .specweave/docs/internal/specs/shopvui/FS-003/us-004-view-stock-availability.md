---
id: US-004
feature: FS-003
title: "View Stock Availability"
status: completed
priority: P0
created: 2026-03-10
tldr: "**As a** shopper."
project: shopvui
---

# US-004: View Stock Availability

**Feature**: [FS-003](./FEATURE.md)

**As a** shopper
**I want** to see whether a product is in stock, low stock, or out of stock
**So that** I know if I can buy it before visiting checkout

---

## Acceptance Criteria

- [x] **AC-US4-01**: StockBadge component displays "In Stock" (green) when stockQuantity > 5
- [x] **AC-US4-02**: StockBadge component displays "Low Stock" (amber) when stockQuantity is 1-5
- [x] **AC-US4-03**: StockBadge component displays "Out of Stock" (red) when stockQuantity is 0
- [x] **AC-US4-04**: StockBadge is visible on both the ProductCard and the product detail page

---

## Implementation

**Increment**: [0003-product-catalog](../../../../../increments/0003-product-catalog/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-004**: NestJS CategoriesModule — Service + Controller
- [x] **T-006**: Next.js /products Listing Page
- [x] **T-008**: E2E Tests — Product Browsing Flow
