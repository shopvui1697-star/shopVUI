---
increment: 0017-pwa-optimization
title: "PWA Review and Optimization"
generated_by: sw:test-aware-planner
test_mode: TDD
coverage_target: 80
by_user_story:
  US-001: [T-001]
  US-002: [T-002, T-003]
  US-003: [T-004]
  US-004: [T-005]
  US-005: [T-006, T-007]
  US-006: [T-008]
  US-007: [T-009]
total_tasks: 9
completed_tasks: 9
---

# Tasks: PWA Review and Optimization

## User Story: US-001 - Audit and Optimize Service Worker Caching Strategies

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US1-04
**Domain**: web-frontend
**Tasks**: 1 total, 1 completed

### T-001: Verify Web App Service Worker Caching Strategies

**User Story**: US-001
**Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US1-04
**Domain**: web-frontend
**Status**: [x] completed

**Test Plan**:
- **Given** the web app sw.ts uses `defaultCache` from `@serwist/next/worker`
- **When** the service worker configuration is inspected and tested
- **Then** all four AC criteria are confirmed satisfied by the existing implementation

**Test Cases**:
1. **Unit**: `apps/web/src/app/__tests__/sw.test.ts`
   - testPrecacheManifestIsInjected(): Assert `self.__SW_MANIFEST` is referenced in precacheEntries (AC-US1-02)
   - testSkipWaitingIsTrue(): Assert `skipWaiting: true` in Serwist constructor (AC-US1-04)
   - testClientsClaimIsTrue(): Assert `clientsClaim: true` in Serwist constructor (AC-US1-04)
   - testDefaultCacheUsed(): Assert `runtimeCaching: defaultCache` is configured (AC-US1-01, AC-US1-03)
   - **Coverage Target**: 85%

**Implementation**:
1. Read `apps/web/src/app/sw.ts` to confirm current configuration
2. Write unit tests asserting `skipWaiting`, `clientsClaim`, `precacheEntries`, and `runtimeCaching` properties
3. Run tests: `npx vitest run apps/web/src/app/__tests__/sw.test.ts`
4. No production code changes expected — document that defaultCache satisfies ACs per plan.md AD-1

---

## User Story: US-002 - Add Install Prompt UI (Add to Home Screen)

**Linked ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04
**Domain**: web-frontend
**Tasks**: 2 total, 2 completed

### T-002: Implement InstallPrompt Component

**User Story**: US-002
**Satisfies ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04
**Domain**: web-frontend
**Status**: [x] completed

**Test Plan**:
- **Given** a user visits the web app on a browser that supports beforeinstallprompt
- **When** the event fires and the app is not already installed and not dismissed within 7 days
- **Then** an install banner is shown; dismissing it hides it for 7 days; accepting it triggers the browser install dialog

**Test Cases**:
1. **Unit**: `apps/web/src/components/__tests__/InstallPrompt.test.tsx`
   - testShowsBannerWhenBeforeInstallPromptFires(): Mock event, assert banner visible (AC-US2-01)
   - testDoesNotShowWhenDismissedWithin7Days(): Set localStorage ts within 7 days, assert banner hidden (AC-US2-02)
   - testShowsAgainAfter7Days(): Set localStorage ts older than 7 days, assert banner visible (AC-US2-02)
   - testHidesBannerAfterInstallAccepted(): Simulate prompt outcome "accepted", assert banner removed (AC-US2-03)
   - testDoesNotShowWhenAlreadyInstalled(): Mock matchMedia standalone=true, assert null render (AC-US2-04)
   - testHandleDismissSetsLocalStorageTimestamp(): Click dismiss, assert `shopvui-install-dismiss-ts` key set (AC-US2-02)
   - **Coverage Target**: 90%

**Implementation**:
1. Write failing tests first (TDD red phase)
2. Create `apps/web/src/components/InstallPrompt.tsx` as `'use client'` component
3. Add state: `showBanner` (boolean), `deferredPrompt` (ref for BeforeInstallPromptEvent)
4. Add `useEffect` to listen for `beforeinstallprompt` event; check `isDismissed()` and `isInstalled()` before setting showBanner
5. `isDismissed()`: read `localStorage.getItem('shopvui-install-dismiss-ts')`, return true if timestamp < 7 days ago
6. `isInstalled()`: return `window.matchMedia('(display-mode: standalone)').matches`
7. `handleInstall()`: call `deferredPrompt.current.prompt()`, await outcome, set showBanner(false)
8. `handleDismiss()`: set localStorage timestamp to `Date.now()`, set showBanner(false)
9. Listen for `appinstalled` event to set showBanner(false)
10. Render floating dismissible banner with install button and X dismiss button; return null if !showBanner
11. Run tests: `npx vitest run apps/web/src/components/__tests__/InstallPrompt.test.tsx`

