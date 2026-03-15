# Architecture Plan: Product Reviews & Ratings (0016)

## 1. Overview

Add a verified-purchaser review system with star ratings, helpful votes, admin moderation, and denormalized product aggregates. The design follows established ShopVui patterns: separate customer-facing and admin NestJS modules, shared types in `packages/shared`, Next.js App Router pages with React Query, and Prisma schema conventions.

---

## 2. Data Model

### 2.1 New Enum: ReviewStatus

```
enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}
```

Placed in `packages/db/prisma/schema.prisma` after the existing enums.

### 2.2 New Model: ProductReview

```
model ProductReview {
  id           String       @id @default(cuid())
  userId       String       @map("user_id")
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId    String       @map("product_id")
  product      Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  rating       Int                          // 1-5, validated at app layer
  comment      String                       // 10-1000 chars, validated at app layer
  status       ReviewStatus @default(PENDING)
  helpfulCount Int          @default(0) @map("helpful_count")
  votes        ReviewVote[]
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  @@unique([userId, productId])
  @@index([productId, status])
  @@index([userId])
  @@map("product_reviews")
}
```

### 2.3 New Model: ReviewVote

```
model ReviewVote {
  id        String        @id @default(cuid())
  reviewId  String        @map("review_id")
  review    ProductReview @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  userId    String        @map("user_id")
  createdAt DateTime      @default(now()) @map("created_at")

  @@unique([userId, reviewId])
  @@map("review_votes")
}
```

No `User` relation on ReviewVote -- keeps User model clean; userId is sufficient for lookup.

### 2.4 Product Model Changes

Add two denormalized fields to the existing `Product` model:

```
avgRating    Float?  @map("avg_rating")
reviewCount  Int     @default(0) @map("review_count")
reviews      ProductReview[]
```

Add index: `@@index([avgRating])` (future: sort products by rating).

### 2.5 User Model Changes

Add relation:

```
reviews      ProductReview[]
```

### 2.6 Aggregate Recalculation Strategy

**Decision**: Recalculate inside a Prisma `$transaction` whenever a review's status changes (approve, reject, delete) or when a previously-approved review is edited (status resets to PENDING).

```
Recalculate = within $transaction:
  1. COUNT + AVG on ProductReview WHERE productId = X AND status = APPROVED
  2. UPDATE Product SET avgRating, reviewCount
```

**Why transactional**: Prevents stale reads between the count query and the update. The write volume is low (moderation actions), so transaction overhead is negligible.

**Why not a Prisma middleware / database trigger**: Explicit recalculation is simpler to test, debug, and reason about. Triggers add hidden behavior that breaks TDD.

### 2.7 helpfulCount Denormalization

`helpfulCount` is stored on `ProductReview` and updated atomically via `prisma.productReview.update({ data: { helpfulCount: { increment: 1 } } })` inside the same transaction that creates/deletes the `ReviewVote`. This avoids a COUNT query on every review list fetch.

---

## 3. API Module Structure

Following ADR-0002 (separate admin modules under `apps/api/src/admin/`):

### 3.1 Customer-Facing: ReviewsModule

**Location**: `apps/api/src/reviews/`

```
apps/api/src/reviews/
  reviews.module.ts
  reviews.controller.ts
  reviews.service.ts
  dto/
    create-review.dto.ts
    update-review.dto.ts
    review-list-query.dto.ts
```

**Endpoints**:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/reviews` | JwtAuthGuard | Create review (purchase-verified) |
| GET | `/reviews` | Optional JWT | List approved reviews for a product |
| PATCH | `/reviews/:id` | JwtAuthGuard | Update own review (resets to PENDING) |
| DELETE | `/reviews/:id` | JwtAuthGuard | Delete own review |
| POST | `/reviews/:id/vote` | JwtAuthGuard | Toggle helpful vote |
| GET | `/reviews/summary/:productId` | Public | Get rating distribution (1-5 counts) |

### 3.2 Admin: AdminReviewsModule

**Location**: `apps/api/src/admin/reviews/`

```
apps/api/src/admin/reviews/
  admin-reviews.module.ts
  admin-reviews.controller.ts
  admin-reviews.service.ts
  dto/
    admin-review-list-query.dto.ts
```

**Endpoints**:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/reviews` | AdminGuard | List reviews with filters (status, productId, userId) |
| PATCH | `/admin/reviews/:id/approve` | AdminGuard | Approve review, recalc aggregates |
| PATCH | `/admin/reviews/:id/reject` | AdminGuard | Reject review, recalc aggregates |
| DELETE | `/admin/reviews/:id` | AdminGuard | Delete review + votes, recalc aggregates |

### 3.3 Purchase Verification

Extracted as a private method in `ReviewsService`:

```typescript
private async verifyPurchase(userId: string, productId: string): Promise<boolean> {
  const delivered = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId, status: 'DELIVERED' },
    },
  });
  return !!delivered;
}
```

**Why not a separate guard**: Purchase verification is specific to the create-review flow. A guard would be over-abstracted for a single endpoint and harder to unit test in isolation.

### 3.4 Module Registration

