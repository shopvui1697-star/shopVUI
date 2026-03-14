---
increment: 0003-product-catalog
title: "Product Catalog (Read-Only)"
status: completed
priority: P0
type: feature
created: 2026-03-10
---

# Spec: Product Catalog (Read-Only)

## Problem Statement

ShopVUI has authentication but no product data to display. Shoppers need to browse, search, and view products before making purchase decisions. This increment establishes the product catalog data layer, API endpoints, and frontend pages -- all read-only, with no admin CRUD.

## Goals

- Define Prisma models for Product, Category, and ProductImage with seed data
- Expose read-only API endpoints for product listing, detail, and categories
- Build browsable product pages with search, filtering, and category navigation
- Share typed interfaces across apps via the shared package

## User Stories

### US-001: Browse Product Catalog
**Project**: shopvui
**As a** shopper
**I want** to see a grid of available products on the /products page
**So that** I can discover what the store offers

**Acceptance Criteria:**
- [x] **AC-US1-01**: Prisma schema defines Product model with fields: id, name, slug, description, price (Decimal), compareAtPrice (Decimal, nullable), sku, stockQuantity, categoryId, createdAt, updatedAt
- [x] **AC-US1-02**: Prisma schema defines Category model with fields: id, name, slug, description, createdAt, updatedAt
- [x] **AC-US1-03**: Prisma schema defines ProductImage model with fields: id, url, altText, sortOrder, productId
- [x] **AC-US1-04**: Seed script populates at least 3 categories and 12 products with images
- [x] **AC-US1-05**: GET /api/products returns paginated product list with default page size of 12, including total count and page metadata

### US-002: Search and Filter Products
**Project**: shopvui
**As a** shopper
**I want** to search products by name and filter by category
**So that** I can quickly find what I am looking for

**Acceptance Criteria:**
- [x] **AC-US2-01**: GET /api/products accepts query parameter `search` that matches against product name and description (case-insensitive)
- [x] **AC-US2-02**: GET /api/products accepts query parameter `categoryId` to filter by category
- [x] **AC-US2-03**: GET /api/categories returns all categories with product counts
- [x] **AC-US2-04**: /products page renders a SearchBar component that triggers search on input with debounce
- [x] **AC-US2-05**: /products page renders CategoryPill components for each category; clicking one filters the product grid

### US-003: View Product Details
**Project**: shopvui
**As a** shopper
**I want** to view a product detail page with images, description, and pricing
**So that** I can evaluate a product before purchasing

**Acceptance Criteria:**
- [x] **AC-US3-01**: GET /api/products/:id returns a single product with its images and category
- [x] **AC-US3-02**: GET /api/products/:id returns 404 for non-existent product IDs
- [x] **AC-US3-03**: /products/:id page displays product name, all images, full description, and category breadcrumb
- [x] **AC-US3-04**: /products/:id page displays current price and, when compareAtPrice is set, shows it with a strikethrough to indicate a sale
- [x] **AC-US3-05**: ProductCard component on the grid links to the product detail page

### US-004: View Stock Availability
**Project**: shopvui
**As a** shopper
**I want** to see whether a product is in stock, low stock, or out of stock
**So that** I know if I can buy it before visiting checkout

**Acceptance Criteria:**
- [x] **AC-US4-01**: StockBadge component displays "In Stock" (green) when stockQuantity > 5
- [x] **AC-US4-02**: StockBadge component displays "Low Stock" (amber) when stockQuantity is 1-5
- [x] **AC-US4-03**: StockBadge component displays "Out of Stock" (red) when stockQuantity is 0
- [x] **AC-US4-04**: StockBadge is visible on both the ProductCard and the product detail page

## Out of Scope

- Admin CRUD for products, categories, or images
- Shopping cart or checkout flow
- Product reviews or ratings
- Product variants (size, color)
- Inventory management or stock updates
- Image upload -- seed data uses static URLs

## Technical Notes

### Dependencies
- Prisma schema extension in `packages/db`
- Shared type interfaces in `packages/shared`
- UI components in `packages/ui` (ProductCard, CategoryPill, SearchBar, StockBadge)
- NestJS modules in `apps/api`
- Next.js pages in `apps/web`

### Constraints
- All endpoints are public (no auth required for browsing)
- Pagination defaults: page=1, limit=12
- Search must be case-insensitive

### Shared Types
- `Product`, `Category`, `ProductImage` interfaces defined in `packages/shared`
- API response types: `PaginatedResponse<T>` with items, total, page, limit, totalPages

## Success Metrics

- Seed script runs without errors and populates catalog data
- All 3 API endpoints return correct responses
- Product grid loads in under 2 seconds with 12 items
- Search results update within 300ms of user stopping input
