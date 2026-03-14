---
id: US-005
feature: FS-014
title: "Translate Account and Reseller Pages"
status: completed
priority: P1
created: 2026-03-14T00:00:00.000Z
tldr: "**As a** registered user or reseller."
project: shopvui
---

# US-005: Translate Account and Reseller Pages

**Feature**: [FS-014](./FEATURE.md)

**As a** registered user or reseller
**I want** my account pages, wishlist, order history, and reseller portal translated
**So that** I can manage my account in my preferred language

---

## Acceptance Criteria

- [x] **AC-US5-01**: Given locale is vi, when the addresses page renders, then all form labels and action buttons display in Vietnamese
- [x] **AC-US5-02**: Given locale is vi, when the wishlist page renders, then the heading, empty-state message, and action buttons display in Vietnamese
- [x] **AC-US5-03**: Given locale is vi, when the order history page renders, then column headers, status labels, and pagination controls display in Vietnamese
- [x] **AC-US5-04**: Given locale is vi, when any reseller portal page (dashboard, coupons, commissions, profile) renders, then all UI labels and navigation display in Vietnamese

---

## Implementation

**Increment**: [0014-multi-language](../../../../../increments/0014-multi-language/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-011**: Extract account page strings (addresses and wishlist)
- [x] **T-012**: Extract reseller portal strings and run final audit
