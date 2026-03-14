# Plan: 0003 - Product Catalog (Read-Only)

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────────────────┐
│   Next.js 15    │     │        NestJS API            │
│   (apps/web)    │────►│        (apps/api)            │
│                 │     │                               │
│  /products      │     │  GET /products                │
│  /products/[id] │     │  GET /products/:id            │
│                 │     │  GET /categories              │
│  CategoryNav    │     │  GET /categories/:slug        │
│  ProductCard    │     │  GET /categories/:slug/prods  │
└─────────────────┘     └──────────┬──────────────────┘
                                   │
                        ┌──────────▼──────────────────┐
                        │   PostgreSQL (Prisma)        │
                        │   Product, Category,         │
                        │   ProductImage               │
                        └─────────────────────────────┘
```

## Architecture Decisions

### AD-1: Prices stored as integers (cents)

Store prices as `Int` in Prisma (cents), not `Float` or `Decimal`. The existing `formatCurrency` utility in `@shopvui/shared` already divides by 100. This avoids floating-point rounding issues and keeps the database portable. The `Decimal` Prisma type would require additional serialization handling in API responses.

### AD-2: Category hierarchy uses self-referential relation

Categories use a `parentId` nullable foreign key for one level of nesting (parent/child). This is simpler than a closure table or materialized path and sufficient for a product catalog with 2-level navigation (e.g., "Electronics > Headphones"). Querying children is a single `where: { parentId }` call. If deeper nesting is needed later, migrate to a materialized path.

### AD-3: Slug-based category URLs, cuid-based product URLs

Categories use slugs (`/categories/electronics`) for SEO-friendly, human-readable URLs. Products use cuid IDs (`/products/clx1abc...`) because product names can change and slugs would break bookmarks. Category slugs are immutable identifiers set at creation.

### AD-4: No pagination in v1, cursor-based when needed

For the initial read-only catalog, return all products (expected <100 for MVP). Add `take`/`cursor` pagination parameters to the service layer as optional params now so the interface is ready, but default to returning all. This avoids premature optimization while keeping the upgrade path clean.

### AD-5: Server Components for product pages

Next.js 15 App Router with React Server Components for `/products` and `/products/[id]`. Data fetching happens server-side via `fetch()` to the NestJS API. No client-side state management needed for read-only views. Interactive components (SearchBar) use `"use client"` directive.

### AD-6: Images as a separate model, not JSON array

`ProductImage` as a separate table rather than a JSON column on `Product`. This enables future features (alt text, ordering, CDN metadata) and allows Prisma relation queries. Each product has 1+ images with an `isPrimary` flag.

### AD-7: Public endpoints (no auth required)

All product catalog endpoints are public GET routes. No `JwtAuthGuard`. This matches the "read-only" scope and allows unauthenticated browsing. Swagger decorators use `@ApiTags('products')` and `@ApiTags('categories')` without `@ApiBearerAuth()`.

## Component Breakdown

### Layer 1: Database (`packages/db`)

**Files:**
- `prisma/schema.prisma` -- add Product, Category, ProductImage models
- `prisma/seed.ts` -- seed data with sample categories and products

**Prisma Models:**

```prisma
model Category {
  id        String     @id @default(cuid())
  name      String
  slug      String     @unique
  parentId  String?    @map("parent_id")
  parent    Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryTree")
  products  Product[]
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")

  @@map("categories")
}

model Product {
  id          String         @id @default(cuid())
  name        String
  description String
  price       Int            // cents
  sku         String         @unique
  stock       Int            @default(0)
  categoryId  String         @map("category_id")
  category    Category       @relation(fields: [categoryId], references: [id])
  images      ProductImage[]
  isActive    Boolean        @default(true) @map("is_active")
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")

  @@map("products")
}

model ProductImage {
  id        String  @id @default(cuid())
  url       String
  alt       String?
  isPrimary Boolean @default(false) @map("is_primary")
  productId String  @map("product_id")
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_images")
}
```

**Seed data:** 3-4 categories (Electronics, Clothing, Home), 2-3 subcategories each, 8-12 products with images (use placeholder URLs like `https://placehold.co/400x400`).

### Layer 2: Shared Types (`packages/shared`)

**Files:**
- `src/product.ts` -- Product, Category, ProductImage interfaces

```typescript
// src/product.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;        // cents
  sku: string;
  stock: number;
  categoryId: string;
  category?: Category;
  images: ProductImage[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent?: Category;
  children?: Category[];
  productCount?: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
}

export interface CategoryTreeResponse {
  categories: Category[];
}
```

- `src/index.ts` -- add exports for new types

### Layer 3: API (`apps/api`)

Follow existing NestJS module pattern from `auth`. Each module has controller + service, injected via `AppModule`.

**Products Module:**
- `src/products/products.module.ts`
- `src/products/products.service.ts`
- `src/products/products.controller.ts`

**Categories Module:**
- `src/categories/categories.module.ts`
- `src/categories/categories.service.ts`
- `src/categories/categories.controller.ts`

