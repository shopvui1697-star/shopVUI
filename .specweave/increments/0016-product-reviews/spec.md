---
increment: 0016-product-reviews
title: Product Reviews & Ratings
type: feature
priority: P1
status: completed
created: 2026-03-15T00:00:00.000Z
structure: user-stories
test_mode: TDD
coverage_target: 80
---

# Feature: Product Reviews & Ratings

## Problem Statement

ShopVui currently lacks a product reviews system. Customers cannot share feedback on purchased products, which limits social proof, reduces buyer confidence, and prevents the business from gathering valuable product quality signals. Without reviews, product pages lack user-generated content that drives engagement and conversion.

## Goals

- Enable verified purchasers to leave star ratings and written reviews
- Provide helpful-vote functionality so the best reviews surface
- Give admins moderation control to maintain content quality
- Display aggregate ratings on product pages to boost conversion

## User Stories

### US-001: Review & Vote Database Models (P0)
**Project**: shopvui
**As a** developer
**I want** Prisma models for ProductReview, ReviewVote, and ReviewStatus enum with Product aggregate fields
**So that** the review system has a proper data foundation

**Acceptance Criteria**:
- [x] **AC-US1-01**: Given the Prisma schema, when migrated, then a `ProductReview` model exists with fields: `id`, `userId`, `productId`, `rating` (Int, 1-5), `comment` (String, min 10 / max 1000), `status` (ReviewStatus enum: PENDING, APPROVED, REJECTED), `createdAt`, `updatedAt`
- [x] **AC-US1-02**: Given the Prisma schema, when migrated, then a `ReviewVote` model exists with fields: `id`, `reviewId`, `userId`, `createdAt` representing a "helpful" vote
- [x] **AC-US1-03**: Given the Prisma schema, when migrated, then a unique constraint exists on `(userId, productId)` in ProductReview preventing duplicate reviews
- [x] **AC-US1-04**: Given the Prisma schema, when migrated, then a unique constraint exists on `(userId, reviewId)` in ReviewVote preventing duplicate votes
- [x] **AC-US1-05**: Given the Product model, when migrated, then `avgRating` (Float, nullable) and `reviewCount` (Int, default 0) fields exist as denormalized aggregates

---

### US-002: Shared TypeScript Types for Reviews (P0)
**Project**: shopvui
**As a** developer
**I want** shared TypeScript types and enums for the review system in `packages/shared`
**So that** API and frontend apps have consistent type contracts

**Acceptance Criteria**:
- [x] **AC-US2-01**: Given `packages/shared/src/review.ts`, when imported, then `ReviewStatus` enum, `CreateReviewDto`, `UpdateReviewDto`, `ReviewResponse`, `ReviewVoteResponse` types are available
- [x] **AC-US2-02**: Given `packages/shared/src/review.ts`, when imported, then `ReviewListQuery` type is available with optional fields: `productId`, `status`, `page`, `pageSize`, `sortBy` (rating, createdAt, helpfulCount)
- [x] **AC-US2-03**: Given `packages/shared/src/index.ts`, when the shared package is built, then all review types are re-exported

---

### US-003: Customer Review API (P0)
**Project**: shopvui
**As a** customer with a delivered order
**I want** API endpoints to create, read, update, and delete my product review
**So that** I can share my feedback on purchased products

**Acceptance Criteria**:
- [x] **AC-US3-01**: Given a customer with a DELIVERED order containing productId, when POST `/reviews` with `{ productId, rating, comment }`, then a review is created with status PENDING and 201 is returned
- [x] **AC-US3-02**: Given a customer without a DELIVERED order for productId, when POST `/reviews`, then 403 is returned with message "Purchase verification failed"
- [x] **AC-US3-03**: Given a customer who already reviewed productId, when POST `/reviews` for the same product, then 409 is returned with message "Review already exists"
- [x] **AC-US3-04**: Given a productId, when GET `/reviews?productId={id}`, then only APPROVED reviews are returned with pagination (page, pageSize), each including `helpfulCount` and `userHasVoted` (if authenticated)
- [x] **AC-US3-05**: Given a customer who owns a review, when PATCH `/reviews/:id` with updated rating/comment, then the review is updated, status resets to PENDING, and 200 is returned

---

### US-004: Helpful Vote API (P1)
**Project**: shopvui
**As a** logged-in customer
**I want** to toggle a "helpful" vote on a review
**So that** the most useful reviews are surfaced

**Acceptance Criteria**:
- [x] **AC-US4-01**: Given a logged-in user and an APPROVED review they did not author, when POST `/reviews/:id/vote`, then a vote is created and `helpfulCount` is incremented, returning 200
- [x] **AC-US4-02**: Given a user who already voted on a review, when POST `/reviews/:id/vote` again, then the vote is removed (toggle) and `helpfulCount` is decremented, returning 200
- [x] **AC-US4-03**: Given a user attempting to vote on their own review, when POST `/reviews/:id/vote`, then 403 is returned with message "Cannot vote on own review"

