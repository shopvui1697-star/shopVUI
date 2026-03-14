---
increment: 0014-multi-language
title: "Multi-Language Support (Vietnamese & English)"
status: active
by_user_story:
  US-001: [T-001, T-002, T-003]
  US-002: [T-004, T-005]
  US-003: [T-006, T-007]
  US-004: [T-008, T-009, T-010]
  US-005: [T-011, T-012]
---

# Tasks: Multi-Language Support (Vietnamese & English)

---

## User Story: US-001 - i18n Infrastructure Setup

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US1-04
**Tasks**: 3 total, all completed

### T-001: Install next-intl and create i18n config files

**User Story**: US-001
**Satisfies ACs**: AC-US1-02, AC-US1-03, AC-US1-04
**Status**: [x] completed

**Test Plan**:
- **Given** `next-intl` is added to `apps/web/package.json`
- **When** `src/i18n/config.ts` and `src/i18n/request.ts` are created
- **Then** `locales = ['vi', 'en']`, `defaultLocale = 'vi'`, and `getRequestConfig()` reads the `NEXT_LOCALE` cookie falling back to `'vi'`

**Test Cases**:
1. **Unit**: `apps/web/src/__tests__/i18n-config.test.ts`
   - `testDefaultLocale()`: assert `defaultLocale === 'vi'`
   - `testSupportedLocales()`: assert locales array contains `'vi'` and `'en'`
   - **Coverage Target**: 90%

2. **Unit**: `apps/web/src/__tests__/i18n-request.test.ts`
   - `testNoCookieFallsBackToVi()`: mock cookies with no NEXT_LOCALE, assert locale `'vi'` is returned
   - `testValidCookieReturnsLocale()`: mock cookie `NEXT_LOCALE=en`, assert locale `'en'` is returned
   - `testInvalidCookieFallsBackToVi()`: mock cookie `NEXT_LOCALE=fr`, assert locale `'vi'` is returned
   - **Coverage Target**: 95%

**Implementation**:
1. `pnpm add next-intl` in `apps/web`
2. Create `apps/web/src/i18n/config.ts` — export `locales`, `defaultLocale`, `Locale` type
3. Create `apps/web/src/i18n/request.ts` — `getRequestConfig()` reads cookie via `next/headers`, loads messages JSON
4. Create skeleton `apps/web/messages/vi.json` and `apps/web/messages/en.json` with a `common.test` key to verify wiring

---

### T-002: Update next.config.ts and middleware for next-intl

**User Story**: US-001
**Satisfies ACs**: AC-US1-04
**Status**: [x] completed

**Test Plan**:
- **Given** `next.config.ts` is updated to chain `withNextIntl` around base config and `withSerwist` around the result
- **When** `pnpm build` runs in `apps/web`
- **Then** the build succeeds with no errors and the next-intl middleware intercepts requests to read the locale cookie

**Test Cases**:
1. **Build verification**: `pnpm --filter web build`
   - Must complete with exit code 0
   - No "Module not found" or "Type error" output
2. **Unit**: `apps/web/src/__tests__/middleware.test.ts`
   - `testMatcherExcludesStaticAssets()`: assert matcher pattern excludes `/_next/`, `/api/`, `/sw.js`
   - `testMatcherIncludesPages()`: assert matcher matches `/`, `/products`, `/cart`
   - **Coverage Target**: 85%

**Implementation**:
1. Update `apps/web/next.config.ts`: import `createNextIntlPlugin`, chain as `withSerwist(...)(withNextIntl(nextConfig))`
2. Create `apps/web/src/middleware.ts`: use `createMiddleware` from `next-intl/middleware` with `localePrefix: 'never'`, `localeDetection: false`, `defaultLocale: 'vi'`
3. Set matcher to exclude `/_next`, static assets, `/api`, `/sw.js`
4. Run `pnpm --filter web build` to verify no errors

---

### T-003: Update root layout with NextIntlClientProvider

**User Story**: US-001
**Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US1-03
**Status**: [x] completed

**Test Plan**:
- **Given** `apps/web/src/app/layout.tsx` is made async and calls `getLocale()` + `getMessages()`
- **When** the root layout renders with no NEXT_LOCALE cookie
- **Then** `<html lang="vi">` is set and `NextIntlClientProvider` wraps children with the Vietnamese messages

