---
id: US-002
feature: FS-003
title: "Search and Filter Products"
status: completed
priority: P0
created: 2026-03-10
tldr: "**As a** shopper."
project: shopvui
---

# US-002: Search and Filter Products

**Feature**: [FS-003](./FEATURE.md)

**As a** shopper
**I want** to search products by name and filter by category
**So that** I can quickly find what I am looking for

---

## Acceptance Criteria

- [x] **AC-US2-01**: GET /api/products accepts query parameter `search` that matches against product name and description (case-insensitive)
- [x] **AC-US2-02**: GET /api/products accepts query parameter `categoryId` to filter by category
- [x] **AC-US2-03**: GET /api/categories returns all categories with product counts
- [x] **AC-US2-04**: /products page renders a SearchBar component that triggers search on input with debounce
- [x] **AC-US2-05**: /products page renders CategoryPill components for each category; clicking one filters the product grid

---

## Implementation

**Increment**: [0003-product-catalog](../../../../../increments/0003-product-catalog/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-003**: NestJS ProductsModule — Service + Controller
- [x] **T-006**: Next.js /products Listing Page
- [x] **T-008**: E2E Tests — Product Browsing Flow
