---
increment: 0016-product-reviews
title: "Product Reviews & Ratings"
generated: 2026-03-15
test_mode: TDD
coverage_target: 80
by_user_story:
  US-001: [T-001]
  US-002: [T-002]
  US-003: [T-003, T-004]
  US-004: [T-005]
  US-005: [T-006]
  US-006: [T-007, T-008]
  US-007: [T-009]
  US-008: [T-010]
total_tasks: 10
completed_tasks: 10
---

# Tasks: Product Reviews & Ratings (0016)

---

## User Story: US-001 - Review & Vote Database Models

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US1-04, AC-US1-05
**Tasks**: 1 total, 1 completed

### T-001: Prisma Schema — ProductReview, ReviewVote, ReviewStatus, Product Aggregates

**User Story**: US-001
**Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US1-04, AC-US1-05
**Domain**: database
**Status**: [x] completed

**Test Plan**:
- **Given** the Prisma schema file is updated with ReviewStatus enum, ProductReview, and ReviewVote models
- **When** `prisma migrate dev` is run
- **Then** the database contains `product_reviews` and `review_votes` tables with all required columns, unique constraints, and the `product` table has `avg_rating` and `review_count` columns

**Test Cases**:
1. **Integration**: `packages/db/tests/schema.test.ts`
   - testProductReviewModelExists(): Verify CRUD operations on ProductReview with all required fields
   - testReviewVoteModelExists(): Verify CRUD operations on ReviewVote
   - testUniqueConstraintUserProduct(): Second insert for same (userId, productId) throws P2002
   - testUniqueConstraintUserReview(): Second insert for same (userId, reviewId) throws P2002
   - testProductAggregateFields(): avgRating and reviewCount fields are writable on Product
   - **Coverage Target**: 90%

**Implementation**:
1. Open `packages/db/prisma/schema.prisma`
2. Add `ReviewStatus` enum after existing enums: `PENDING`, `APPROVED`, `REJECTED`
3. Add `ProductReview` model with fields: id, userId, productId, rating (Int), comment (String), status (ReviewStatus @default(PENDING)), helpfulCount (Int @default(0)), votes (ReviewVote[]), createdAt, updatedAt. Add `@@unique([userId, productId])`, `@@index([productId, status])`, `@@index([userId])`, `@@map("product_reviews")`
4. Add `ReviewVote` model with fields: id, reviewId, userId, createdAt. Add `@@unique([userId, reviewId])`, `@@map("review_votes")`
5. Add `avgRating Float? @map("avg_rating")`, `reviewCount Int @default(0) @map("review_count")`, and `reviews ProductReview[]` to the existing `Product` model
6. Add `reviews ProductReview[]` relation to the existing `User` model
7. Run `pnpm --filter @shopvui/db prisma migrate dev --name add-product-reviews`
8. Run `pnpm --filter @shopvui/db prisma generate`

---

## User Story: US-002 - Shared TypeScript Types for Reviews

**Linked ACs**: AC-US2-01, AC-US2-02, AC-US2-03
**Tasks**: 1 total, 1 completed

### T-002: Shared Types — review.ts + re-export from index.ts

**User Story**: US-002
**Satisfies ACs**: AC-US2-01, AC-US2-02, AC-US2-03
**Domain**: shared
**Status**: [x] completed

**Test Plan**:
- **Given** `packages/shared/src/review.ts` is created with all required types
- **When** the shared package is built (`pnpm build`)
- **Then** all types (ReviewStatus, CreateReviewDto, UpdateReviewDto, ReviewListQuery, ReviewResponse, ReviewVoteResponse, ReviewSummary, AdminReviewListItem) are importable from `@shopvui/shared`

**Test Cases**:
1. **Unit**: `packages/shared/src/review.test.ts`
   - testReviewStatusValues(): 'PENDING' | 'APPROVED' | 'REJECTED' are valid ReviewStatus values
   - testCreateReviewDtoShape(): Required fields productId, rating, comment are present in type
   - testReviewListQueryOptionalFields(): All fields in ReviewListQuery are optional
   - testReviewSummaryDistribution(): distribution type covers keys 1-5
   - **Coverage Target**: 85%