**Test Cases**:
1. **Integration**: `apps/web/src/__tests__/root-layout.test.tsx`
   - `testDefaultLocaleIsVi()`: render layout without locale cookie, assert `html` element has `lang="vi"`
   - `testEnLocaleFromCookie()`: render layout with `NEXT_LOCALE=en` cookie, assert `html` has `lang="en"`
   - `testProviderReceivesMessages()`: assert `NextIntlClientProvider` receives non-empty messages object
   - **Coverage Target**: 90%

**Implementation**:
1. Update `apps/web/src/app/layout.tsx`:
   - Make `RootLayout` async
   - Import `getLocale`, `getMessages` from `next-intl/server`
   - Set `<html lang={locale}>` dynamically (replace hardcoded `"en"`)
   - Wrap children with `<NextIntlClientProvider locale={locale} messages={messages}>` as outermost provider (outside `AuthProvider`)

---

## User Story: US-002 - Language Switcher UI

**Linked ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04
**Tasks**: 2 total, all completed

### T-004: Create LanguageSwitcher component

**User Story**: US-002
**Satisfies ACs**: AC-US2-03, AC-US2-04
**Status**: [x] completed

**Test Plan**:
- **Given** the `LanguageSwitcher` component mounts with current locale `'vi'`
- **When** the user clicks the toggle button
- **Then** `NEXT_LOCALE` cookie is set to `'en'`, `localStorage.setItem('NEXT_LOCALE', 'en')` is called, and `router.refresh()` is called

**Test Cases**:
1. **Unit**: `apps/web/src/__tests__/LanguageSwitcher.test.tsx`
   - `testDisplaysCurrentLocale()`: render with `useLocale` returning `'vi'`, assert label shows Vietnamese indicator
   - `testSetsCookieOnToggle()`: click toggle, assert `document.cookie` includes `NEXT_LOCALE=en`
   - `testMirrorsToLocalStorage()`: click toggle, assert `localStorage.setItem` called with `('NEXT_LOCALE', 'en')`
   - `testCallsRouterRefresh()`: click toggle, assert `router.refresh()` was called
   - `testPersistenceOnReload()`: set cookie to `'en'`, re-render, assert label shows English indicator
   - **Coverage Target**: 95%

**Implementation**:
1. Create `apps/web/src/components/LanguageSwitcher.tsx`
2. Accept `variant: 'dropdown-item' | 'standalone'` prop
3. Use `useLocale()` from `next-intl` to read current locale
4. On toggle: compute next locale, set cookie `NEXT_LOCALE` (`path=/; max-age=31536000; SameSite=Lax`), mirror to localStorage, call `router.refresh()`
5. `dropdown-item` variant: renders as `<li>` with language label text (e.g. "Tiếng Việt / English")
6. `standalone` variant: renders as globe icon `<button>` showing current locale abbreviation

---

### T-005: Integrate LanguageSwitcher into Navbar

**User Story**: US-002
**Satisfies ACs**: AC-US2-01, AC-US2-02
**Status**: [x] completed

**Test Plan**:
- **Given** the Navbar renders for an authenticated user
- **When** the user opens the profile dropdown
- **Then** a language toggle item appears in the dropdown menu
- **Given** the Navbar renders for an anonymous user
- **When** the navbar is displayed
- **Then** a globe icon button is visible next to the Login link

**Test Cases**:
1. **Integration**: `apps/web/src/__tests__/navbar.test.tsx`
   - `testAuthenticatedDropdownContainsSwitcher()`: render Navbar with auth session, open dropdown, assert `LanguageSwitcher` with `variant="dropdown-item"` is present
   - `testAnonymousNavbarShowsGlobeButton()`: render Navbar without session, assert `LanguageSwitcher` with `variant="standalone"` is visible
   - **Coverage Target**: 85%

**Implementation**:
1. Update `apps/web/src/components/layout/navbar/index.tsx`:
   - Import `LanguageSwitcher`
   - In authenticated user dropdown: add `<LanguageSwitcher variant="dropdown-item" />` between menu links and "Sign out" divider
   - In anonymous section: add `<LanguageSwitcher variant="standalone" />` adjacent to Login link