**Endpoints:**

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/products` | List active products | `ApiResponse<ProductListResponse>` |
| GET | `/products/:id` | Product detail with images | `ApiResponse<Product>` |
| GET | `/categories` | Category tree | `ApiResponse<CategoryTreeResponse>` |
| GET | `/categories/:slug` | Single category | `ApiResponse<Category>` |
| GET | `/categories/:slug/products` | Products in category | `ApiResponse<ProductListResponse>` |

**Query parameters for GET /products:**
- `categoryId?: string` -- filter by category
- `search?: string` -- search by name (case-insensitive `contains`)
- `take?: number` -- limit results (default: all)
- `cursor?: string` -- cursor for pagination

**Service pattern** (matches `AuthService`):
- Import `prisma` from `@shopvui/db`
- Use `@Injectable()` decorator
- Return typed responses using `@shopvui/shared` interfaces
- Throw `NotFoundException` for missing resources

**Controller pattern** (matches `AuthController`):
- Swagger decorators: `@ApiTags`, `@ApiOperation`, `@ApiParam`, `@ApiQuery`
- No auth guards (public endpoints)
- Wrap responses in `ApiResponse<T>` format

### Layer 4: UI Components (`packages/ui`)

**Files:**
- `src/components/ProductCard.tsx` -- product card with image, name, price, stock badge
- `src/components/CategoryPill.tsx` -- clickable category tag/badge
- `src/components/SearchBar.tsx` -- text input with search icon, debounced onChange
- `src/components/StockBadge.tsx` -- "In Stock" / "Low Stock" / "Out of Stock" badge
- `src/index.ts` -- add exports

**Component interfaces:**

```typescript
// ProductCard
interface ProductCardProps {
  product: Product;
  onClick?: (id: string) => void;
}

// CategoryPill
interface CategoryPillProps {
  category: Category;
  isActive?: boolean;
  onClick?: (slug: string) => void;
}

// SearchBar
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// StockBadge
interface StockBadgeProps {
  stock: number;
}
```

All components are presentational (no data fetching). `SearchBar` is a client component (`"use client"`). The others can be used in both server and client contexts.

### Layer 5: Frontend Pages (`apps/web`)

**Files:**
- `src/app/layout.tsx` -- root layout (if not existing)
- `src/app/products/page.tsx` -- product listing (Server Component)
- `src/app/products/[id]/page.tsx` -- product detail (Server Component)
- `src/lib/api.ts` -- fetch wrapper for NestJS API

**Data Flow:**
1. `page.tsx` (Server Component) calls `api.getProducts()` or `api.getProduct(id)`
2. `api.ts` uses `fetch()` to `${API_URL}/products` with `next: { revalidate: 60 }` for ISR
3. Page renders `ProductCard` / `CategoryPill` from `@shopvui/ui`
4. `SearchBar` is a client component that updates URL search params

**API client (`src/lib/api.ts`):**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function getProducts(params?: { categoryId?: string; search?: string }) {
  const url = new URL(`${API_URL}/products`);
  if (params?.categoryId) url.searchParams.set('categoryId', params.categoryId);
  if (params?.search) url.searchParams.set('search', params.search);
  const res = await fetch(url, { next: { revalidate: 60 } });
  return res.json();
}
```

## File Structure (New Files)

```
packages/db/prisma/
  schema.prisma              (modify - add 3 models)
  seed.ts                    (new - seed data)

packages/shared/src/
  product.ts                 (new - Product/Category/ProductImage types)
  index.ts                   (modify - add product exports)

apps/api/src/
  products/
    products.module.ts       (new)
    products.service.ts      (new)
    products.controller.ts   (new)
  categories/
    categories.module.ts     (new)
    categories.service.ts    (new)
    categories.controller.ts (new)
  app.module.ts              (modify - import ProductsModule, CategoriesModule)

packages/ui/src/
  components/
    ProductCard.tsx           (new)
    CategoryPill.tsx          (new)
    SearchBar.tsx             (new)
    StockBadge.tsx            (new)
  index.ts                   (modify - add exports)

apps/web/src/
  app/
    layout.tsx               (new - root layout)
    products/
      page.tsx               (new - listing)
      [id]/
        page.tsx             (new - detail)
  lib/
    api.ts                   (new - API client)
```

## Dependencies Between Layers

```
Layer 1 (DB)  ──► Layer 2 (Shared Types) ──► Layer 3 (API) ──► Layer 5 (Frontend)
                         │                                          │
                         └──────────► Layer 4 (UI) ────────────────┘
```

**Build order:**
1. `packages/db` -- schema + migration + seed
2. `packages/shared` -- types (no runtime deps)
3. `packages/ui` -- components (depends on shared types)
4. `apps/api` -- modules (depends on db + shared)
5. `apps/web` -- pages (depends on shared + ui, runtime dep on api)

## Key Patterns to Follow

1. **Prisma `@@map`** -- all models use snake_case table names (matches existing `users` table)
2. **`@map` on fields** -- camelCase in TS, snake_case in DB (matches `google_id`, `created_at` pattern)
3. **Service injects `prisma` via import** -- `import { prisma } from '@shopvui/db'` (not via DI)
4. **Swagger on every endpoint** -- `@ApiTags`, `@ApiOperation` (matches auth controller)
5. **Types from `@shopvui/shared`** -- API and frontend share the same interfaces
6. **UI components are presentational** -- no data fetching, props-driven
7. **`.js` extension in exports** -- `export { X } from './file.js'` (matches shared/ui index.ts pattern)

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| No pagination could be slow with many products | Service layer accepts optional `take`/`cursor` params; default returns all for MVP |
| Placeholder images break in production | Use `placehold.co` URLs that actually resolve; document image hosting decision for later |
| Category tree query could N+1 | Use Prisma `include` with explicit depth (`children: { include: { children: true } }`) limited to 2 levels |
| Frontend API URL configuration | Use `NEXT_PUBLIC_API_URL` env var with localhost default |

## Recommended Domain Skill Delegation

- **Backend implementation**: `backend:nodejs` for NestJS module scaffolding
- **Frontend implementation**: `frontend:architect` for Next.js page structure and data fetching patterns