**Implementation**:
1. Create `packages/shared/src/review.ts` with: `ReviewStatus` type union, `CreateReviewDto`, `UpdateReviewDto`, `ReviewListQuery` (with sortBy: 'rating' | 'createdAt' | 'helpfulCount'), `ReviewResponse`, `ReviewVoteResponse`, `ReviewSummary` (with distribution: Record<1|2|3|4|5, number>), `AdminReviewListItem` interfaces
2. Add re-export to `packages/shared/src/index.ts`: `export type { ReviewStatus, CreateReviewDto, UpdateReviewDto, ReviewListQuery, ReviewResponse, ReviewVoteResponse, ReviewSummary, AdminReviewListItem } from './review.js';`
3. Run `pnpm --filter @shopvui/shared build` and confirm zero TypeScript errors

---

## User Story: US-003 - Customer Review API

**Linked ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04, AC-US3-05
**Tasks**: 2 total, 0 completed

### T-003: ReviewsModule — Create, List, Update, Delete Endpoints + Purchase Verification

**User Story**: US-003
**Satisfies ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-05
**Domain**: backend
**Status**: [x] completed

**Test Plan**:
- **Given** a NestJS ReviewsModule with ReviewsController and ReviewsService registered in AppModule
- **When** customer API endpoints are called
- **Then** create returns 201 for verified purchasers, 403 for unverified, 409 for duplicates; list returns only APPROVED reviews with pagination and userHasVoted; update resets status to PENDING

**Test Cases**:
1. **Unit**: `apps/api/src/reviews/reviews.service.spec.ts`
   - testCreateReview_success(): verifyPurchase returns true, prisma.productReview.create called with status PENDING → returns created review
   - testCreateReview_noPurchase(): verifyPurchase returns false → throws ForbiddenException "Purchase verification failed"
   - testCreateReview_duplicate(): Prisma throws P2002 unique constraint → throws ConflictException "Review already exists"
   - testListReviews_onlyApproved(): findAll queries status=APPROVED, returns helpfulCount per review
   - testListReviews_userHasVoted_true(): Authenticated user with existing vote → userHasVoted=true in response
   - testListReviews_unauthenticated(): No userId provided → userHasVoted=false for all reviews
   - testUpdateReview_resetsStatus(): update sets status back to PENDING
   - testUpdateReview_notOwner(): review.userId !== caller userId → throws ForbiddenException
   - **Coverage Target**: 90%

2. **Integration**: `apps/api/src/reviews/reviews.controller.spec.ts`
   - testPOST_reviews_201(): Full request with mocked service returns 201
   - testPOST_reviews_403_noPurchase(): Service throws ForbiddenException → HTTP 403
   - testGET_reviews_pagination(): ?page=2&pageSize=5 parameters forwarded correctly
   - testPATCH_reviews_200(): Authenticated owner update returns 200
   - **Coverage Target**: 85%

**Implementation**:
1. Create `apps/api/src/reviews/dto/create-review.dto.ts`: `@IsString() productId`, `@IsInt() @Min(1) @Max(5) rating`, `@IsString() @MinLength(10) @MaxLength(1000) comment`
2. Create `apps/api/src/reviews/dto/update-review.dto.ts`: partial — optional rating and comment with same validators
3. Create `apps/api/src/reviews/dto/review-list-query.dto.ts`: `@IsOptional()` fields: productId, page (default 1), pageSize (default 10), sortBy
4. Create `apps/api/src/reviews/reviews.service.ts`:
   - `create(userId, dto)`: call `verifyPurchase`, sanitize comment (strip HTML tags), prisma.productReview.create with status PENDING
   - `findAll(query, userId?)`: query APPROVED reviews for productId, annotate each with userHasVoted by checking ReviewVote
   - `update(id, userId, dto)`: verify ownership, sanitize comment, update with status reset to PENDING
   - `remove(id, userId)`: verify ownership, delete review
   - `private verifyPurchase(userId, productId)`: findFirst on OrderItem joined to Order WHERE status=DELIVERED
5. Create `apps/api/src/reviews/reviews.controller.ts`: POST /reviews (JwtAuthGuard), GET /reviews (optional JWT), PATCH /reviews/:id (JwtAuthGuard), DELETE /reviews/:id (JwtAuthGuard)
6. Create `apps/api/src/reviews/reviews.module.ts`
7. Register `ReviewsModule` in `apps/api/src/app.module.ts`

### T-004: ReviewsService — Summary Endpoint

**User Story**: US-003
**Satisfies ACs**: AC-US3-04
**Domain**: backend
**Status**: [x] completed

**Test Plan**:
- **Given** a productId with a mix of APPROVED reviews at different star ratings
- **When** GET `/reviews/summary/:productId` is called
- **Then** avgRating (1 decimal), reviewCount, and distribution object with counts for each of stars 1-5 are returned; when no reviews exist avgRating is null and all distribution counts are 0