---

## User Story: US-003 - Translate Navigation and Layout

**Linked ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04
**Tasks**: 2 total, all completed

### T-006: Extract navbar, footer, and search strings

**User Story**: US-003
**Satisfies ACs**: AC-US3-01, AC-US3-02, AC-US3-03
**Status**: [x] completed

**Test Plan**:
- **Given** `nav.*` and `footer.*` keys exist in both `vi.json` and `en.json`
- **When** the Navbar renders with locale `'vi'`
- **Then** navigation links display Vietnamese labels
- **When** the Footer renders with locale `'en'`
- **Then** all footer text displays in English

**Test Cases**:
1. **Integration**: `apps/web/src/__tests__/nav-translations.test.tsx`
   - `testNavLinksVietnamese()`: render Navbar with `vi` locale provider, assert "Sản phẩm" visible (not "Products")
   - `testNavLinksEnglish()`: render Navbar with `en` locale provider, assert "Products" visible
   - `testSearchPlaceholderVi()`: render search component with `vi`, assert placeholder is Vietnamese string
   - `testFooterEnglish()`: render Footer with `en` locale provider, assert English link labels visible
   - **Coverage Target**: 85%

**Implementation**:
1. Add `nav` namespace keys to `apps/web/messages/vi.json` and `en.json` (~10 keys: Home, Products, Cart, Login, Account, Sign out, searchPlaceholder)
2. Add `footer` namespace keys to both files (~5 keys: link labels, copyright)
3. Update `apps/web/src/components/layout/navbar/index.tsx`: replace hardcoded strings with `useTranslations('nav')` calls
4. Update `apps/web/src/components/layout/navbar/search.tsx`: replace placeholder with `t('nav.searchPlaceholder')` — pass as prop to `SearchBar` from `@shopvui/ui`
5. Update `apps/web/src/components/layout/footer.tsx`: replace hardcoded strings with `useTranslations('footer')` calls

---

### T-007: Extract error and loading page strings

**User Story**: US-003
**Satisfies ACs**: AC-US3-04
**Status**: [x] completed

**Test Plan**:
- **Given** `common.*` keys exist in both JSON files
- **When** the root `error.tsx` renders with locale `'vi'`
- **Then** the error message and retry button label display in Vietnamese
- **When** the root `loading.tsx` renders with locale `'vi'`
- **Then** the loading text displays in Vietnamese

**Test Cases**:
1. **Unit**: `apps/web/src/__tests__/error-page.test.tsx`
   - `testErrorPageVietnamese()`: render error.tsx wrapped in `NextIntlClientProvider` with `vi` messages, assert Vietnamese error message text
   - `testLoadingPageVietnamese()`: render loading.tsx with `vi` messages, assert Vietnamese loading text
   - **Coverage Target**: 85%

**Implementation**:
1. Add `common` namespace keys to both JSON files (~8 keys: errorTitle, errorMessage, retryButton, loadingText, backToHome)
2. Update `apps/web/src/app/error.tsx`: add `'use client'`, use `useTranslations('common')`
3. Update `apps/web/src/app/loading.tsx`: use `useTranslations('common')`
4. Check and update route-level `error.tsx` / `loading.tsx` under `products/`, `cart/`, `checkout/`, `orders/` for any hardcoded strings

---

## User Story: US-004 - Translate Commerce Pages

**Linked ACs**: AC-US4-01, AC-US4-02, AC-US4-03, AC-US4-04, AC-US4-05
**Tasks**: 3 total, all completed

### T-008: Extract cart and checkout strings

**User Story**: US-004
**Satisfies ACs**: AC-US4-01, AC-US4-02
**Status**: [x] completed

**Test Plan**:
- **Given** `cart.*` and `checkout.*` keys exist in both JSON files
- **When** the cart page renders with locale `'vi'`
- **Then** quantity label, subtotal, remove button, and checkout CTA all display in Vietnamese
- **When** the checkout page renders with locale `'vi'`
- **Then** address form labels, payment method labels, and order summary labels display in Vietnamese

