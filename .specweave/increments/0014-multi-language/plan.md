# Architecture Plan: 0014-multi-language

## ADR Reference
- **ADR-0004**: Cookie-Based i18n with next-intl (No URL Routing)

## Overview

Add Vietnamese/English language support to the web storefront (`apps/web`) using `next-intl` with cookie-based locale detection. Vietnamese is the default language. No URL prefix routing -- locale is stored in a `NEXT_LOCALE` cookie and mirrored to localStorage. All ~120+ hardcoded UI strings across 19+ components are extracted to JSON translation files. Dynamic API content (product names, descriptions) remains untranslated.

## Architecture

```
                     Request Flow
                     ============

Browser ──> next-intl middleware ──> reads NEXT_LOCALE cookie
                |                         |
                |                    locale = cookie ?? 'vi'
                |                         |
                v                         v
         +---------------------------------------------+
         |         Root Layout                          |
         |  <html lang={locale}>                        |
         |    <NextIntlClientProvider                    |
         |       locale={locale}                        |
         |       messages={messages}>                    |
         |                                              |
         |  +------------+  +------------------------+  |
         |  | Server     |  | Client                 |  |
         |  | Components |  | Components             |  |
         |  |            |  |                        |  |
         |  | getT()     |  | useTranslations()      |  |
         |  +------------+  +------------------------+  |
         +---------------------------------------------+

         Language Switcher (navbar)
         --------------------------
         User clicks toggle
           -> sets NEXT_LOCALE cookie
           -> mirrors to localStorage
           -> calls router.refresh()
           -> page re-renders with new locale
```

### Components

#### 1. i18n Configuration Layer
- `apps/web/src/i18n/config.ts` -- locale list (`vi`, `en`), default locale (`vi`), type exports
- `apps/web/src/i18n/request.ts` -- `getRequestConfig()` from `next-intl/server`, reads cookie, loads messages JSON

#### 2. Translation Files
- `apps/web/messages/vi.json` -- Vietnamese translations (~140 keys, nested by namespace)
- `apps/web/messages/en.json` -- English translations (mirror structure)
- Key naming: English camelCase organized by component namespace (`nav.*`, `cart.*`, `checkout.*`, etc.)

#### 3. Next.js Config Integration
Modify `apps/web/next.config.ts` to chain `createNextIntlPlugin()` with existing `withSerwist`:
```ts
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
export default withSerwist({...})(withNextIntl(nextConfig));
```
Order: `withNextIntl` wraps base config first (adds webpack aliases), `withSerwist` wraps the result (adds SW generation).

#### 4. Middleware
Create `apps/web/src/middleware.ts` (does not currently exist):
- Uses `createMiddleware` from `next-intl/middleware`
- `locales: ['vi', 'en']`, `defaultLocale: 'vi'`
- `localeDetection: false` (cookie-only, no Accept-Language sniffing)
- `localePrefix: 'never'` (no URL prefixes)
- Matcher excludes: `_next`, static assets, `sw.js`, API routes

#### 5. Root Layout Provider
Modify `apps/web/src/app/layout.tsx`:
- Make `RootLayout` async
- Call `getLocale()` and `getMessages()` from `next-intl/server`
- Set `<html lang={locale}>` dynamically (currently hardcoded `"en"`)
- Wrap with `<NextIntlClientProvider>` as the outermost provider (outside `AuthProvider`)

#### 6. LanguageSwitcher Component
New file: `apps/web/src/components/LanguageSwitcher.tsx`

Two rendering modes controlled by a `variant` prop:
- **`dropdown-item`** (authenticated): Renders as a list item inside the user dropdown in Navbar, between menu links and "Sign out" divider
- **`standalone`** (anonymous): Renders as a globe icon button next to the Login link

Behavior:
1. Read current locale via `useLocale()` from next-intl
2. On toggle: set `NEXT_LOCALE` cookie (`path=/; max-age=31536000; SameSite=Lax`)
3. Mirror to `localStorage.setItem('NEXT_LOCALE', newLocale)`
4. Call `useRouter().refresh()` to trigger server re-render

#### 7. String Extraction Across Components

