---
id: US-008
feature: FS-016
title: "Admin Reviews Moderation Page (P1)"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-008: Admin Reviews Moderation Page (P1)

**Feature**: [FS-016](./FEATURE.md)

**As an** admin
**I want** a moderation page in the admin dashboard to manage reviews
**So that** I can efficiently approve, reject, or delete submitted reviews

---

## Acceptance Criteria

- [x] **AC-US8-01**: Given the admin dashboard, when navigating to /reviews, then a table of reviews is shown with columns: product name, customer, rating, comment preview, status, date, and actions
- [x] **AC-US8-02**: Given the moderation page, when filtering by status (ALL, PENDING, APPROVED, REJECTED), then the table updates to show only matching reviews
- [x] **AC-US8-03**: Given a PENDING review row, when clicking "Approve" or "Reject", then the status updates inline without page reload and a success toast is shown
- [x] **AC-US8-04**: Given any review row, when clicking "Delete", then a confirmation dialog appears; on confirm, the review is removed from the list

---

## Implementation

**Increment**: [0016-product-reviews](../../../../../increments/0016-product-reviews/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-010**: Admin — Reviews Moderation Page with Table, Filters, and Inline Actions
