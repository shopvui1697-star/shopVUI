---
increment: 0017-pwa-optimization
title: PWA Review and Optimization
status: completed
priority: P1
type: feature
created: 2026-03-15T00:00:00.000Z
structure: user-stories
test_mode: TDD
coverage_target: 80
---

# PWA Review and Optimization

## Problem Statement

The web app (apps/web) has a functional PWA setup with Serwist service worker, manifest, and offline support, but it has not been audited for caching correctness, install UX, or Lighthouse PWA compliance. The admin app (apps/admin) has no PWA support at all, meaning admin users cannot use it offline or install it as a standalone app. This increment audits and improves the web app PWA while adding full PWA support to the admin app.

## Goals

- Ensure web app service worker caching strategies are correct and performant
- Provide an install prompt so users can easily add the web app to their home screen
- Achieve a passing Lighthouse PWA audit score for the web app
- Add complete PWA support to the admin app with admin-appropriate caching
- Enable offline access for both apps

## User Stories

### US-001: Audit and Optimize Service Worker Caching Strategies
**Project**: shopvui
**As a** user
**I want** the service worker to use correct caching strategies for each resource type
**So that** I get fast load times without stale critical data

**Acceptance Criteria**:
- [x] **AC-US1-01**: Given the API caching config, when API requests are made, then a NetworkFirst strategy is used with a 10-second timeout fallback to cache
- [x] **AC-US1-02**: Given the precache manifest, when the app is built, then all critical app shell assets are included in the precache list
- [x] **AC-US1-03**: Given cached static assets (fonts, images), when they are requested, then a CacheFirst strategy is used with appropriate max-age expiration
- [x] **AC-US1-04**: Given a new deployment, when the service worker activates, then stale cache entries are purged and the new precache is installed

---

### US-002: Add Install Prompt UI (Add to Home Screen)
**Project**: shopvui
**As a** user
**I want** a visible install prompt or button to add the app to my home screen
**So that** I can quickly access the app like a native application

**Acceptance Criteria**:
- [x] **AC-US2-01**: Given the user visits the web app on a supported browser, when the beforeinstallprompt event fires, then an install banner or button is displayed
- [x] **AC-US2-02**: Given the install prompt is shown, when the user dismisses it, then it is not shown again for at least 7 days
- [x] **AC-US2-03**: Given the user clicks the install button, when the browser install dialog appears and is accepted, then the install UI is hidden and the app opens in standalone mode
- [x] **AC-US2-04**: Given the app is already installed, when the user visits the web app, then no install prompt is shown

---

### US-003: Lighthouse PWA Compliance
**Project**: shopvui
**As a** product owner
**I want** the web app to pass all Lighthouse PWA audit checks
**So that** the app meets modern PWA standards and provides the best user experience

**Acceptance Criteria**:
- [x] **AC-US3-01**: Given the manifest.json, when audited, then it includes all required fields: name, short_name, start_url, display, background_color, theme_color, icons (192 and 512), description, and screenshots
- [x] **AC-US3-02**: Given the service worker, when audited, then it responds with 200 when offline for the start_url
- [x] **AC-US3-03**: Given the HTML head, when audited, then it includes viewport meta tag, theme-color meta tag, and apple-touch-icon link
- [x] **AC-US3-04**: Given the app is served, when audited by Lighthouse, then all PWA audit items pass (installable, PWA-optimized)

---

### US-004: Admin App Manifest and Icons
**Project**: shopvui
**As an** admin user
**I want** the admin app to have a proper web app manifest with admin-specific branding
**So that** it can be installed as a standalone app with its own identity

**Acceptance Criteria**:
- [x] **AC-US4-01**: Given the admin app, when loaded, then a manifest.json is linked in the HTML head with name "ShopVui Admin", appropriate theme_color, and standalone display mode
- [x] **AC-US4-02**: Given the manifest, when inspected, then it includes icons at 192x192 and 512x512 sizes plus maskable variants
- [x] **AC-US4-03**: Given the admin manifest, when compared to the web manifest, then it uses a distinct theme_color and short_name to differentiate the two apps

---

### US-005: Admin App Service Worker with Serwist
**Project**: shopvui
**As an** admin user
**I want** the admin app to cache assets via a service worker
**So that** I get fast repeat loads and basic offline resilience

**Acceptance Criteria**:
- [x] **AC-US5-01**: Given the admin app, when built, then a Serwist-based service worker is generated with precaching of app shell assets
- [x] **AC-US5-02**: Given admin API requests, when made through the service worker, then a NetworkFirst strategy is used (admin data should always be fresh when online)
- [x] **AC-US5-03**: Given static assets (CSS, JS, fonts), when requested, then a CacheFirst strategy with versioned expiration is used
- [x] **AC-US5-04**: Given the admin next.config.ts, when configured, then @serwist/next is integrated and disabled in development mode

---

### US-006: Admin App PWA Meta Tags
**Project**: shopvui
**As an** admin user
**I want** the admin app layout to include all required PWA meta tags
**So that** the app is recognized as installable by browsers and renders correctly in standalone mode

**Acceptance Criteria**:
- [x] **AC-US6-01**: Given the admin layout.tsx, when rendered, then the HTML head includes theme-color meta tag matching the manifest
- [x] **AC-US6-02**: Given the admin layout.tsx, when rendered, then apple-web-app-capable and apple-web-app-status-bar-style meta tags are present
- [x] **AC-US6-03**: Given the admin layout.tsx, when rendered, then an apple-touch-icon link and manifest link are present

---

### US-007: Admin App Offline Page
**Project**: shopvui
**As an** admin user
**I want** a dedicated offline page when I lose connectivity
**So that** I see a helpful message instead of a browser error

**Acceptance Criteria**:
- [x] **AC-US7-01**: Given the admin user is offline, when navigating to any page, then the service worker serves a custom offline fallback page
- [x] **AC-US7-02**: Given the offline page is displayed, when rendered, then it shows the admin app branding, an explanation that the user is offline, and a retry button
- [x] **AC-US7-03**: Given the offline page, when the user clicks retry, then the page attempts to reload and navigates to the requested page if connectivity is restored

## Out of Scope

- Push notification support (separate increment)
- Background sync for offline form submissions
- Admin app install prompt UI (can be added later once PWA basics are stable)
- Web app cache size management or quota estimation UI
- Migration away from Serwist to another service worker library

## Technical Notes

- Web app already uses Serwist v9.5.6 with @serwist/next -- admin should use the same version for consistency
- Admin icons need to be generated (can reuse web app icon pipeline with different branding/colors)
- The web app offline page at /offline already supports i18n and dark mode -- admin offline page can follow a simpler pattern since it is internal-facing
- Both apps use Next.js, so the @serwist/next integration pattern is identical
- manifest.json screenshots field requires mobile and desktop variants (at least 1 each for Lighthouse)

## Success Metrics

- Web app passes 100% of Lighthouse PWA audit checks
- Admin app passes core Lighthouse PWA checks (installable, offline-capable)
- Service worker cache hit rate above 90% for static assets on repeat visits
- Install prompt shown to eligible users results in measurable install conversions
