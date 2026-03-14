---
id: US-003
feature: FS-003
title: "View Product Details"
status: completed
priority: P0
created: 2026-03-10
tldr: "**As a** shopper."
project: shopvui
---

# US-003: View Product Details

**Feature**: [FS-003](./FEATURE.md)

**As a** shopper
**I want** to view a product detail page with images, description, and pricing
**So that** I can evaluate a product before purchasing

---

## Acceptance Criteria

- [x] **AC-US3-01**: GET /api/products/:id returns a single product with its images and category
- [x] **AC-US3-02**: GET /api/products/:id returns 404 for non-existent product IDs
- [x] **AC-US3-03**: /products/:id page displays product name, all images, full description, and category breadcrumb
- [x] **AC-US3-04**: /products/:id page displays current price and, when compareAtPrice is set, shows it with a strikethrough to indicate a sale
- [x] **AC-US3-05**: ProductCard component on the grid links to the product detail page

---

## Implementation

**Increment**: [0003-product-catalog](../../../../../increments/0003-product-catalog/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-003**: NestJS ProductsModule — Service + Controller
- [x] **T-005**: UI Components — ProductCard, CategoryPill, SearchBar, StockBadge
- [x] **T-007**: Next.js /products/[id] Detail Page
- [x] **T-008**: E2E Tests — Product Browsing Flow
