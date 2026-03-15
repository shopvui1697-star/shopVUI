---
increment: 0018-nextjs-16-upgrade
title: Upgrade Next.js to v16
type: change-request
priority: P1
status: completed
created: 2026-03-15T00:00:00.000Z
structure: user-stories
---

# Upgrade Next.js 15.x to 16.x

## Problem Statement

Both Next.js apps (`apps/web` and `apps/admin`) run on Next.js 15.x. Version 16.x brings performance improvements, improved bundling, and long-term support alignment. The upgrade must handle the removal of the `transpilePackages` config option (used in both apps to transpile `@shopvui/ui` and `@shopvui/shared`) and verify all integration points remain functional.

## Goals

- Upgrade `next` from `^15.1.0` to `^16.1.6` in both apps
- Remove deprecated `transpilePackages` config and migrate to the v16-compatible alternative
- Ensure all dependent packages (`@serwist/next`, `next-intl`, `next-themes`, `@tanstack/react-query`, `recharts`) remain compatible
- Both apps build and run without regressions

## User Stories

### US-001: Upgrade Next.js packages (P0)
**Project**: shopvui

**As a** developer
**I want** both apps upgraded to Next.js 16.x
**So that** we stay on a supported major version with latest improvements

**Acceptance Criteria**:
- [x] **AC-US1-01**: `next` version in `apps/web/package.json` and `apps/admin/package.json` is `^16.1.6`
- [x] **AC-US1-02**: `pnpm install` completes without peer dependency errors related to Next.js
- [x] **AC-US1-03**: `react` and `react-dom` versions are compatible with Next.js 16 requirements

---

### US-002: Remove transpilePackages config (P0)
**Project**: shopvui

**As a** developer
**I want** the removed `transpilePackages` option replaced with the v16-compatible approach
**So that** `@shopvui/ui` and `@shopvui/shared` packages are still correctly transpiled

**Acceptance Criteria**:
- [x] **AC-US2-01**: `transpilePackages` is removed from `apps/web/next.config.ts` and `apps/admin/next.config.ts`
- [x] **AC-US2-02**: Internal packages (`@shopvui/ui`, `@shopvui/shared`) are transpiled via the v16 mechanism (e.g., package.json `exports` or bundler resolution)
- [x] **AC-US2-03**: Components imported from `@shopvui/ui` render correctly in both apps

---

### US-003: Verify build and runtime for both apps (P1)
**Project**: shopvui

**As a** developer
**I want** both apps to build and start successfully on Next.js 16
**So that** there are no regressions from the upgrade

**Acceptance Criteria**:
- [x] **AC-US3-01**: `turbo build` completes successfully for both `web` and `admin` apps
- [x] **AC-US3-02**: `next dev` starts without errors for both apps
- [x] **AC-US3-03**: PWA service worker (`@serwist/next`) generates correctly in production builds

---

### US-004: Verify third-party integration compatibility (P1)
**Project**: shopvui

**As a** developer
**I want** all key third-party packages to work with Next.js 16
**So that** internationalization, theming, data fetching, and charting remain functional

**Acceptance Criteria**:
- [x] **AC-US4-01**: `next-intl` locale routing and translations work in `apps/web`
- [x] **AC-US4-02**: `next-themes` theme switching works in `apps/web`
- [x] **AC-US4-03**: `@tanstack/react-query` data fetching works in `apps/web`
- [x] **AC-US4-04**: `recharts` renders charts in `apps/admin`

## Out of Scope

- Adopting new Next.js 16 features (e.g., new APIs, experimental flags) beyond what is needed for compatibility
- Upgrading unrelated dependencies
- Rewriting app architecture or routing patterns
- Performance benchmarking before vs. after

## Technical Notes

### Dependencies
- pnpm workspace lockfile must be regenerated
- Turborepo cache should be cleared after upgrade

### Constraints
- Both apps share internal packages via pnpm workspaces; transpile migration must work for both simultaneously
- Dynamic route params already use the `Promise<>` pattern, so no migration needed there

## Success Criteria

- Both apps build cleanly with `turbo build`
- No new TypeScript or runtime errors introduced by the upgrade
- All existing functionality verified working
