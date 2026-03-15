---
id: US-007
feature: FS-016
title: "Review Summary & Rating Distribution (P1)"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As a** customer on a product detail page."
project: shopvui
---

# US-007: Review Summary & Rating Distribution (P1)

**Feature**: [FS-016](./FEATURE.md)

**As a** customer on a product detail page
**I want** to see an average rating and star distribution breakdown
**So that** I can quickly assess overall product sentiment

---

## Acceptance Criteria

- [x] **AC-US7-01**: Given a product with approved reviews, when the product detail page loads, then the average rating (rounded to 1 decimal) and total review count are displayed
- [x] **AC-US7-02**: Given a product with approved reviews, when the summary section renders, then a horizontal bar chart shows the distribution of 1-5 star ratings with counts and percentage widths
- [x] **AC-US7-03**: Given a product with zero approved reviews, when the product detail page loads, then a "No reviews yet" message is shown instead of the summary

---

## Implementation

**Increment**: [0016-product-reviews](../../../../../increments/0016-product-reviews/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-009**: Web — ReviewSummary Component with Distribution Bar Chart
