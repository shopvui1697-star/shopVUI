---
id: US-001
feature: FS-003
title: "Browse Product Catalog"
status: completed
priority: P0
created: 2026-03-10
tldr: "**As a** shopper."
project: shopvui
---

# US-001: Browse Product Catalog

**Feature**: [FS-003](./FEATURE.md)

**As a** shopper
**I want** to see a grid of available products on the /products page
**So that** I can discover what the store offers

---

## Acceptance Criteria

- [x] **AC-US1-01**: Prisma schema defines Product model with fields: id, name, slug, description, price (Decimal), compareAtPrice (Decimal, nullable), sku, stockQuantity, categoryId, createdAt, updatedAt
- [x] **AC-US1-02**: Prisma schema defines Category model with fields: id, name, slug, description, createdAt, updatedAt
- [x] **AC-US1-03**: Prisma schema defines ProductImage model with fields: id, url, altText, sortOrder, productId
- [x] **AC-US1-04**: Seed script populates at least 3 categories and 12 products with images
- [x] **AC-US1-05**: GET /api/products returns paginated product list with default page size of 12, including total count and page metadata

---

## Implementation

**Increment**: [0003-product-catalog](../../../../../increments/0003-product-catalog/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-001**: Add Prisma Models (Product, Category, ProductImage) + Seed Data
- [x] **T-002**: Add Shared TypeScript Types (Product, Category, ProductImage, PaginatedResponse)
- [x] **T-005**: UI Components — ProductCard, CategoryPill, SearchBar, StockBadge
- [x] **T-006**: Next.js /products Listing Page
- [x] **T-008**: E2E Tests — Product Browsing Flow