- `ReviewsModule` imported in `AppModule`
- `AdminReviewsModule` imported in `AdminModule`

---

## 4. Shared Types

**File**: `packages/shared/src/review.ts`

```typescript
// Enum mirroring Prisma ReviewStatus
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// DTOs
export interface CreateReviewDto {
  productId: string;
  rating: number;    // 1-5
  comment: string;   // 10-1000 chars
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

// Query
export interface ReviewListQuery {
  productId?: string;
  status?: ReviewStatus;
  page?: number;
  pageSize?: number;
  sortBy?: 'rating' | 'createdAt' | 'helpfulCount';
}

// Response shapes
export interface ReviewResponse {
  id: string;
  userId: string;
  userName: string | null;
  productId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  helpfulCount: number;
  userHasVoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewVoteResponse {
  voted: boolean;
  helpfulCount: number;
}

export interface ReviewSummary {
  avgRating: number | null;
  reviewCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

// Admin
export interface AdminReviewListItem {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string | null;
  rating: number;
  comment: string;
  status: ReviewStatus;
  helpfulCount: number;
  createdAt: string;
}
```

**Export** from `packages/shared/src/index.ts`:
```typescript
export type { ReviewStatus, CreateReviewDto, UpdateReviewDto, ReviewListQuery, ReviewResponse, ReviewVoteResponse, ReviewSummary, AdminReviewListItem } from './review.js';
```

---

## 5. Frontend Architecture

### 5.1 Web App (apps/web) -- Product Detail Page Integration

**Components** (all in `apps/web/src/components/reviews/`):

| Component | Responsibility |
|-----------|---------------|
| `ReviewSection.tsx` | Container: fetches reviews + summary, orchestrates children |
| `ReviewSummary.tsx` | Average rating, star distribution bars |
| `ReviewList.tsx` | Paginated list of approved reviews |
| `ReviewCard.tsx` | Single review: stars, comment, helpful button |
| `ReviewForm.tsx` | Star selector + textarea, client-side validation |
| `StarRating.tsx` | Reusable star display (read-only and interactive modes) |
| `HelpfulButton.tsx` | Toggle vote with optimistic update |

**Data fetching**: React Query hooks in `apps/web/src/hooks/`:

```
useReviews(productId, page)         -- GET /reviews?productId=X&page=N
useReviewSummary(productId)         -- GET /reviews/summary/{productId}
useCreateReview()                   -- POST /reviews (mutation)
useToggleVote()                     -- POST /reviews/:id/vote (mutation, optimistic)
```

**Integration point**: `ReviewSection` is rendered inside the product detail page (`apps/web/src/app/products/[slug]/page.tsx` or equivalent). It receives `productId` as a prop and is self-contained.

**userHasVoted**: The GET `/reviews` endpoint checks the requesting user's JWT (if present) and annotates each review with `userHasVoted: boolean`. Unauthenticated users see `false`.

### 5.2 Admin App (apps/admin) -- Moderation Page

**Page**: `apps/admin/src/app/(dashboard)/reviews/page.tsx`

**Components** (in `apps/admin/src/components/reviews/`):

| Component | Responsibility |
|-----------|---------------|
| `ReviewsTable.tsx` | Data table with columns: product, customer, rating, comment preview, status, date, actions |
| `ReviewStatusFilter.tsx` | Status filter tabs (ALL / PENDING / APPROVED / REJECTED) |
| `ReviewActions.tsx` | Approve / Reject / Delete buttons per row |

**Data fetching**: React Query hooks in `apps/admin/src/hooks/`:

```
useAdminReviews(filters)            -- GET /admin/reviews
useApproveReview()                  -- PATCH /admin/reviews/:id/approve (mutation)
useRejectReview()                   -- PATCH /admin/reviews/:id/reject (mutation)
useDeleteReview()                   -- DELETE /admin/reviews/:id (mutation)
```

---

## 6. Security & Validation

### 6.1 Input Validation

- **Rating**: Integer 1-5 (class-validator `@IsInt() @Min(1) @Max(5)` in NestJS DTO)
- **Comment**: String 10-1000 chars (`@MinLength(10) @MaxLength(1000)`)
- **XSS**: Sanitize comment with a simple strip-tags utility before storage. No HTML is needed in reviews.

### 6.2 Authorization Rules

| Action | Rule |
|--------|------|
| Create review | JWT required + purchase verified (DELIVERED order with product) |
| Update/delete review | JWT required + review.userId === req.user.sub |
| Vote | JWT required + review.userId !== req.user.sub + review.status === APPROVED |
| Admin moderation | AdminGuard (req.user.role === ADMIN) |
| Read reviews | Public (only APPROVED reviews returned) |

### 6.3 Rate Limiting

Not in scope for this increment. The existing global rate limiter applies.

---

## 7. Data Flow Diagrams

### 7.1 Create Review Flow

```
Customer POST /reviews {productId, rating, comment}
  |
  v
JwtAuthGuard --> extract userId
  |
  v
ReviewsService.create()
  |-- verifyPurchase(userId, productId)
  |     |-- Query OrderItem JOIN Order WHERE status=DELIVERED
  |     |-- false? --> throw 403
  |
  |-- Check unique(userId, productId) via Prisma
  |     |-- exists? --> throw 409
  |
  |-- prisma.productReview.create({ status: PENDING })
  |
  v
Return 201 { review }
```

