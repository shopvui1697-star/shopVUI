---
id: US-002
feature: FS-007
title: "Admin Price Tier Management UI"
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-002: Admin Price Tier Management UI

**Feature**: [FS-007](./FEATURE.md)

**As an** admin
**I want** to create, edit, and delete quantity-based price tiers for each product from the product edit page
**So that** I can manage volume discounts without direct database access

---

## Acceptance Criteria

- [x] **AC-US2-01**: Given the admin product edit page, when the admin views the price tiers section, then existing price tiers for that product are listed showing min_qty, max_qty (or "unlimited"), and price in VND
- [x] **AC-US2-02**: Given the price tiers section, when the admin adds a new tier with min_qty, max_qty (optional), and price, then the tier is created and the list updates
- [x] **AC-US2-03**: Given an existing price tier, when the admin edits its values and saves, then the tier is updated in the database
- [x] **AC-US2-04**: Given an existing price tier, when the admin deletes it, then the tier is removed and remaining tiers are displayed
- [x] **AC-US2-05**: Given overlapping quantity ranges (e.g., 1-10 and 5-15), when the admin attempts to save, then a validation error is shown preventing the overlap

---

## Implementation

**Increment**: [0007-feature-enhancements](../../../../../increments/0007-feature-enhancements/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-005**: Add price tier CRUD endpoints to admin products module
- [x] **T-006**: Build PriceTierEditor inline component (admin)
- [x] **T-007**: [P] Price tier overlap validation edge-case tests