### T-003: Add InstallPrompt to Web App Root Layout

**User Story**: US-002
**Satisfies ACs**: AC-US2-01
**Domain**: web-frontend
**Status**: [x] completed

**Test Plan**:
- **Given** the web app root layout renders
- **When** the component tree is inspected
- **Then** the InstallPrompt component is present in the layout output

**Test Cases**:
1. **Unit**: `apps/web/src/app/__tests__/layout-install-prompt.test.tsx`
   - testInstallPromptIsMountedInLayout(): Render layout, assert InstallPrompt component is in the output (AC-US2-01)
   - **Coverage Target**: 80%

**Implementation**:
1. Open `apps/web/src/app/layout.tsx`
2. Import `InstallPrompt` from `@/components/InstallPrompt`
3. Add `<InstallPrompt />` inside the body, positioned after `<Navbar />`
4. Run tests: `npx vitest run apps/web/src/app/__tests__/layout-install-prompt.test.tsx`

---

## User Story: US-003 - Lighthouse PWA Compliance

**Linked ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04
**Domain**: web-frontend
**Tasks**: 1 total, 1 completed

### T-004: Complete Web App Manifest and Verify PWA Compliance

**User Story**: US-003
**Satisfies ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04
**Domain**: web-frontend
**Status**: [x] completed

**Test Plan**:
- **Given** the web app manifest.json and layout meta tags
- **When** they are audited against Lighthouse PWA requirements
- **Then** all required fields, screenshots, meta tags, and offline capability are confirmed present

**Test Cases**:
1. **Unit**: `apps/web/src/app/__tests__/pwa-compliance.test.ts`
   - testManifestHasAllRequiredFields(): Read manifest.json, assert name, short_name, start_url, display, background_color, theme_color, icons, description, id (AC-US3-01)
   - testManifestIconsHave192And512(): Assert icons array contains entries for 192x192 and 512x512 (AC-US3-01)
   - testManifestHasScreenshotsWithFormFactor(): Assert screenshots array has mobile (narrow) and desktop (wide) entries (AC-US3-01)
   - testLayoutHasThemeColorMeta(): Assert layout metadata includes themeColor matching manifest (AC-US3-03)
   - testLayoutHasAppleTouchIcon(): Assert layout metadata includes apple-touch-icon link (AC-US3-03)
   - testLayoutHasViewportMeta(): Assert viewport metadata is configured in layout (AC-US3-03)
   - **Coverage Target**: 85%

**Implementation**:
1. Open `apps/web/public/manifest.json`
2. Add `"id": "/"` field for stable app identity
3. Add `"screenshots"` array: one mobile entry `{ "src": "/screenshot-mobile.png", "type": "image/png", "sizes": "390x844", "form_factor": "narrow" }` and one desktop entry `{ "src": "/screenshot-desktop.png", "type": "image/png", "sizes": "1280x720", "form_factor": "wide" }`
4. Create placeholder PNGs at `apps/web/public/screenshot-mobile.png` and `apps/web/public/screenshot-desktop.png`
5. Verify `apps/web/src/app/layout.tsx` already has viewport, themeColor, and apple-touch-icon (no changes expected per plan.md)
6. Write compliance tests
7. Run tests: `npx vitest run apps/web/src/app/__tests__/pwa-compliance.test.ts`

---

## User Story: US-004 - Admin App Manifest and Icons

**Linked ACs**: AC-US4-01, AC-US4-02, AC-US4-03
**Domain**: admin-frontend
**Tasks**: 1 total, 0 completed

### T-005: Create Admin App Manifest and Icon Assets

**User Story**: US-004
**Satisfies ACs**: AC-US4-01, AC-US4-02, AC-US4-03
**Domain**: admin-frontend
**Status**: [x] completed

**Test Plan**:
- **Given** the admin app public directory with manifest.json and icon files
- **When** the manifest is read and icon files are checked
- **Then** admin-specific branding is used that is distinct from the web app

