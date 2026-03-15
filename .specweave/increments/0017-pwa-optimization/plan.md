# Architecture Plan: 0017 - PWA Review and Optimization

## 1. Current State Analysis

### Web App (apps/web) - Already PWA-enabled
- **Service worker**: `src/app/sw.ts` uses Serwist v9.5.6 with `defaultCache` from `@serwist/next/worker`
- **Manifest**: `public/manifest.json` with icons (192, 512, maskable variants), shortcuts, standalone display
- **Offline page**: `src/app/offline/page.tsx` with i18n and dark mode support
- **Layout metadata**: viewport themeColor, manifest link, appleWebApp config, icon links all present
- **next.config.ts**: `withSerwist({ swSrc, swDest, disable: dev })` wrapping `withNextIntl`

### Admin App (apps/admin) - No PWA support
- **No service worker**, no manifest, no offline page
- **Layout**: minimal Metadata (title/description only), no PWA meta tags
- **next.config.ts**: bare NextConfig with only `transpilePackages`
- **No Serwist dependencies** in package.json
- **No public/ directory** (empty)

### What defaultCache Already Provides
The `defaultCache` from `@serwist/next/worker` is comprehensive (reviewed source). It includes:
- Google Fonts: CacheFirst (webfonts, 365d) + StaleWhileRevalidate (stylesheets, 7d)
- Static fonts/images: StaleWhileRevalidate with expiration
- Next.js static JS: CacheFirst (24h)
- Next.js images: StaleWhileRevalidate (24h)
- Audio/video: CacheFirst with RangeRequests
- API auth routes: NetworkOnly (10s timeout)
- API GET routes: NetworkFirst (24h, 10s timeout)
- RSC prefetch/data: NetworkFirst (24h)
- HTML pages: NetworkFirst (24h)
- Cross-origin: NetworkFirst (1h, 10s timeout)

## 2. Architecture Decisions

### AD-1: Keep defaultCache for Web App SW (No Custom Override)

**Decision**: The web app service worker will continue using `defaultCache` from `@serwist/next/worker` without custom runtime caching overrides.

**Rationale**:
- The defaultCache already implements exactly what the spec requires: NetworkFirst for API (AC-US1-01), CacheFirst for static assets (AC-US1-03), proper expiration policies
- API requests already use NetworkFirst with 10s timeout (AC-US1-01 satisfied)
- Auth routes are correctly excluded with NetworkOnly
- Precaching via `self.__SW_MANIFEST` handles app shell (AC-US1-02)
- `skipWaiting: true` + `clientsClaim: true` handles deployment cache purge (AC-US1-04)
- Overriding defaultCache would create a maintenance burden tracking upstream Serwist changes

**No changes needed to sw.ts for US-001.** The current implementation already satisfies all AC criteria.

### AD-2: Install Prompt via Client Component with localStorage Dismissal

**Decision**: Implement A2HS as a client component `InstallPrompt` that:
1. Listens for `beforeinstallprompt` event in a `useEffect`
2. Stores the deferred prompt in a ref
3. Checks localStorage for dismissal timestamp (7-day cooldown per AC-US2-02)
4. Checks `window.matchMedia('(display-mode: standalone)')` to hide if already installed (AC-US2-04)
5. Renders a dismissible banner/button when eligible

**File**: `apps/web/src/components/InstallPrompt.tsx`

**Placement**: Rendered in root layout, below Navbar. The component is entirely self-contained -- no context provider needed since the prompt event is a one-time browser event.

**Why not a hook + context?** The beforeinstallprompt event fires once per page load. A single component with internal state is simpler and avoids prop drilling. If other components need to trigger install in the future, extract to a hook then.

### AD-3: Admin PWA Uses Same Serwist Pattern as Web

**Decision**: The admin app will use the identical Serwist integration pattern:
- Same `@serwist/next` + `serwist` packages at the same version (^9.5.6)
- Same `withSerwist()` wrapper in next.config.ts
- Same sw.ts structure using `defaultCache`
- `defaultCache` is appropriate for admin too: API routes get NetworkFirst (fresh data when online, AC-US5-02), static assets get CacheFirst/StaleWhileRevalidate (AC-US5-03)

**Rationale**: Admin is an internal tool but runs on the same Next.js stack. The defaultCache strategies are correct for both apps -- there is no admin-specific caching need that differs from what defaultCache provides. Using the same pattern reduces cognitive overhead and maintenance.

### AD-4: Distinct Admin Icons and Manifest

