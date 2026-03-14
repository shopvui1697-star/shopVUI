# Tasks: 0003-product-catalog — Product Catalog (Read-Only)

## Metadata

```yaml
increment: 0003-product-catalog
title: Product Catalog (Read-Only)
total_tasks: 8
completed_tasks: 8
by_user_story:
  US-001: [T-001, T-002, T-005, T-006]
  US-002: [T-003, T-006]
  US-003: [T-003, T-004, T-005, T-007]
  US-004: [T-004, T-006]
```

---

## User Story: US-001 — Browse Products

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03
**Tasks**: 4 total, 4 completed

---

### T-001: Add Prisma Models (Product, Category, ProductImage) + Seed Data

**User Story**: US-001
**Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US1-03
**Status**: [x] completed

**Test Plan**:

- **Given** the Prisma schema file exists in `packages/db`
- **When** `prisma migrate dev` is run and the seed script executes
- **Then** the database contains Product, Category, and ProductImage tables with at least 10 seeded products across 3 categories

Edge case — empty seed:
- **Given** the seed script runs against an empty database
- **When** all relations are seeded (categories first, then products, then images)
- **Then** foreign key constraints pass with no errors and `prisma validate` exits 0

Edge case — duplicate seed run:
- **Given** the seed script is run twice (idempotent check)
- **When** upsert logic is used for seed records
- **Then** no duplicate rows exist and the row count remains stable

**Test Cases**:

1. **Integration**: `packages/db/src/__tests__/seed.test.ts`
   - `seedCreatesCategories()`: Asserts 3+ category rows after seed
   - `seedCreatesProducts()`: Asserts 10+ product rows with valid categoryId FK
   - `seedCreatesProductImages()`: Asserts each product has at least 1 image
   - **Coverage Target**: 90%

**Implementation**:
1. Add `Category`, `Product`, `ProductImage` models to `packages/db/prisma/schema.prisma`
2. Run `pnpm --filter @shopvui/db prisma migrate dev --name add-product-catalog`
3. Create `packages/db/prisma/seed.ts` with idempotent upsert logic
4. Register seed script in `packages/db/package.json` under `prisma.seed`
5. Run `pnpm --filter @shopvui/db prisma db seed` and verify row counts

---

### T-002: Add Shared TypeScript Types (Product, Category, ProductImage, PaginatedResponse)

**User Story**: US-001
**Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US1-03
**Status**: [x] completed

**Test Plan**:

- **Given** the `packages/shared` package is imported in both `apps/api` and `apps/web`
- **When** TypeScript compilation runs across the monorepo
- **Then** no type errors are emitted and all exported types are resolvable

Edge case — PaginatedResponse generic:
- **Given** `PaginatedResponse<T>` is used with both `Product` and `Category`
- **When** a consumer destructures `{ data, total, page, pageSize, totalPages }`
- **Then** TypeScript infers the correct element type for `data`

**Test Cases**:

1. **Unit**: `packages/shared/src/__tests__/types.test.ts`
   - `productTypeShape()`: Validates required fields (id, name, price, stock, categoryId, images) are present on the type contract via a satisfies check
   - `paginatedResponseGeneric()`: Asserts `PaginatedResponse<Product>` compiles with correct `data` array element type
   - **Coverage Target**: 80% (type-level, compile-time assertions)

**Implementation**:
1. Create `packages/shared/src/types/product.ts` — export `Product`, `ProductImage`
2. Create `packages/shared/src/types/category.ts` — export `Category`
3. Create `packages/shared/src/types/pagination.ts` — export `PaginatedResponse<T>`
4. Re-export all from `packages/shared/src/index.ts`
5. Run `pnpm -r tsc --noEmit` to confirm zero type errors

---

## User Story: US-002 — Search & Filter

**Linked ACs**: AC-US2-01, AC-US2-02, AC-US2-03
**Tasks**: 2 total (shared with US-003), 2 completed

---

### T-003: NestJS ProductsModule — Service + Controller

**User Story**: US-002, US-003
**Satisfies ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US3-01, AC-US3-03
**Status**: [x] completed

