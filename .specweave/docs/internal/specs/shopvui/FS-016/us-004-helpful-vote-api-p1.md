---
id: US-004
feature: FS-016
title: "Helpful Vote API (P1)"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As a** logged-in customer."
project: shopvui
---

# US-004: Helpful Vote API (P1)

**Feature**: [FS-016](./FEATURE.md)

**As a** logged-in customer
**I want** to toggle a "helpful" vote on a review
**So that** the most useful reviews are surfaced

---

## Acceptance Criteria

- [x] **AC-US4-01**: Given a logged-in user and an APPROVED review they did not author, when POST `/reviews/:id/vote`, then a vote is created and `helpfulCount` is incremented, returning 200
- [x] **AC-US4-02**: Given a user who already voted on a review, when POST `/reviews/:id/vote` again, then the vote is removed (toggle) and `helpfulCount` is decremented, returning 200
- [x] **AC-US4-03**: Given a user attempting to vote on their own review, when POST `/reviews/:id/vote`, then 403 is returned with message "Cannot vote on own review"

---

## Implementation

**Increment**: [0016-product-reviews](../../../../../increments/0016-product-reviews/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-005**: ReviewsService — Toggle Vote Endpoint