**Test Cases**:
1. **Unit**: `apps/admin/src/__tests__/pwa-manifest.test.ts`
   - testManifestNameIsShopVuiAdmin(): Assert name is "ShopVui Admin" (AC-US4-01)
   - testManifestDisplayIsStandalone(): Assert display is "standalone" (AC-US4-01)
   - testManifestThemeColorIsSlate(): Assert theme_color is "#1e293b", not web app "#4f46e5" (AC-US4-03)
   - testManifestShortNameIsDistinct(): Assert short_name is "SV Admin", not "ShopVui" (AC-US4-03)
   - testManifestHas192And512Icons(): Assert icons array has 192x192 and 512x512 entries (AC-US4-02)
   - testManifestHasMaskableIcon(): Assert at least one icon entry has `"purpose": "maskable"` (AC-US4-02)
   - **Coverage Target**: 85%

**Implementation**:
1. Create `apps/admin/public/` directory
2. Create `apps/admin/public/manifest.json`: `{ "name": "ShopVui Admin", "short_name": "SV Admin", "start_url": "/", "display": "standalone", "background_color": "#0f172a", "theme_color": "#1e293b", "description": "ShopVui Admin Dashboard", "icons": [{ "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" }, { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }, { "src": "/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" }, { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }] }`
3. Copy web app icons as initial placeholders: `cp apps/web/public/icon-*.png apps/admin/public/` and `cp apps/web/public/apple-touch-icon.png apps/admin/public/` and `cp apps/web/public/favicon.ico apps/admin/public/` (note for design team to create distinct admin icons)
4. Write tests asserting manifest branding fields
5. Run tests: `npx vitest run apps/admin/src/__tests__/pwa-manifest.test.ts`

---

## User Story: US-005 - Admin App Service Worker with Serwist

**Linked ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04
**Domain**: admin-frontend
**Tasks**: 2 total, 0 completed

### T-006: Install Serwist Dependencies and Configure Admin next.config.ts

**User Story**: US-005
**Satisfies ACs**: AC-US5-04
**Domain**: admin-frontend
**Status**: [x] completed

**Test Plan**:
- **Given** the admin app package.json and next.config.ts
- **When** the configuration is inspected
- **Then** Serwist packages are installed and withSerwist wraps the config with development disabled

**Test Cases**:
1. **Unit**: `apps/admin/src/__tests__/sw-config.test.ts`
   - testPackageJsonHasSerwistNext(): Read package.json, assert @serwist/next is a dependency (AC-US5-04)
   - testPackageJsonHasSerwist(): Assert serwist is a dependency (AC-US5-04)
   - testNextConfigExportsFunction(): Assert next.config.ts default export is a function or wrapped config (AC-US5-04)
   - **Coverage Target**: 80%

**Implementation**:
1. Add to `apps/admin/package.json` dependencies: `"@serwist/next": "^9.5.6"` and `"serwist": "^9.5.6"`
2. Run `pnpm install` from workspace root
3. Update `apps/admin/next.config.ts`: add `import withSerwist from '@serwist/next'` at top, wrap the export: `export default withSerwist({ swSrc: 'src/app/sw.ts', swDest: 'public/sw.js', disable: process.env.NODE_ENV === 'development' })(nextConfig)`
4. Write tests asserting package.json entries and config shape
5. Run tests: `npx vitest run apps/admin/src/__tests__/sw-config.test.ts`

### T-007: Create Admin App Service Worker

**User Story**: US-005
**Satisfies ACs**: AC-US5-01, AC-US5-02, AC-US5-03
**Domain**: admin-frontend
**Status**: [x] completed

**Test Plan**:
- **Given** the admin app sw.ts is created with Serwist and defaultCache
- **When** the service worker configuration is inspected
- **Then** precaching, NetworkFirst for API, CacheFirst for static assets, and offline fallback are all configured

**Test Cases**:
1. **Unit**: `apps/admin/src/app/__tests__/sw.test.ts`
   - testPrecacheManifestReferenced(): Assert `self.__SW_MANIFEST` is used as precacheEntries (AC-US5-01)
   - testDefaultCacheConfigured(): Assert `runtimeCaching: defaultCache` is set (AC-US5-01)
   - testSkipWaitingTrue(): Assert skipWaiting is true (AC-US5-01)
   - testClientsClaimTrue(): Assert clientsClaim is true (AC-US5-01)
   - testOfflineFallbackForDocuments(): Assert fallbacks has entry for document destination pointing to `/offline` (AC-US5-01)
   - **Coverage Target**: 85%