---

### US-005: Admin Review Moderation API (P0)
**Project**: shopvui
**As an** admin
**I want** API endpoints to list, approve, reject, and delete reviews
**So that** I can moderate content quality on the platform

**Acceptance Criteria**:
- [x] **AC-US5-01**: Given an admin, when GET `/admin/reviews` with optional filters (status, productId, userId, page, pageSize), then all reviews matching filters are returned with pagination
- [x] **AC-US5-02**: Given an admin and a PENDING review, when PATCH `/admin/reviews/:id/approve`, then the review status becomes APPROVED and Product aggregate fields (avgRating, reviewCount) are recalculated
- [x] **AC-US5-03**: Given an admin and a PENDING review, when PATCH `/admin/reviews/:id/reject`, then the review status becomes REJECTED and Product aggregates remain unchanged (or recalculated if was previously APPROVED)
- [x] **AC-US5-04**: Given an admin, when DELETE `/admin/reviews/:id`, then the review and its votes are deleted and Product aggregates are recalculated
- [x] **AC-US5-05**: Given a non-admin user, when accessing any `/admin/reviews` endpoint, then 403 is returned

---

### US-006: Product Review Form & List (P1)
**Project**: shopvui
**As a** customer on a product detail page
**I want** to see existing reviews and submit my own review with a star rating
**So that** I can make informed purchase decisions and share my experience

**Acceptance Criteria**:
- [x] **AC-US6-01**: Given a product detail page, when rendered, then a list of APPROVED reviews is displayed with star rating, comment, author name, date, and helpful count, paginated
- [x] **AC-US6-02**: Given a logged-in customer who has purchased and received the product and has not yet reviewed it, when on the product page, then a review form with star-rating selector (1-5) and comment textarea is shown
- [x] **AC-US6-03**: Given the review form, when submitted with valid data, then a success message is shown and the form is replaced with a "review pending moderation" notice
- [x] **AC-US6-04**: Given a review in the list, when a logged-in user clicks "Helpful", then the vote toggles and the helpful count updates optimistically
- [x] **AC-US6-05**: Given the review form, when submitted with comment < 10 chars or > 1000 chars, then client-side validation prevents submission with an error message

---

### US-007: Review Summary & Rating Distribution (P1)
**Project**: shopvui
**As a** customer on a product detail page
**I want** to see an average rating and star distribution breakdown
**So that** I can quickly assess overall product sentiment

**Acceptance Criteria**:
- [x] **AC-US7-01**: Given a product with approved reviews, when the product detail page loads, then the average rating (rounded to 1 decimal) and total review count are displayed
- [x] **AC-US7-02**: Given a product with approved reviews, when the summary section renders, then a horizontal bar chart shows the distribution of 1-5 star ratings with counts and percentage widths
- [x] **AC-US7-03**: Given a product with zero approved reviews, when the product detail page loads, then a "No reviews yet" message is shown instead of the summary

---

### US-008: Admin Reviews Moderation Page (P1)
**Project**: shopvui
**As an** admin
**I want** a moderation page in the admin dashboard to manage reviews
**So that** I can efficiently approve, reject, or delete submitted reviews

**Acceptance Criteria**:
- [x] **AC-US8-01**: Given the admin dashboard, when navigating to /reviews, then a table of reviews is shown with columns: product name, customer, rating, comment preview, status, date, and actions
- [x] **AC-US8-02**: Given the moderation page, when filtering by status (ALL, PENDING, APPROVED, REJECTED), then the table updates to show only matching reviews
- [x] **AC-US8-03**: Given a PENDING review row, when clicking "Approve" or "Reject", then the status updates inline without page reload and a success toast is shown
- [x] **AC-US8-04**: Given any review row, when clicking "Delete", then a confirmation dialog appears; on confirm, the review is removed from the list

## Out of Scope

- Photo/media attachments on reviews (future increment)
- Review replies from sellers or admins
- AI-powered review spam detection
- Review analytics dashboard
- Review import/export
- Email notifications to customers when their review is approved/rejected
- Sorting product listings by average rating

## Technical Notes

### Dependencies
- Existing models: User, Product, Order, OrderItem (packages/db)
- Auth: JwtAuthGuard, AdminGuard (apps/api)
- Shared types package: packages/shared

### Constraints
- Product aggregate recalculation must be atomic (transaction) to prevent stale data
- Review comment must be sanitized to prevent XSS
- Pagination follows existing pattern: `(page - 1) * pageSize`

### Architecture Decisions
- Denormalized avgRating/reviewCount on Product avoids expensive aggregation queries on every product page load
- ReviewStatus defaults to PENDING to enforce moderation-first approach
- Helpful votes use a toggle pattern (create/delete) rather than increment/decrement to prevent race conditions

## Success Metrics

- Review submission rate: > 5% of delivered orders result in a review
- Moderation turnaround: 95% of reviews moderated within 24 hours
- Helpful vote engagement: > 10% of review viewers vote on at least one review