**Test Cases**:
1. **Unit**: `apps/api/src/reviews/reviews.service.spec.ts` (extend existing file)
   - testGetSummary_withReviews(): 3 reviews at ratings 4,5,5 → avgRating=4.7, reviewCount=3, distribution={4:1,5:2,1:0,2:0,3:0}
   - testGetSummary_noReviews(): 0 approved reviews → avgRating=null, reviewCount=0, all distribution counts=0
   - **Coverage Target**: 90%

**Implementation**:
1. Add `getSummary(productId)` to `reviews.service.ts`:
   - Use `prisma.productReview.groupBy` with `by: ['rating']`, `where: { productId, status: 'APPROVED' }`, `_count: true`
   - Build distribution for keys 1-5 from grouped result
   - Compute avgRating as weighted average from grouped result (or null if empty)
2. Add `GET /reviews/summary/:productId` route to `reviews.controller.ts` (public, no auth guard)

---

## User Story: US-004 - Helpful Vote API

**Linked ACs**: AC-US4-01, AC-US4-02, AC-US4-03
**Tasks**: 1 total, 0 completed

### T-005: ReviewsService — Toggle Vote Endpoint

**User Story**: US-004
**Satisfies ACs**: AC-US4-01, AC-US4-02, AC-US4-03
**Domain**: backend
**Status**: [x] completed

**Test Plan**:
- **Given** an authenticated user and an APPROVED review they did not author
- **When** POST `/reviews/:id/vote` is called
- **Then** a vote is created (or removed if already exists), helpfulCount is updated atomically in a transaction, and `{ voted, helpfulCount }` is returned

**Test Cases**:
1. **Unit**: `apps/api/src/reviews/reviews.service.spec.ts` (extend existing file)
   - testToggleVote_createVote(): No existing ReviewVote → transaction creates vote + increments helpfulCount → returns {voted:true, helpfulCount:N+1}
   - testToggleVote_removeVote(): Existing ReviewVote found → transaction deletes vote + decrements helpfulCount → returns {voted:false, helpfulCount:N-1}
   - testToggleVote_selfVote(): review.userId === caller userId → throws ForbiddenException "Cannot vote on own review"
   - testToggleVote_reviewNotApproved(): review.status !== APPROVED → throws NotFoundException or ForbiddenException
   - **Coverage Target**: 90%

2. **Integration**: `apps/api/src/reviews/reviews.controller.spec.ts` (extend existing file)
   - testPOST_vote_creates(): First call returns {voted:true}
   - testPOST_vote_removes(): Second consecutive call returns {voted:false}
   - testPOST_vote_selfVote_403(): Self-vote returns HTTP 403
   - **Coverage Target**: 85%

**Implementation**:
1. Add `toggleVote(reviewId, userId)` to `reviews.service.ts`:
   - Load review by id; throw NotFoundException if not found
   - If review.status !== APPROVED throw ForbiddenException
   - If review.userId === userId throw ForbiddenException "Cannot vote on own review"
   - `prisma.$transaction`: findFirst ReviewVote for (userId, reviewId); if exists delete + decrement helpfulCount; else create + increment helpfulCount
   - Return `ReviewVoteResponse { voted, helpfulCount }`
2. Add `POST /reviews/:id/vote` route to `reviews.controller.ts` with `JwtAuthGuard`

---

## User Story: US-005 - Admin Review Moderation API

**Linked ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04, AC-US5-05
**Tasks**: 1 total, 0 completed

### T-006: AdminReviewsModule — List, Approve, Reject, Delete + Aggregate Recalculation

**User Story**: US-005
**Satisfies ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04, AC-US5-05
**Domain**: backend
**Status**: [x] completed

**Test Plan**:
- **Given** an AdminReviewsModule registered under AdminModule with AdminGuard applied to all routes
- **When** admin endpoints are called by an admin user
- **Then** list returns filtered paginated reviews with product and user names; approve/reject update status and recalculate Product aggregates in a transaction; delete removes review and votes and recalculates aggregates; non-admin callers receive 403

