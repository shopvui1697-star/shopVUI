# ADR-0004: Cookie-Based i18n with next-intl (No URL Routing)

## Status
Accepted

## Date
2026-03-14

## Context
ShopVUI's web storefront has ~120+ hardcoded English strings across 19+ component files. The primary audience is Vietnamese. We need to add Vietnamese/English language support without disrupting existing URL structure, SEO, or the Serwist PWA service worker integration.

### Options Considered

**Option A: next-intl with URL prefix routing (`/vi/products`, `/en/products`)**
- Pros: Better SEO per-locale, crawlable by search engines per language
- Cons: Breaks all existing URLs and internal links, requires redirect rules, complicates Serwist SW caching, adds route segment complexity to every page in App Router

**Option B: next-intl with cookie-based locale detection (no URL changes)**
- Pros: Zero URL disruption, no link breakage, simpler middleware, Serwist caching unaffected, faster to implement
- Cons: Search engines see only one URL per page (no per-locale indexing), locale not visible in URL

**Option C: react-i18next**
- Pros: Widely used, large ecosystem
- Cons: Not designed for Next.js App Router server components, requires additional plumbing for RSC support, no built-in middleware integration

## Decision
**Option B: next-intl with cookie-based locale detection.**

Rationale:
1. ShopVUI is a B2C e-commerce app targeting Vietnamese customers. SEO per-locale is low priority -- the store sells to a known market, not trying to rank in multiple languages.
2. The existing URL structure is already indexed and linked. Changing URLs for i18n would break bookmarks, shared links, and cached PWA pages.
3. next-intl has first-class Next.js 15 App Router support including `getTranslations()` for server components and `useTranslations()` for client components.
4. The Serwist service worker wraps `next.config.ts` -- adding `createNextIntlPlugin()` as an additional wrapper is straightforward without conflicting.
5. Cookie + localStorage dual persistence provides reliable cross-session locale recall without server-side session state.

## Implementation Details

### Locale Resolution Order
1. `NEXT_LOCALE` cookie (set by language switcher)
2. Fallback to `vi` (Vietnamese as default)
3. No Accept-Language header sniffing (out of scope per spec)

### Config Chaining
`next.config.ts` currently exports `withSerwist(options)(nextConfig)`. The new pattern will be:
```ts
export default withSerwist(options)(withNextIntl(nextConfig));
```
`createNextIntlPlugin()` returns a `withNextIntl` wrapper that composes with other wrappers.

### Translation File Structure
```
apps/web/messages/
  vi.json    # Vietnamese (default)
  en.json    # English
```
Keys organized by component/page namespace: `nav.*`, `footer.*`, `cart.*`, `checkout.*`, etc.

### Middleware
A new `next-intl` middleware in `apps/web/src/middleware.ts` reads the `NEXT_LOCALE` cookie and sets the locale for each request. Since no middleware file exists yet, this is a clean addition.

## Consequences
- `html lang` attribute must be dynamic based on active locale
- All 19+ component files need string extraction (mechanical but high-touch)
- `NextIntlClientProvider` must wrap the root layout with loaded messages
- Server components use `getTranslations()`, client components use `useTranslations()`
- Future languages can be added by creating a new JSON file and adding the locale to the config
- Admin panel (`apps/admin`) is explicitly excluded from this change
