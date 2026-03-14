---
id: US-005
feature: FS-006
title: "Product Management"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-005: Product Management

**Feature**: [FS-006](./FEATURE.md)

**As an** admin
**I want** to add, edit, and delete products with images, categories, and price tiers
**So that** I can maintain the product catalog from the dashboard

---

## Acceptance Criteria

- [x] **AC-US5-01**: Given the product management page, when the admin creates a product, then they can set name, description, base price, category, stock quantity, and upload images
- [x] **AC-US5-02**: Given an existing product, when the admin edits it, then all fields including images and price tiers are updatable
- [x] **AC-US5-03**: Given a product, when the admin deletes it, then it is soft-deleted and no longer visible on the storefront
- [x] **AC-US5-04**: Given the product list, when the admin views it, then products are filterable by category and searchable by name

---

## Implementation

**Increment**: [0006-admin-dashboard](../../../../../increments/0006-admin-dashboard/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-011**: Admin Products API -- CRUD and Image Upload
- [x] **T-012**: Admin Products UI -- List, Create, Edit, Delete
- [x] **T-013**: StorageAdapter for Image Upload