**Test Cases**:
1. **Integration**: `apps/web/src/__tests__/cart-translations.test.tsx`
   - `testCartLabelsVi()`: render cart page with `vi` locale, assert Vietnamese labels for quantity/subtotal/checkout button
   - `testCartLabelsEn()`: render cart page with `en` locale, assert English labels
   - `testCartModalLabelsVi()`: render cart-modal with `vi`, assert Vietnamese strings
   - **Coverage Target**: 85%

2. **Integration**: `apps/web/src/__tests__/checkout-translations.test.tsx`
   - `testCheckoutFormLabelsVi()`: render checkout page with `vi` locale, assert Vietnamese form field labels
   - `testCheckoutValidationMessagesVi()`: simulate empty form submit with `vi`, assert Vietnamese validation messages
   - **Coverage Target**: 85%

**Implementation**:
1. Add `cart` namespace keys to both JSON files (~15 keys: quantity, subtotal, remove, emptyCart, checkoutButton, cart-modal strings)
2. Add `checkout` namespace keys to both JSON files (~30 keys: address fields, payment methods, order summary, coupon, placeOrderButton, validation messages)
3. Update `apps/web/src/app/cart/page.tsx`: use `getTranslations('cart')` (server component)
4. Update `apps/web/src/components/cart/cart-modal.tsx`: use `useTranslations('cart')` (client component)
5. Update `apps/web/src/app/checkout/page.tsx`: use `useTranslations('checkout')` (client component)

---

### T-009: Extract product listing, product detail, and login strings

**User Story**: US-004
**Satisfies ACs**: AC-US4-03, AC-US4-04, AC-US4-05
**Status**: [x] completed

**Test Plan**:
- **Given** `products.*` and `login.*` keys exist in both JSON files
- **When** the products listing page renders with locale `'en'`
- **Then** filter labels, sort options, and "Add to Cart" button display in English
- **When** the product detail page renders with locale `'vi'`
- **Then** UI chrome (stock badge label, price tier table heading) displays in Vietnamese while product name remains unchanged (dynamic API content)

**Test Cases**:
1. **Integration**: `apps/web/src/__tests__/products-translations.test.tsx`
   - `testProductListingEnglish()`: render products page with `en` locale, assert English "Add to Cart" button text
   - `testProductDetailUiChromeVi()`: render product detail with `vi`, assert Vietnamese stock label text
   - `testProductDetailDynamicContentUntranslated()`: render product detail, assert `product.name` from API mock renders as-is regardless of locale
   - `testLoginPageVi()`: render login page with `vi`, assert Vietnamese "Sign in with Google" label
   - **Coverage Target**: 85%

**Implementation**:
1. Add `products` namespace keys to both JSON files (~15 keys: filter labels, sort, addToCart, inStock, outOfStock, priceTiersHeading, noProducts empty state)
2. Add `login` namespace keys to both JSON files (~5 keys: signInWithGoogle, pageHeading, subtitle)
3. Update `apps/web/src/app/products/page.tsx`: use `getTranslations('products')` for server-rendered UI chrome
4. Update `apps/web/src/app/products/search-filter.tsx`: use `useTranslations('products')` for client-side filter labels
5. Update `apps/web/src/app/products/[id]/page.tsx`: pass translated strings as props to `StockBadge` and `PriceTierTable` (do NOT use `useTranslations` inside `@shopvui/ui` components)
6. Update `apps/web/src/components/AddToCartButton.tsx`: use `useTranslations('products')`
7. Update `apps/web/src/app/login/page.tsx`: use `useTranslations('login')`

---

### T-010: Extract orders page strings

**User Story**: US-004
**Satisfies ACs**: AC-US4-03
**Status**: [x] completed

**Test Plan**:
- **Given** `orders.*` keys exist in both JSON files
- **When** the order history page renders with locale `'vi'`
- **Then** column headers, status labels, and pagination controls display in Vietnamese

**Test Cases**:
1. **Integration**: `apps/web/src/__tests__/orders-translations.test.tsx`
   - `testOrderHistoryHeadersVi()`: render orders page with `vi` locale, assert Vietnamese column header text
   - `testOrderStatusBadgeVi()`: render `OrderStatusBadge` with `vi` locale and status `'pending'`, assert Vietnamese status label
   - `testOrderDetailLabelsVi()`: render order detail page with `vi`, assert Vietnamese section headings
   - **Coverage Target**: 85%