### 7.2 Approve Review Flow

```
Admin PATCH /admin/reviews/:id/approve
  |
  v
AdminGuard --> verify role=ADMIN
  |
  v
AdminReviewsService.approve(id)
  |-- prisma.$transaction([
  |     update review SET status=APPROVED,
  |     recalcProductAggregates(review.productId)
  |   ])
  |
  v
Return 200 { review }
```

### 7.3 Toggle Vote Flow

```
Customer POST /reviews/:id/vote
  |
  v
JwtAuthGuard --> extract userId
  |
  v
ReviewsService.toggleVote(reviewId, userId)
  |-- Load review (must be APPROVED)
  |-- review.userId === userId? --> throw 403
  |-- Find existing vote
  |-- prisma.$transaction([
  |     existingVote?
  |       delete vote + decrement helpfulCount
  |     : create vote + increment helpfulCount
  |   ])
  |
  v
Return 200 { voted: boolean, helpfulCount: number }
```

---

## 8. File Ownership Map

For multi-agent execution, each task maps to a clear file set:

| Task Area | Files | Domain |
|-----------|-------|--------|
| Prisma schema | `packages/db/prisma/schema.prisma` | backend |
| Shared types | `packages/shared/src/review.ts`, `packages/shared/src/index.ts` | shared |
| Customer API | `apps/api/src/reviews/**` | backend |
| Admin API | `apps/api/src/admin/reviews/**` | backend |
| Module wiring | `apps/api/src/app.module.ts`, `apps/api/src/admin/admin.module.ts` | backend |
| Web review UI | `apps/web/src/components/reviews/**`, `apps/web/src/hooks/useReviews.ts` | frontend |
| Web page integration | `apps/web/src/app/products/[slug]/page.tsx` (add ReviewSection) | frontend |
| Admin moderation UI | `apps/admin/src/app/(dashboard)/reviews/**`, `apps/admin/src/components/reviews/**` | frontend |
| Admin hooks | `apps/admin/src/hooks/useAdminReviews.ts` | frontend |

---

## 9. Key Design Decisions

### D1: Denormalized aggregates on Product (avgRating, reviewCount)

**Trade-off**: Slight write complexity (recalc on status change) vs. eliminating aggregation queries on every product page load. Product pages are read-heavy; moderation actions are infrequent. Clear win for denormalization.

### D2: helpfulCount on ProductReview (not computed from COUNT)

**Trade-off**: Same rationale as D1. Atomic increment/decrement via Prisma avoids race conditions while keeping read path fast.

### D3: No ReviewVote relation to User model

**Trade-off**: Adding `votes ReviewVote[]` to User would require touching the User model for a low-priority feature. The userId field on ReviewVote is sufficient for unique constraint and lookup. Keeps User model stable.

### D4: Single summary endpoint (/reviews/summary/:productId) rather than embedding in product API

**Trade-off**: A separate endpoint allows independent caching and avoids changing the existing Product API response shape. The frontend fetches summary and reviews in parallel via React Query.

### D5: Purchase verification as service method, not guard

**Trade-off**: Guards should handle authorization based on user identity/role, not business rules involving database queries against unrelated tables. A service method is more explicit, testable, and doesn't confuse the guard pattern.

### D6: Sanitize comments server-side (strip tags)

**Trade-off**: Simple approach sufficient for text-only reviews. No rich text needed. A basic sanitizer (e.g., `sanitize-html` with no allowed tags or a regex strip) prevents stored XSS without adding rendering complexity.

---

## 10. Implementation Order

1. **T-001**: Prisma schema (ReviewStatus enum, ProductReview, ReviewVote, Product aggregate fields) + migration
2. **T-002**: Shared types (`packages/shared/src/review.ts` + re-export from index.ts)
3. **T-003**: ReviewsService + ReviewsController (create, list, update, delete) with purchase verification
4. **T-004**: Vote toggle endpoint in ReviewsController
5. **T-005**: AdminReviewsService + AdminReviewsController (list, approve, reject, delete) with aggregate recalculation
6. **T-006**: Web -- ReviewSection, ReviewSummary, ReviewList, ReviewCard, ReviewForm, StarRating components + hooks
7. **T-007**: Web -- HelpfulButton with optimistic vote toggle
8. **T-008**: Admin -- Reviews moderation page with table, filters, and actions

Tasks 1-2 are sequential prerequisites. Tasks 3-5 can run in parallel after 2. Tasks 6-8 can run in parallel after 3-5 (need API contracts).

---

## 11. Testing Strategy

- **Unit tests**: Service methods (create, verify purchase, toggle vote, recalculate aggregates) with mocked Prisma client
- **Integration tests**: Full request lifecycle through NestJS test module with test database
- **E2E tests**: Playwright for review form submission, vote toggle, admin moderation page
- **Edge cases**: Duplicate review (409), no purchase (403), self-vote (403), vote toggle idempotency, aggregate accuracy after approve/reject/delete sequences