**Implementation**:
1. Write failing tests first (TDD red phase)
2. Create `apps/admin/src/app/sw.ts` mirroring `apps/web/src/app/sw.ts` structure
3. Include global type declarations for `self.__SW_MANIFEST` and `SerwistGlobalConfig`
4. Configure Serwist: `precacheEntries: self.__SW_MANIFEST`, `skipWaiting: true`, `clientsClaim: true`, `navigationPreload: true`, `runtimeCaching: defaultCache`
5. Add offline fallback: `fallbacks: { entries: [{ url: '/offline', matcher({ request }) { return request.destination === 'document'; } }] }`
6. Call `serwist.addEventListeners()`
7. Run tests: `npx vitest run apps/admin/src/app/__tests__/sw.test.ts`

---

## User Story: US-006 - Admin App PWA Meta Tags

**Linked ACs**: AC-US6-01, AC-US6-02, AC-US6-03
**Domain**: admin-frontend
**Tasks**: 1 total, 0 completed

### T-008: Add PWA Metadata to Admin Layout

**User Story**: US-006
**Satisfies ACs**: AC-US6-01, AC-US6-02, AC-US6-03
**Domain**: admin-frontend
**Status**: [x] completed

**Test Plan**:
- **Given** the admin layout.tsx metadata export
- **When** the rendered HTML head is inspected
- **Then** theme-color, apple web app capability tags, manifest link, and apple-touch-icon are all present

**Test Cases**:
1. **Unit**: `apps/admin/src/app/__tests__/layout.test.tsx`
   - testLayoutHasThemeColor(): Assert metadata.themeColor is "#1e293b" (AC-US6-01)
   - testLayoutHasAppleWebAppCapable(): Assert metadata.appleWebApp.capable is true (AC-US6-02)
   - testLayoutHasAppleWebAppStatusBarStyle(): Assert metadata.appleWebApp.statusBarStyle is set (AC-US6-02)
   - testLayoutHasManifestLink(): Assert metadata.manifest is "/manifest.json" (AC-US6-03)
   - testLayoutHasAppleTouchIconLink(): Assert metadata.icons.apple includes apple-touch-icon path (AC-US6-03)
   - **Coverage Target**: 85%

**Implementation**:
1. Open `apps/admin/src/app/layout.tsx`
2. Expand the `metadata` export to include:
   - `themeColor: '#1e293b'`
   - `manifest: '/manifest.json'`
   - `appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'ShopVui Admin' }`
   - `icons: { apple: '/apple-touch-icon.png' }`
3. Ensure viewport meta is present (Next.js handles via `viewport` export or default)
4. Write tests asserting each metadata property
5. Run tests: `npx vitest run apps/admin/src/app/__tests__/layout.test.tsx`

---

## User Story: US-007 - Admin App Offline Page

**Linked ACs**: AC-US7-01, AC-US7-02, AC-US7-03
**Domain**: admin-frontend
**Tasks**: 1 total, 0 completed

### T-009: Create Admin Offline Page

**User Story**: US-007
**Satisfies ACs**: AC-US7-01, AC-US7-02, AC-US7-03
**Domain**: admin-frontend
**Status**: [x] completed

**Test Plan**:
- **Given** the admin user has lost network connectivity
- **When** they navigate to any page and the service worker intercepts the request
- **Then** the offline page is served with admin branding, an offline message, and a working retry button

**Test Cases**:
1. **Unit**: `apps/admin/src/app/offline/__tests__/page.test.tsx`
   - testOfflinePageRendersAdminBranding(): Render page, assert "ShopVui Admin" text is present (AC-US7-02)
   - testOfflinePageRendersOfflineMessage(): Assert text indicating user is offline is visible (AC-US7-02)
   - testOfflinePageRendersRetryButton(): Assert a retry button is rendered (AC-US7-02, AC-US7-03)
   - testRetryButtonCallsWindowReload(): Click retry button, assert `window.location.reload` was called (AC-US7-03)
   - **Coverage Target**: 90%

**Implementation**:
1. Write failing tests first (TDD red phase)
2. Create directory `apps/admin/src/app/offline/`
3. Create `apps/admin/src/app/offline/page.tsx` as `'use client'` component
4. Implement with Tailwind classes using admin slate palette (e.g. `bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center`)
5. Include: "ShopVui Admin" heading, "You are currently offline. Please check your connection." message, retry button calling `window.location.reload()`
6. Confirm T-007 service worker has `/offline` fallback entry for document requests (AC-US7-01)
7. Run tests: `npx vitest run apps/admin/src/app/offline/__tests__/page.test.tsx`
