---
id: US-006
feature: FS-016
title: "Product Review Form & List (P1)"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As a** customer on a product detail page."
project: shopvui
---

# US-006: Product Review Form & List (P1)

**Feature**: [FS-016](./FEATURE.md)

**As a** customer on a product detail page
**I want** to see existing reviews and submit my own review with a star rating
**So that** I can make informed purchase decisions and share my experience

---

## Acceptance Criteria

- [x] **AC-US6-01**: Given a product detail page, when rendered, then a list of APPROVED reviews is displayed with star rating, comment, author name, date, and helpful count, paginated
- [x] **AC-US6-02**: Given a logged-in customer who has purchased and received the product and has not yet reviewed it, when on the product page, then a review form with star-rating selector (1-5) and comment textarea is shown
- [x] **AC-US6-03**: Given the review form, when submitted with valid data, then a success message is shown and the form is replaced with a "review pending moderation" notice
- [x] **AC-US6-04**: Given a review in the list, when a logged-in user clicks "Helpful", then the vote toggles and the helpful count updates optimistically
- [x] **AC-US6-05**: Given the review form, when submitted with comment < 10 chars or > 1000 chars, then client-side validation prevents submission with an error message

---

## Implementation

**Increment**: [0016-product-reviews](../../../../../increments/0016-product-reviews/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-007**: Web — Review Components (StarRating, ReviewCard, ReviewList, ReviewForm, ReviewSection) + Hooks
- [x] **T-008**: Web — HelpfulButton with Optimistic Vote Toggle