**Test Cases**:
1. **Unit**: `apps/api/src/admin/reviews/admin-reviews.service.spec.ts`
   - testFindAll_filterByStatus(): status=PENDING filter → only PENDING reviews returned with product and user names
   - testFindAll_pagination(): page=2, pageSize=5 → correct offset applied
   - testApprove_updatesStatus(): review.status set to APPROVED inside transaction
   - testApprove_recalcAggregates(): After approve, Product avgRating and reviewCount are recalculated from APPROVED reviews
   - testReject_pendingReview_noAggregateChange(): Rejecting a PENDING review does not change Product aggregates
   - testReject_approvedReview_recalcAggregates(): Rejecting a previously APPROVED review recalculates aggregates (removes its rating)
   - testDelete_cascadesVotes(): ReviewVote records deleted along with review; aggregates recalculated
   - **Coverage Target**: 90%

2. **Integration**: `apps/api/src/admin/reviews/admin-reviews.controller.spec.ts`
   - testGET_adminReviews_requiresAdmin(): Non-admin JWT → HTTP 403
   - testPATCH_approve_200(): Admin approves PENDING review → 200 with updated review data
   - testPATCH_reject_200(): Admin rejects PENDING review → 200
   - testDELETE_review_200(): Admin deletes review → 200
   - **Coverage Target**: 85%

**Implementation**:
1. Create `apps/api/src/admin/reviews/dto/admin-review-list-query.dto.ts`: optional status (ReviewStatus), productId, userId, page, pageSize
2. Create `apps/api/src/admin/reviews/admin-reviews.service.ts`:
   - `findAll(query)`: paginated query with optional filters, include product.name and user.name
   - `approve(id)`: `prisma.$transaction` — update status=APPROVED, call `recalcProductAggregates(productId, tx)`
   - `reject(id)`: `prisma.$transaction` — update status=REJECTED, call `recalcProductAggregates(productId, tx)` if was APPROVED
   - `remove(id)`: `prisma.$transaction` — delete ReviewVotes, delete ProductReview, call `recalcProductAggregates(productId, tx)`
   - `private recalcProductAggregates(productId, tx)`: COUNT + AVG on APPROVED reviews for productId, UPDATE Product
3. Create `apps/api/src/admin/reviews/admin-reviews.controller.ts`: all routes with `AdminGuard`: `GET /admin/reviews`, `PATCH /admin/reviews/:id/approve`, `PATCH /admin/reviews/:id/reject`, `DELETE /admin/reviews/:id`
4. Create `apps/api/src/admin/reviews/admin-reviews.module.ts`
5. Register `AdminReviewsModule` in `apps/api/src/admin/admin.module.ts`

---

## User Story: US-006 - Product Review Form & List

**Linked ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-04, AC-US6-05
**Tasks**: 2 total, 2 completed

### T-007: Web — Review Components (StarRating, ReviewCard, ReviewList, ReviewForm, ReviewSection) + Hooks

**User Story**: US-006
**Satisfies ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-05
**Domain**: web-frontend
**Status**: [x] completed

**Test Plan**:
- **Given** a product detail page with `<ReviewSection productId="X" />`
- **When** the component renders with mocked React Query responses
- **Then** approved reviews are listed with star rating, comment, author, date, and helpfulCount; a review form is shown for eligible logged-in users; client-side validation blocks submission when comment is under 10 or over 1000 chars; on successful submit the form is replaced with a "pending moderation" notice

**Test Cases**:
1. **Unit**: `apps/web/src/components/reviews/__tests__/ReviewForm.test.tsx`
   - testValidation_commentTooShort(): Submit with 9-char comment → error message shown, mutation not called
   - testValidation_commentTooLong(): Submit with 1001-char comment → error message shown
   - testStarRatingSelection(): Clicking star 4 sets rating value to 4
   - testSubmitSuccess(): Valid form → mutation called → form replaced with "Review pending moderation" notice
   - **Coverage Target**: 85%

2. **Unit**: `apps/web/src/components/reviews/__tests__/ReviewList.test.tsx`
   - testRenderReviews(): Given ReviewResponse array, renders each with rating, comment, author name, date
   - testEmptyState(): Empty array → "No reviews yet" message displayed
   - testPagination(): totalPages > 1 → pagination controls rendered
   - **Coverage Target**: 80%

3. **Unit**: `apps/web/src/hooks/__tests__/useReviews.test.ts`
   - testUseReviews_fetchesCorrectEndpoint(): Calls GET /reviews?productId=X&page=1
   - testUseCreateReview_callsMutation(): POST /reviews called with productId, rating, comment
   - **Coverage Target**: 80%