**Test Plan**:

Happy path — list with pagination:
- **Given** 25 products exist in the database
- **When** `GET /products?page=2&pageSize=10` is called
- **Then** response body contains `{ data: [...10 items], page: 2, pageSize: 10, total: 25, totalPages: 3 }`

Happy path — text search:
- **Given** a product with name "Red Sneakers" exists
- **When** `GET /products?search=sneakers` is called
- **Then** response `data` array contains the matching product and total reflects only matching results

Happy path — category filter:
- **Given** products in category "shoes" and category "hats" exist
- **When** `GET /products?categoryId=<shoes-id>` is called
- **Then** response `data` contains only shoe products

Happy path — combined search + filter:
- **Given** `GET /products?search=red&categoryId=<shoes-id>` is called
- **When** service applies both predicates
- **Then** only products matching both conditions are returned (AC-US2-03)

Happy path — product detail:
- **Given** a product with id `abc123` exists
- **When** `GET /products/abc123` is called
- **Then** response includes `images`, `stock`, `description`, `price`, and `category` (AC-US3-01, AC-US3-03)

Edge case — product not found:
- **Given** no product with id `nonexistent` exists
- **When** `GET /products/nonexistent` is called
- **Then** response is `404 Not Found` with a descriptive message

Edge case — empty search result:
- **Given** no products match `search=xyz123abc`
- **When** the endpoint responds
- **Then** `{ data: [], total: 0, totalPages: 0 }` is returned (not a 404)

**Test Cases**:

