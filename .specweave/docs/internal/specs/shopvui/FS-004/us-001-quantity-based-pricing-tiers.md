---
id: US-001
feature: FS-004
title: "Quantity-Based Pricing Tiers"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As a** customer."
project: shopvui
---

# US-001: Quantity-Based Pricing Tiers

**Feature**: [FS-004](./FEATURE.md)

**As a** customer
**I want** to see prices that decrease when I buy larger quantities
**So that** I am incentivized to purchase more units at a better rate

---

## Acceptance Criteria

- [x] **AC-US1-01**: Given a product with price tiers (1-5: 1,500,000 / 6-10: 1,300,000 / 11+: 1,100,000), when I view the product detail page, then all tier breakpoints and their unit prices are displayed
- [x] **AC-US1-02**: Given I select quantity 7 for a product with the tiers above, when the price is calculated, then the unit price is 1,300,000 VND and subtotal is 9,100,000 VND
- [x] **AC-US1-03**: Given a product has no price tiers defined, when I view the product, then the base price is used as the unit price for any quantity
- [x] **AC-US1-04**: Given the PriceTier model, then it stores product_id, min_qty, max_qty (nullable for open-ended), and price as integer (VND)
- [x] **AC-US1-05**: Given an admin creates overlapping tier ranges for a product, when saving, then a validation error is returned preventing the overlap

---

## Implementation

**Increment**: [0004-ecommerce-flow](../../../../../increments/0004-ecommerce-flow/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-001**: PriceEngineService - Tier Lookup and Unit Price Calculation
- [x] **T-002**: PriceTierModule - CRUD API with Overlap Validation
- [x] **T-003**: Product Detail Page - Price Tier Display