**Implementation**:
1. Create `apps/web/src/lib/api/reviews.ts` with functions: `getReviews(productId, page, pageSize)`, `createReview(dto)`, `updateReview(id, dto)`, `deleteReview(id)`, `getReviewSummary(productId)`
2. Create `apps/web/src/hooks/useReviews.ts` exporting `useReviews(productId, page)`, `useReviewSummary(productId)`, `useCreateReview()` using React Query
3. Create `apps/web/src/components/reviews/StarRating.tsx`: accepts `value`, `onChange?`, `readonly?` props; renders 5 star icons
4. Create `apps/web/src/components/reviews/ReviewCard.tsx`: renders single ReviewResponse — stars (read-only), comment, author name (userId fallback), formatted date, helpfulCount
5. Create `apps/web/src/components/reviews/ReviewList.tsx`: renders paginated list of ReviewCards, empty state message, page controls
6. Create `apps/web/src/components/reviews/ReviewForm.tsx`: star selector (required) + comment textarea; validates min 10 / max 1000 chars; on success shows "Review pending moderation" notice replacing the form
7. Create `apps/web/src/components/reviews/ReviewSection.tsx`: container that fetches via hooks, renders ReviewSummary + ReviewList + ReviewForm (if user eligible)
8. Add `<ReviewSection productId={product.id} />` to the product detail page

### T-008: Web — HelpfulButton with Optimistic Vote Toggle

**User Story**: US-006
**Satisfies ACs**: AC-US6-04
**Domain**: web-frontend
**Status**: [x] completed

**Test Plan**:
- **Given** a ReviewCard with a logged-in user viewing an approved review they did not author
- **When** the user clicks "Helpful"
- **Then** the helpful count updates immediately (optimistic update), POST /reviews/:id/vote is called, and on API error the count reverts to the previous value

**Test Cases**:
1. **Unit**: `apps/web/src/components/reviews/__tests__/HelpfulButton.test.tsx`
   - testOptimisticIncrement(): Click Helpful → helpfulCount shows N+1 before API resolves
   - testToggleOff(): userHasVoted=true on click → helpfulCount shows N-1 (optimistic)
   - testRevertOnError(): API returns error → helpfulCount reverts to original
   - testDisabledWhenUnauthenticated(): Unauthenticated user sees disabled or tooltip-only button
   - **Coverage Target**: 85%

2. **Unit**: `apps/web/src/hooks/__tests__/useToggleVote.test.ts`
   - testOptimisticUpdate_incrementsQueryCache(): onMutate updates the React Query reviews list cache
   - testOptimisticUpdate_rollback(): onError restores previous cache snapshot via context
   - **Coverage Target**: 85%

**Implementation**:
1. Add `toggleVote(reviewId)` to `apps/web/src/lib/api/reviews.ts`
2. Create `apps/web/src/hooks/useToggleVote.ts`: `useMutation` with `onMutate` that snapshots and optimistically updates the `useReviews` query cache, and `onError` that rolls back from the snapshot
3. Create `apps/web/src/components/reviews/HelpfulButton.tsx`: "Helpful (N)" button; disabled when not authenticated; calls `useToggleVote`
4. Add `<HelpfulButton reviewId={review.id} helpfulCount={review.helpfulCount} userHasVoted={review.userHasVoted} />` inside `ReviewCard.tsx`

---

## User Story: US-007 - Review Summary & Rating Distribution

**Linked ACs**: AC-US7-01, AC-US7-02, AC-US7-03
**Tasks**: 1 total, 1 completed

### T-009: Web — ReviewSummary Component with Distribution Bar Chart

**User Story**: US-007
**Satisfies ACs**: AC-US7-01, AC-US7-02, AC-US7-03
**Domain**: web-frontend
**Status**: [x] completed

**Test Plan**:
- **Given** a ReviewSummary component receiving a ReviewSummary object from useReviewSummary
- **When** the product has approved reviews
- **Then** the average rating (1 decimal) and total count are displayed, and a horizontal bar for each of 5 star levels shows count and proportional percentage width; when reviewCount is 0, a "No reviews yet" message is shown instead

**Test Cases**:
1. **Unit**: `apps/web/src/components/reviews/__tests__/ReviewSummary.test.tsx`
   - testAverageRatingDisplay(): avgRating=4.333 → displays "4.3"
   - testReviewCount(): reviewCount=12 → "12 reviews" label
   - testDistributionBars(): distribution={5:6,4:3,3:2,2:1,1:0}, reviewCount=12 → 5-star bar width=50%, 4-star=25%, etc.
   - testNoReviews_emptyState(): avgRating=null, reviewCount=0 → "No reviews yet" message rendered instead of summary
   - **Coverage Target**: 85%