1. **Unit**: `apps/api/src/products/__tests__/products.service.spec.ts`
   - `findAll_returnsPaginatedResults()`: Mocked Prisma, checks page/pageSize math
   - `findAll_filtersbySearch()`: Verifies `where.name.contains` is passed to Prisma
   - `findAll_filtersByCategoryId()`: Verifies `where.categoryId` is applied
   - `findAll_combinesSearchAndCategory()`: Both predicates applied simultaneously
   - `findOne_returnsProduct()`: Returns product with images relation included
   - `findOne_throwsNotFound()`: Prisma returns null → service throws `NotFoundException`
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/products/__tests__/products.controller.spec.ts`
   - `GET /products` returns 200 with paginated shape
   - `GET /products?search=X` returns filtered results
   - `GET /products/:id` returns product detail
   - `GET /products/nonexistent` returns 404
   - **Coverage Target**: 90%

**Implementation**:
1. Generate module: `nest g module products`, `nest g service products`, `nest g controller products`
2. Implement `ProductsService.findAll(query: ProductsQueryDto)` with Prisma `findMany` + `count`
3. Implement `ProductsService.findOne(id: string)` with `include: { images: true, category: true }`
4. Implement `ProductsController` with `@Get()` and `@Get(':id')` decorators
5. Create `ProductsQueryDto` with `search?`, `categoryId?`, `page?`, `pageSize?` fields + class-validator decorators
6. Wire up `PrismaModule` import in `ProductsModule`
7. Run unit + integration tests

---

## User Story: US-004 — Category Navigation

**Linked ACs**: AC-US4-01, AC-US4-02
**Tasks**: 2 total, 2 completed

---

### T-004: NestJS CategoriesModule — Service + Controller

**User Story**: US-004
**Satisfies ACs**: AC-US4-01, AC-US4-02
**Status**: [x] completed

**Test Plan**:

Happy path — list all categories:
- **Given** 5 categories exist in the database
- **When** `GET /categories` is called
- **Then** response is an array of all 5 categories each with `{ id, name, slug }`

Edge case — empty categories:
- **Given** no categories have been seeded
- **When** `GET /categories` is called
- **Then** response is an empty array `[]` with status 200 (not 404)

**Test Cases**:

1. **Unit**: `apps/api/src/categories/__tests__/categories.service.spec.ts`
   - `findAll_returnsAllCategories()`: Mocked Prisma returns 5 categories
   - `findAll_returnsEmptyArray()`: Mocked Prisma returns [] without throwing
   - **Coverage Target**: 90%

2. **Integration**: `apps/api/src/categories/__tests__/categories.controller.spec.ts`
   - `GET /categories` returns 200 with array shape
   - `GET /categories` with no data returns `[]`
   - **Coverage Target**: 85%

**Implementation**:
1. Generate: `nest g module categories`, `nest g service categories`, `nest g controller categories`
2. Implement `CategoriesService.findAll()` — `prisma.category.findMany({ orderBy: { name: 'asc' } })`
3. Implement `CategoriesController` with `@Get()` returning service result
4. Wire `PrismaModule` in `CategoriesModule`
5. Run unit + integration tests

---

## User Story: US-001 (continued) — UI Components

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US3-02, AC-US3-03
**Tasks in this section**: 1

---

### T-005: UI Components — ProductCard, CategoryPill, SearchBar, StockBadge

**User Story**: US-001, US-003
**Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US3-02, AC-US3-03
**Status**: [x] completed

**Test Plan**:

ProductCard — happy path:
- **Given** a `Product` object with name, price, image, and stock > 0
- **When** `<ProductCard product={...} />` renders
- **Then** product name, formatted price, and thumbnail image are visible and stock badge shows "In Stock"

ProductCard — out of stock:
- **Given** a product with `stock === 0`
- **When** `<ProductCard product={...} />` renders
- **Then** `<StockBadge>` displays "Out of Stock" with a distinct visual treatment

CategoryPill — selected state:
- **Given** `<CategoryPill category={cat} selected={true} />`
- **When** rendered
- **Then** the pill has an active/selected class and aria-pressed="true"

SearchBar — input change:
- **Given** `<SearchBar onSearch={fn} />`
- **When** the user types "sneakers" and the debounce resolves
- **Then** `onSearch` is called with the string "sneakers"

SearchBar — clear:
- **Given** SearchBar has value "sneakers"
- **When** the user clears the input
- **Then** `onSearch` is called with an empty string ""

**Test Cases**:

1. **Unit**: `packages/ui/src/__tests__/ProductCard.test.tsx`
   - `rendersProductNameAndPrice()`: RTL render, getByText assertions
   - `showsInStockBadge()`: stock > 0 → "In Stock" text present
   - `showsOutOfStockBadge()`: stock === 0 → "Out of Stock" text present
   - **Coverage Target**: 90%

2. **Unit**: `packages/ui/src/__tests__/CategoryPill.test.tsx`
   - `rendersLabel()`: category name visible
   - `selectedStateHasAriaPressed()`: aria-pressed="true" when selected
   - **Coverage Target**: 85%

3. **Unit**: `packages/ui/src/__tests__/SearchBar.test.tsx`
   - `callsOnSearchAfterDebounce()`: userEvent.type + fake timers
   - `callsOnSearchWithEmptyOnClear()`: clear → onSearch("")
   - **Coverage Target**: 90%

**Implementation**:
1. Create `packages/ui/src/components/ProductCard.tsx` — accepts `Product` prop, renders image, name, price, `<StockBadge>`
2. Create `packages/ui/src/components/StockBadge.tsx` — renders "In Stock" / "Out of Stock" based on `stock` prop
3. Create `packages/ui/src/components/CategoryPill.tsx` — renders clickable pill with `selected` + `onSelect` props
4. Create `packages/ui/src/components/SearchBar.tsx` — controlled input with 300ms debounce, calls `onSearch`
5. Export all from `packages/ui/src/index.ts`
6. Run `pnpm --filter @shopvui/ui test`

---

## User Story: US-001 / US-002 / US-004 — Listing Page

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US2-01, AC-US2-02, AC-US2-03, AC-US4-01, AC-US4-02
**Tasks in this section**: 1

---

### T-006: Next.js /products Listing Page

**User Story**: US-001, US-002, US-004
**Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US2-01, AC-US2-02, AC-US2-03, AC-US4-01, AC-US4-02
**Status**: [x] completed

**Test Plan**:

Happy path — page renders grid:
- **Given** the API returns 10 products
- **When** the user visits `/products`
- **Then** a grid of 10 `<ProductCard>` components is displayed (AC-US1-01)

Happy path — pagination:
- **Given** the API returns `totalPages: 3` and the user is on page 1
- **When** the user clicks "Next"
- **Then** the URL updates to `?page=2` and a new set of products loads (AC-US1-03)

Happy path — category filter updates grid:
- **Given** categories are shown in the sidebar/filter bar
- **When** the user clicks the "Shoes" category pill
- **Then** the grid re-fetches with `categoryId=<shoes-id>` and updates (AC-US4-02, AC-US2-02)

Happy path — search updates grid:
- **Given** the search bar is focused
- **When** the user types "red" and debounce fires
- **Then** the grid re-fetches with `search=red` applied (AC-US2-01)

Combined search + filter:
- **Given** category "Shoes" is selected and search "red" is entered
- **When** both are active simultaneously
- **Then** API is called with both `categoryId` and `search` params (AC-US2-03)

Edge case — no results:
- **Given** search returns 0 products
- **When** the page renders
- **Then** an empty-state message "No products found" is shown instead of a grid

**Test Cases**:

1. **Unit**: `apps/web/src/app/products/__tests__/page.test.tsx`
   - `rendersProductGrid()`: MSW mocked API, checks ProductCard count
   - `paginationNavigatesToNextPage()`: click Next → URL param changes
   - `categoryFilterUpdatesGrid()`: click pill → re-fetch with categoryId
   - `searchBarFiltersGrid()`: type + debounce → re-fetch with search
   - `emptyStateShownWhenNoResults()`: 0 results → "No products found" visible
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/web/src/app/products/page.tsx` as a Next.js 15 Server Component with `searchParams` prop
2. Fetch categories and initial products server-side; pass to client wrapper
3. Create `apps/web/src/app/products/_components/ProductsClient.tsx` — client component managing search/filter/page state via URL search params
4. Integrate `<SearchBar>`, `<CategoryPill>`, `<ProductCard>` from `@shopvui/ui`
5. Implement pagination controls (prev/next + page indicator)
6. Add empty state UI
7. Run unit tests with MSW