| Namespace | Files | Type | Est. Keys |
|-----------|-------|------|-----------|
| `nav` | navbar/index.tsx, search.tsx | Client | ~10 |
| `footer` | footer.tsx | Client-tree | ~5 |
| `cart` | cart/page.tsx, cart-modal.tsx | Client | ~15 |
| `checkout` | checkout/page.tsx | Client | ~30 |
| `products` | products/page.tsx, search-filter.tsx, [id]/page.tsx | Mixed | ~15 |
| `login` | login/page.tsx | Client | ~5 |
| `orders` | orders/page.tsx, [orderNumber]/page.tsx | Mixed | ~10 |
| `account` | addresses/page.tsx, wishlist/page.tsx | Client | ~10 |
| `reseller` | reseller/* (8 pages) | Client | ~25 |
| `common` | error.tsx, loading.tsx, AddToCartButton, WishlistButton, PriceTierTable, OrderStatusBadge | Mixed | ~15 |

**@shopvui/ui constraint**: Components in `packages/ui/` (StockBadge, ProductCard, SearchBar) are framework-agnostic and built with tsup. They CANNOT use `useTranslations()`. Pass translated strings as props from consuming pages instead.

### Data Model
No database changes. Locale is stored client-side only (cookie + localStorage).

### API Contracts
No API changes. This increment is purely frontend. Dynamic content from the API remains in its original language.

## Technology Stack

- **Library**: `next-intl` (latest, compatible with Next.js 15 App Router)
- **Locale storage**: `NEXT_LOCALE` cookie + `localStorage` mirror
- **Translation format**: JSON with nested keys
- **Default locale**: `vi` (Vietnamese)
- **Supported locales**: `vi`, `en`

**Architecture Decisions** (see ADR-0004 for full rationale):
- Cookie-based over URL-prefix: preserves existing URLs, avoids PWA cache breakage, no link/SEO disruption
- next-intl over react-i18next: first-class RSC support for App Router
- Vietnamese as default: primary target market

## Implementation Phases

### Phase 1: Infrastructure (US-001) -- Foundation
1. `pnpm add next-intl` in `apps/web`
2. Create `src/i18n/config.ts` with locale definitions
3. Create `src/i18n/request.ts` with `getRequestConfig()`
4. Create skeleton `messages/vi.json` and `messages/en.json` with 3-5 test keys
5. Update `next.config.ts` to chain `withNextIntl` with `withSerwist`
6. Create `src/middleware.ts` with next-intl middleware config
7. Update `src/app/layout.tsx` with async locale loading and `NextIntlClientProvider`
8. Verify: `pnpm build` succeeds, default locale is `vi`, test key renders correctly

### Phase 2: Language Switcher (US-002)
1. Create `LanguageSwitcher` component with cookie/localStorage persistence
2. Add as dropdown item in authenticated user menu (navbar/index.tsx)
3. Add as standalone globe button for anonymous users (navbar/index.tsx)
4. Verify: toggle works, persists across page refresh, persists after browser restart

### Phase 3: Navigation & Layout Strings (US-003)
1. Extract navbar strings (navLinks labels, userMenuLinks labels, "Sign out", "Login") to `nav` namespace
2. Extract footer strings (link labels, copyright) to `footer` namespace
3. Extract search placeholder to `nav.searchPlaceholder`
4. Extract error.tsx and loading.tsx strings to `common` namespace
5. Populate corresponding keys in both `vi.json` and `en.json`

### Phase 4: Commerce Page Strings (US-004)
1. Extract cart page strings to `cart` namespace
2. Extract cart-modal strings to `cart` namespace
3. Extract checkout page strings (address form labels, payment methods, order summary, coupon, validation messages) to `checkout` namespace
4. Extract products page strings (pagination, empty state, search results text) to `products` namespace
5. Extract product detail page UI chrome to `products` namespace
6. Extract login page strings to `login` namespace
7. Populate all keys in both JSON files

### Phase 5: Account & Reseller Strings (US-005)
1. Extract addresses page strings to `account` namespace
2. Extract wishlist page strings to `account` namespace
3. Extract order history and order detail strings to `orders` namespace
4. Extract all reseller portal page strings to `reseller` namespace
5. Populate all keys in both JSON files
6. Final audit: grep for remaining hardcoded English strings

## Testing Strategy

- **Build verification**: `pnpm build` must succeed after each phase
- **Unit tests**: LanguageSwitcher component -- cookie setting, localStorage mirror, refresh trigger
- **Integration tests**: Render key pages with `vi` and `en` locale, assert correct translated strings
- **Regression**: All existing Vitest tests must continue to pass (string changes must not break logic)
- **Manual smoke test**: Full shopping flow (browse -> add to cart -> checkout) in both vi and en
- **Edge cases**: No cookie set (should default to vi), corrupted cookie value (should fallback to vi)

## Technical Challenges

### Challenge 1: Chaining withSerwist and withNextIntl
**Solution**: Apply `withNextIntl` to the base config first, then wrap with `withSerwist`. Validate with `pnpm build` in Phase 1 before touching any component files.
**Risk**: Low -- both are standard Next.js config wrapper functions that return NextConfig.

### Challenge 2: Mixed server/client components
**Solution**: Server components use `getTranslations()` (async), client components use `useTranslations()` (hook). The `NextIntlClientProvider` in root layout provides messages to all client components. Server components get messages via `getRequestConfig()`.
**Risk**: Low -- next-intl is designed for this exact pattern in App Router.

### Challenge 3: @shopvui/ui components cannot use next-intl hooks
**Solution**: Pass translated strings as props. For example, `<StockBadge inStockLabel={t('inStock')} outOfStockLabel={t('outOfStock')} />`. Document this pattern for future contributors.
**Risk**: Medium -- requires prop additions to UI components, slightly more verbose. But keeps the UI package framework-agnostic.

### Challenge 4: Large number of files to modify (19+)
**Solution**: Phase the work by page area. Each phase is independently buildable and testable. Use a "string extraction checklist" during Phase 3-5 to track coverage.
**Risk**: Low -- mechanical work, not architecturally risky. Main risk is missing a string, mitigated by final grep audit.

## Domain Skill Recommendations

- **`frontend:architect`** -- for detailed component-level design of LanguageSwitcher if more UI complexity is desired
- No backend skills required -- this increment is purely frontend (`apps/web`)