**Implementation**:
1. Add `orders` namespace keys to both JSON files (~10 keys: column headers, status labels for each order state, pagination, orderNumberPrefix, emptyState)
2. Update `apps/web/src/app/orders/page.tsx`: use `getTranslations('orders')` for server component headers
3. Update `apps/web/src/app/orders/[orderNumber]/page.tsx`: use `getTranslations('orders')` for UI labels
4. Update `apps/web/src/components/OrderStatusBadge.tsx`: accept translated label as prop; caller page passes `t('orders.status.pending')` etc.

---

## User Story: US-005 - Translate Account and Reseller Pages

**Linked ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04
**Tasks**: 2 total, all completed

### T-011: Extract account page strings (addresses and wishlist)

**User Story**: US-005
**Satisfies ACs**: AC-US5-01, AC-US5-02
**Status**: [x] completed

**Test Plan**:
- **Given** `account.*` keys exist in both JSON files
- **When** the addresses page renders with locale `'vi'`
- **Then** all form labels and action buttons display in Vietnamese
- **When** the wishlist page renders with locale `'vi'` with no items
- **Then** the empty-state message displays in Vietnamese

**Test Cases**:
1. **Integration**: `apps/web/src/__tests__/account-translations.test.tsx`
   - `testAddressesFormLabelsVi()`: render addresses page with `vi` locale, assert Vietnamese form labels (e.g. "Đường", "Thành phố")
   - `testWishlistEmptyStateVi()`: render wishlist page with `vi` and empty list, assert Vietnamese empty-state message
   - `testWishlistItemActionsVi()`: render wishlist page with `vi` and items present, assert Vietnamese remove button label
   - **Coverage Target**: 85%

**Implementation**:
1. Add `account` namespace keys to both JSON files (~10 keys: address form labels — street, city, province, zipCode; add/save/delete buttons; wishlistHeading, emptyWishlist, removeFromWishlist)
2. Update `apps/web/src/app/account/addresses/page.tsx`: use `useTranslations('account')`
3. Update `apps/web/src/app/account/wishlist/page.tsx`: use `useTranslations('account')`
4. Update `apps/web/src/components/WishlistButton.tsx`: accept translated `ariaLabel` prop; caller page provides `t('account.removeFromWishlist')`

---

### T-012: Extract reseller portal strings and run final audit

**User Story**: US-005
**Satisfies ACs**: AC-US5-03, AC-US5-04
**Status**: [x] completed

**Test Plan**:
- **Given** `reseller.*` and `orders.*` namespaces are fully populated
- **When** any reseller portal page renders with locale `'vi'`
- **Then** all navigation labels, table headers, and action buttons display in Vietnamese
- **When** a final grep audit runs across all component files
- **Then** zero significant hardcoded UI strings remain outside the JSON files

**Test Cases**:
1. **Integration**: `apps/web/src/__tests__/reseller-translations.test.tsx`
   - `testResellerDashboardVi()`: render dashboard page with `vi` locale, assert Vietnamese heading and stat labels
   - `testResellerCouponsVi()`: render coupons page with `vi`, assert Vietnamese table headers
   - `testResellerCommissionsVi()`: render commissions page with `vi`, assert Vietnamese column labels
   - **Coverage Target**: 85%

2. **Regression**: Full test suite
   - `pnpm --filter web test run` must pass with 0 failures
   - Existing test count must not decrease

**Implementation**:
1. Add `reseller` namespace keys to both JSON files (~25 keys: dashboard stats, coupon table headers, commission statuses, profile labels, navigation items, register/login labels)
2. Update all reseller portal pages: `dashboard/page.tsx`, `coupons/page.tsx`, `commissions/page.tsx`, `profile/page.tsx`, `login/page.tsx`, `register/page.tsx`, `orders/page.tsx`, `layout.tsx`
3. Run grep audit: search for hardcoded English strings in component files outside JSON, resolve any remaining occurrences
4. Run `pnpm --filter web test run` — all existing tests must pass
5. Run `pnpm --filter web build` — final build verification confirms AC-US1-04 end-to-end