---

## User Story: US-003 — Product Detail Page

**Linked ACs**: AC-US3-01, AC-US3-02, AC-US3-03
**Tasks in this section**: 1

---

### T-007: Next.js /products/[id] Detail Page

**User Story**: US-003
**Satisfies ACs**: AC-US3-01, AC-US3-02, AC-US3-03
**Status**: [x] completed

**Test Plan**:

Happy path — detail renders:
- **Given** a product with id "prod-1" exists with 3 images, a description, price, and stock > 0
- **When** the user visits `/products/prod-1`
- **Then** the product name, description, price, all 3 images, and "In Stock" badge are visible (AC-US3-01, AC-US3-02, AC-US3-03)

Happy path — out of stock display:
- **Given** a product with `stock === 0`
- **When** the detail page renders
- **Then** "Out of Stock" badge is shown and any "Add to Cart" CTA is disabled/absent (AC-US3-03)

Edge case — product not found:
- **Given** the API returns 404 for the requested id
- **When** the page renders
- **Then** Next.js `notFound()` is called and the 404 page is shown

Edge case — product with single image:
- **Given** a product has only 1 image
- **When** the detail page renders
- **Then** image gallery renders without crashing (no carousel index-out-of-bounds error)

**Test Cases**:

1. **Unit**: `apps/web/src/app/products/[id]/__tests__/page.test.tsx`
   - `rendersProductDetail()`: name, description, price present in DOM
   - `rendersAllProductImages()`: all image `src` URLs rendered
   - `showsInStockBadge()`: stock > 0 → "In Stock"
   - `showsOutOfStockBadge()`: stock === 0 → "Out of Stock"
   - `callsNotFoundFor404()`: API 404 → `notFound()` called
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/web/src/app/products/[id]/page.tsx` — Next.js 15 async Server Component, receives `params.id`
2. Fetch `GET /products/:id` server-side; call `notFound()` on 404
3. Render product name, description, formatted price, `<StockBadge>`
4. Implement image gallery component (`apps/web/src/app/products/[id]/_components/ImageGallery.tsx`) — thumbnail strip + main image
5. Run unit tests with MSW

---

## E2E Tests

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US2-01, AC-US2-02, AC-US2-03, AC-US3-01, AC-US3-02, AC-US3-03, AC-US4-01, AC-US4-02

---

### T-008: E2E Tests — Product Browsing Flow

**User Story**: US-001, US-002, US-003, US-004
**Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US2-01, AC-US2-02, AC-US2-03, AC-US3-01, AC-US3-02, AC-US3-03, AC-US4-01, AC-US4-02
**Status**: [x] completed

**Test Plan**:

E2E scenario 1 — browse and paginate (AC-US1-01, AC-US1-02, AC-US1-03):
- **Given** the app is running with seeded data
- **When** a user navigates to `/products`
- **Then** a product grid is visible with product names and prices, and pagination controls allow moving to page 2

E2E scenario 2 — search (AC-US2-01):
- **Given** the user is on `/products`
- **When** the user types "sneaker" in the search bar and waits for debounce
- **Then** only products matching "sneaker" appear in the grid

E2E scenario 3 — category filter (AC-US2-02, AC-US4-01, AC-US4-02):
- **Given** the user is on `/products`
- **When** the user clicks a category pill (e.g., "Shoes")
- **Then** the grid updates to show only products in the "Shoes" category

E2E scenario 4 — combined search + filter (AC-US2-03):
- **Given** category "Shoes" is selected
- **When** the user also types "red" in search
- **Then** only products matching both conditions are displayed

E2E scenario 5 — product detail navigation (AC-US3-01, AC-US3-02, AC-US3-03):
- **Given** the user is on `/products`
- **When** the user clicks on a product card
- **Then** they are navigated to `/products/:id` where product name, images, price, and stock status are all visible

E2E scenario 6 — out of stock product (AC-US3-03):
- **Given** a product with stock 0 exists
- **When** the user views its detail page
- **Then** "Out of Stock" badge is visible

**Test Cases**:

1. **E2E**: `apps/web/e2e/product-catalog.spec.ts` (Playwright)
   - `productGrid_displaysAndPaginates()`: navigate to /products, assert grid + pagination
   - `search_filtersProductGrid()`: type in search bar, assert filtered results
   - `categoryFilter_filtersProductGrid()`: click category pill, assert filtered grid
   - `combinedSearchAndFilter_appliesBothPredicates()`: search + category simultaneously
   - `productDetail_showsFullInfo()`: click card → detail page with images, price, stock
   - `outOfStock_showsBadge()`: stock-0 product → "Out of Stock" on detail
   - **Coverage Target**: 100% of AC scenarios (all 11 ACs covered)

**Implementation**:
1. Create `apps/web/e2e/product-catalog.spec.ts` with Playwright `test()` blocks for each scenario
2. Use `page.goto('/products')` and Playwright locators for assertions
3. Ensure seeded test database is available in the test environment
4. Run `npx playwright test e2e/product-catalog.spec.ts`
5. All 6 scenarios must pass before marking complete

---

## Coverage Summary

| Layer | File Pattern | Target |
|-------|-------------|--------|
| Prisma seed | `packages/db/src/__tests__/seed.test.ts` | 90% |
| Shared types | `packages/shared/src/__tests__/types.test.ts` | 80% |
| NestJS service | `apps/api/src/products/__tests__/products.service.spec.ts` | 95% |
| NestJS controller | `apps/api/src/products/__tests__/products.controller.spec.ts` | 90% |
| Categories service | `apps/api/src/categories/__tests__/categories.service.spec.ts` | 90% |
| Categories controller | `apps/api/src/categories/__tests__/categories.controller.spec.ts` | 85% |
| UI components | `packages/ui/src/__tests__/*.test.tsx` | 85-90% |
| Listing page | `apps/web/src/app/products/__tests__/page.test.tsx` | 90% |
| Detail page | `apps/web/src/app/products/[id]/__tests__/page.test.tsx` | 90% |
| E2E | `apps/web/e2e/product-catalog.spec.ts` | 100% AC coverage |