**Decision**: Admin app gets its own manifest and icons with different branding:
- **theme_color**: `#1e293b` (slate-800, distinct from web's indigo `#4f46e5`)
- **short_name**: "SV Admin" (distinct from web's "ShopVui")
- **Icons**: Same dimensions (192, 512, maskable variants) but with admin-specific color/badge
- **No shortcuts**: Admin navigation is sidebar-based, shortcuts add little value
- **No screenshots**: Internal tool, Lighthouse screenshots are nice-to-have but not required for admin

**Files to create**:
- `apps/admin/public/manifest.json`
- `apps/admin/public/icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`
- `apps/admin/public/apple-touch-icon.png`, `favicon.ico`

**Icon generation**: Reuse the web icon source/pipeline but with the admin theme color overlay. For initial implementation, copy web icons and note a follow-up task for design team to create distinct admin icons.

### AD-5: Web Manifest Gaps for Lighthouse

**Decision**: The web manifest needs two additions for full Lighthouse PWA compliance:
1. **`screenshots` field**: At least one mobile (portrait) and one desktop (landscape) screenshot (required by Lighthouse for richer install UI on mobile Chrome)
2. **`id` field**: Recommended by Lighthouse for stable app identity

The existing manifest already has all other required fields (name, short_name, start_url, display, background_color, theme_color, icons, description).

## 3. Component Breakdown

### Web App Changes (apps/web)

| File | Change | Story |
|------|--------|-------|
| `src/components/InstallPrompt.tsx` | **NEW** - A2HS client component | US-002 |
| `src/app/layout.tsx` | Add `<InstallPrompt />` to layout | US-002 |
| `public/manifest.json` | Add `screenshots` and `id` fields | US-003 |
| `public/screenshot-mobile.png` | **NEW** - Mobile screenshot for manifest | US-003 |
| `public/screenshot-desktop.png` | **NEW** - Desktop screenshot for manifest | US-003 |

**No changes to**: `sw.ts`, `next.config.ts`, offline page, existing icons, existing meta tags (all already correct).

### Admin App Changes (apps/admin)

| File | Change | Story |
|------|--------|-------|
| `package.json` | Add `@serwist/next` and `serwist` dependencies | US-005 |
| `next.config.ts` | Wrap with `withSerwist()` | US-005 |
| `src/app/sw.ts` | **NEW** - Service worker (same pattern as web) | US-005 |
| `public/manifest.json` | **NEW** - Admin manifest with distinct branding | US-004 |
| `public/icon-*.png` | **NEW** - Admin icon set (192, 512, maskable) | US-004 |
| `public/apple-touch-icon.png` | **NEW** - Apple touch icon | US-004 |
| `public/favicon.ico` | **NEW** - Admin favicon | US-004 |
| `src/app/layout.tsx` | Add PWA metadata (viewport, manifest, icons, appleWebApp) | US-006 |
| `src/app/offline/page.tsx` | **NEW** - Admin offline page | US-007 |

## 4. InstallPrompt Component Design

```
InstallPrompt (client component)
  State: deferredPrompt (ref), showBanner (boolean)
  Effects:
    Listen for 'beforeinstallprompt' -> store event, check dismiss/installed
    Listen for 'appinstalled' -> hide banner
  Logic:
    isDismissed(): localStorage 'shopvui-install-dismiss-ts' < 7 days ago
    isInstalled(): matchMedia('(display-mode: standalone)').matches
    handleInstall(): prompt(), await outcome, hide
    handleDismiss(): set localStorage timestamp, hide
  Render: Floating banner with install button + dismiss X
```

**localStorage key**: `shopvui-install-dismiss-ts` (timestamp in ms)

**No server-side rendering concerns**: The component renders null on server (useEffect only runs client-side) and conditionally shows the banner.

## 5. Admin Offline Page Design

Simpler than the web app version (no i18n, no dark mode needed for internal tool):
- ShopVui Admin branding
- "You are offline" message
- Retry button that calls `window.location.reload()`
- Uses Tailwind classes consistent with admin dashboard styling

## 6. Admin Service Worker (sw.ts)

Identical structure to web app:

```typescript
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

// ... same global declarations ...

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();
```

No customization needed. The `defaultCache` handles admin caching needs correctly.

## 7. Admin next.config.ts Integration

```typescript
import type { NextConfig } from 'next';
import withSerwist from '@serwist/next';

const nextConfig: NextConfig = {
  transpilePackages: ['@shopvui/ui', '@shopvui/shared'],
};

export default withSerwist({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
```

## 8. Implementation Order

1. **US-001** (Web SW audit) - Verify existing config satisfies ACs, no code changes expected
2. **US-003** (Lighthouse compliance) - Add screenshots + id to manifest
3. **US-002** (Install prompt) - Create InstallPrompt component, add to layout
4. **US-004** (Admin manifest/icons) - Create manifest, copy/generate icons
5. **US-005** (Admin SW) - Add Serwist deps, create sw.ts, update next.config.ts
6. **US-006** (Admin meta tags) - Update admin layout.tsx with PWA metadata
7. **US-007** (Admin offline page) - Create offline page component

US-004 through US-007 can be parallelized across two agents (one for SW/config, one for manifest/layout/offline).

## 9. File Ownership for Agent Delegation

| Agent | Files | Stories |
|-------|-------|---------|
| **web-frontend** | `apps/web/src/components/InstallPrompt.tsx`, `apps/web/src/app/layout.tsx`, `apps/web/public/manifest.json`, screenshot assets | US-001, US-002, US-003 |
| **admin-frontend** | All `apps/admin/` files (package.json, next.config.ts, sw.ts, manifest, icons, layout, offline page) | US-004, US-005, US-006, US-007 |

No backend changes. No database changes. No shared package changes.

## 10. Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Lighthouse screenshot requirements change | Low | Screenshots are additive, easy to update |
| Admin icons identical to web confuses users | Medium | Use distinct theme_color; flag for design team follow-up |
| Service worker caching stale admin data | Low | defaultCache uses NetworkFirst for API routes (always fresh when online) |
| beforeinstallprompt not firing on all browsers | Medium (Safari) | Component gracefully degrades (renders nothing if event never fires) |
| pnpm workspace resolution for new admin deps | Low | Same packages already used in web app, versions locked |

## 11. Testing Strategy

- **Unit tests**: InstallPrompt component (mock beforeinstallprompt event, localStorage, matchMedia)
- **Integration**: Admin sw.ts compiles without errors, next.config.ts produces valid webpack config
- **Lighthouse CI**: Run `npx lighthouse` against both apps to verify PWA scores
- **Manual**: Test install flow on Chrome Android/Desktop, verify offline pages render