**Implementation**:
1. Create `apps/web/src/components/reviews/ReviewSummary.tsx`:
   - Accept `summary: ReviewSummary | null` prop
   - If summary is null or reviewCount === 0: render "No reviews yet" message
   - Otherwise: render average star rating using `<StarRating value={avgRating} readonly />` + "{reviewCount} reviews"
   - Render distribution bars iterating stars 5 down to 1: label "{n} stars", filled bar `style={{ width: (distribution[n]/reviewCount*100)+'%' }}`, count "{distribution[n]}"
2. Connect `<ReviewSummary summary={summaryData} />` inside `ReviewSection.tsx`

---

## User Story: US-008 - Admin Reviews Moderation Page

**Linked ACs**: AC-US8-01, AC-US8-02, AC-US8-03, AC-US8-04
**Tasks**: 1 total, 1 completed

### T-010: Admin — Reviews Moderation Page with Table, Filters, and Inline Actions

**User Story**: US-008
**Satisfies ACs**: AC-US8-01, AC-US8-02, AC-US8-03, AC-US8-04
**Domain**: admin-frontend
**Status**: [x] completed

**Test Plan**:
- **Given** the admin dashboard navigated to `/reviews`
- **When** the page renders and an admin interacts with it
- **Then** a table shows product name, customer, rating, comment preview, status badge, date, and action buttons; status filter tabs update the table without page reload; Approve/Reject update the row status inline with a success toast; Delete shows a confirmation dialog and removes the row on confirm

**Test Cases**:
1. **Unit**: `apps/admin/src/components/reviews/__tests__/ReviewsTable.test.tsx`
   - testRendersColumns(): All 7 columns present in rendered table
   - testStatusBadge_pending(): PENDING status renders yellow/warning badge
   - testStatusBadge_approved(): APPROVED renders green badge
   - testCommentPreviewTruncated(): Comment over 100 chars truncated with "..."
   - **Coverage Target**: 80%

2. **Unit**: `apps/admin/src/components/reviews/__tests__/ReviewActions.test.tsx`
   - testApproveButton_callsMutation(): Click Approve → useApproveReview mutation invoked with correct id
   - testRejectButton_callsMutation(): Click Reject → useRejectReview mutation invoked
   - testDeleteButton_showsDialog(): Click Delete → confirmation dialog appears before any mutation
   - testDeleteConfirm_callsMutation(): Confirm in dialog → useDeleteReview mutation invoked
   - testDeleteCancel_noMutation(): Cancel in dialog → no mutation called
   - **Coverage Target**: 85%

3. **Unit**: `apps/admin/src/hooks/__tests__/useAdminReviews.test.ts`
   - testUseAdminReviews_statusFilter(): status=PENDING passed as query param to GET /admin/reviews
   - testUseApproveReview_invalidatesQuery(): After approve mutation settles, reviews query is invalidated
   - testUseDeleteReview_invalidatesQuery(): After delete mutation, reviews query is invalidated
   - **Coverage Target**: 80%

**Implementation**:
1. Create `apps/admin/src/lib/api/reviews.ts` with functions: `getAdminReviews(filters)`, `approveReview(id)`, `rejectReview(id)`, `deleteAdminReview(id)`
2. Create `apps/admin/src/hooks/useAdminReviews.ts` with: `useAdminReviews(filters)` (useQuery), `useApproveReview()`, `useRejectReview()`, `useDeleteReview()` (useMutation; each invalidates the admin reviews query on success)
3. Create `apps/admin/src/components/reviews/ReviewStatusFilter.tsx`: tab/button group for ALL / PENDING / APPROVED / REJECTED; highlights active filter
4. Create `apps/admin/src/components/reviews/ReviewActions.tsx`: Approve, Reject, Delete buttons per row; Delete opens confirmation dialog before calling mutation; mutations show success toast via existing toast utility
5. Create `apps/admin/src/components/reviews/ReviewsTable.tsx`: data table with columns: product name, customer name, star rating, comment preview (truncated at 100 chars), color-coded status badge, formatted date, `<ReviewActions>` per row
6. Create `apps/admin/src/app/(dashboard)/reviews/page.tsx`: compose `<ReviewStatusFilter>` + `<ReviewsTable>`; selected status filter passed to `useAdminReviews`
7. Add "Reviews" navigation link to admin sidebar
