---
increment: 0014-multi-language
title: Multi-Language Support (Vietnamese & English)
status: completed
priority: P1
type: feature
created: 2026-03-14T00:00:00.000Z
---

# Multi-Language Support (Vietnamese & English)

## Problem Statement

All UI text in the ShopVUI web storefront is hardcoded in English. Vietnamese customers, who are the primary audience, see an English-only interface. There is no way to switch languages, reducing accessibility for Vietnamese-speaking users and limiting the store's reach in the Vietnamese market.

## Goals

- Provide a fully translated Vietnamese UI as the default language
- Allow users to switch between Vietnamese and English at any time
- Persist language preference across sessions via cookie
- Translate all static UI chrome (~120+ strings across 19+ components) without affecting dynamic API content

## User Stories

### US-001: i18n Infrastructure Setup
**Project**: shopvui
**As a** developer
**I want** next-intl integrated into the Next.js 15 App Router
**So that** the codebase supports internationalized strings with cookie-based locale detection

**Acceptance Criteria**:
- [x] **AC-US1-01**: Given next-intl is installed, when the app boots, then NextIntlClientProvider wraps the root layout with the active locale's messages
- [x] **AC-US1-02**: Given translation files vi.json and en.json exist in apps/web/messages/, when a translation key is used via useTranslations(), then the correct string renders for the active locale
- [x] **AC-US1-03**: Given no NEXT_LOCALE cookie is set, when a user visits the site, then Vietnamese (vi) is used as the default locale
- [x] **AC-US1-04**: Given next.config.ts is updated with the next-intl plugin, when the app builds, then no build errors occur and i18n middleware reads the locale cookie without URL prefix routing

### US-002: Language Switcher UI
**Project**: shopvui
**As a** user
**I want** a language switcher in the navbar
**So that** I can toggle between Vietnamese and English at any time

**Acceptance Criteria**:
- [x] **AC-US2-01**: Given a logged-in user, when they open the profile dropdown in the navbar, then a language toggle option appears showing the current language
- [x] **AC-US2-02**: Given an anonymous user, when they view the navbar, then a globe icon button is visible that opens a language selector
- [x] **AC-US2-03**: Given a user switches from vi to en, when the page re-renders, then all UI text updates to English and a NEXT_LOCALE cookie is set to "en" with a localStorage mirror
- [x] **AC-US2-04**: Given a user closes the browser and returns, when the page loads, then the previously selected language is restored from the cookie

### US-003: Translate Navigation and Layout
**Project**: shopvui
**As a** user
**I want** the navbar, footer, search bar, error pages, and loading states translated
**So that** I can navigate the site entirely in my preferred language

**Acceptance Criteria**:
- [x] **AC-US3-01**: Given locale is vi, when the navbar renders, then all navigation links (Home, Products, Cart, Login, Account) display in Vietnamese
- [x] **AC-US3-02**: Given locale is en, when the footer renders, then all footer text including copyright and link labels display in English
- [x] **AC-US3-03**: Given locale is vi, when the search bar renders, then the placeholder text displays in Vietnamese
- [x] **AC-US3-04**: Given an error occurs, when the error page (error.tsx) or loading page (loading.tsx) renders, then the messages display in the active locale

### US-004: Translate Commerce Pages
**Project**: shopvui
**As a** shopper
**I want** the cart, checkout, login, product listing, and product detail pages translated
**So that** I can complete my shopping journey entirely in my preferred language

**Acceptance Criteria**:
- [x] **AC-US4-01**: Given locale is vi, when the cart page renders, then all labels (quantity, subtotal, remove, checkout button) display in Vietnamese
- [x] **AC-US4-02**: Given locale is vi, when the checkout page renders, then form labels, validation messages, and action buttons display in Vietnamese
- [x] **AC-US4-03**: Given locale is en, when the product listing page renders, then filter labels, sort options, and "Add to Cart" buttons display in English
- [x] **AC-US4-04**: Given locale is vi, when the product detail page renders, then UI chrome (stock badge, price tier labels, reviews heading) displays in Vietnamese while product name and description remain untranslated (dynamic API content)
- [x] **AC-US4-05**: Given locale is vi, when the login page renders, then the "Sign in with Google" button label and any helper text display in Vietnamese

### US-005: Translate Account and Reseller Pages
**Project**: shopvui
**As a** registered user or reseller
**I want** my account pages, wishlist, order history, and reseller portal translated
**So that** I can manage my account in my preferred language

**Acceptance Criteria**:
- [x] **AC-US5-01**: Given locale is vi, when the addresses page renders, then all form labels and action buttons display in Vietnamese
- [x] **AC-US5-02**: Given locale is vi, when the wishlist page renders, then the heading, empty-state message, and action buttons display in Vietnamese
- [x] **AC-US5-03**: Given locale is vi, when the order history page renders, then column headers, status labels, and pagination controls display in Vietnamese
- [x] **AC-US5-04**: Given locale is vi, when any reseller portal page (dashboard, coupons, commissions, profile) renders, then all UI labels and navigation display in Vietnamese

## Out of Scope

- Translation of dynamic content from the API (product names, descriptions, category names)
- Admin panel translation (apps/admin is not in scope for this increment)
- Right-to-left (RTL) language support
- Adding languages beyond Vietnamese and English
- Server-side locale detection from Accept-Language header (cookie-only approach)
- Translation management UI or CMS integration

## Technical Notes

### Dependencies
- `next-intl` package for Next.js 15 App Router i18n
- Existing Next.js middleware (apps/web/src/middleware.ts) needs modification for locale cookie reading

### Constraints
- No URL prefix routing -- locale is stored in NEXT_LOCALE cookie only, URLs remain unchanged
- Both server components and client components must access translations (useTranslations hook for client, getTranslations for server)
- Translation JSON files should use nested keys organized by page/component for maintainability

### Architecture Decisions
- Cookie-based locale over URL-based: preserves existing URL structure, avoids breaking links and SEO changes
- localStorage mirror of cookie: provides faster client-side access and acts as fallback

## Success Metrics

- 100% of static UI strings across the 19+ component files are extracted to translation files
- Language switcher is accessible to both logged-in and anonymous users
- Language preference persists across page refreshes and browser sessions
- No regressions in existing functionality -- all existing tests continue to pass
