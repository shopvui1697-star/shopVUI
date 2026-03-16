---
increment: 0018-nextjs-16-upgrade
title: "Upgrade Next.js to v16"
generated: 2026-03-15
by_user_story:
  US-001: [T-001, T-002]
  US-002: [T-003]
  US-003: [T-004, T-005]
  US-004: [T-006]
---

# Tasks: Upgrade Next.js to v16

## User Story: US-001 - Upgrade Next.js packages

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03
**Tasks**: 2 total, 0 completed

---

### T-001: Bump next version to ^16.1.6 in both apps

**User Story**: US-001 | **Satisfies ACs**: AC-US1-01, AC-US1-03 | **Status**: [x] completed

**Test Plan**:
- **Given** both `package.json` files declare `"next": "^15.1.0"`
- **When** the version string is updated to `"^16.1.6"` in each file
- **Then** `grep '"next"' apps/web/package.json apps/admin/package.json` shows `^16.1.6` in both; React 19 is unchanged

**Implementation**:
1. Edit `apps/web/package.json`: `"next": "^15.1.0"` → `"next": "^16.1.6"`
2. Edit `apps/admin/package.json`: `"next": "^15.1.0"` → `"next": "^16.1.6"`

---

### T-002: Reinstall dependencies and clear turbo cache

**User Story**: US-001 | **Satisfies ACs**: AC-US1-02 | **Status**: [x] completed

**Test Plan**:
- **Given** both `package.json` files declare `next: "^16.1.6"`
- **When** `pnpm install` runs at repo root
- **Then** lockfile regenerates with exit code 0 and no peer dependency errors referencing `next`

**Test Cases**:
1. **Verification**: `pnpm install` exits 0; output contains no `ERR_PNPM_PEER_DEP_ISSUES` for `next`
2. **Fallback**: If `@serwist/next` or `next-intl` warn on peer deps, add `pnpm.peerDependencyRules.allowedVersions` override in root `package.json`

**Implementation**:
1. Run `pnpm install` from repo root
2. Apply peer dep override if needed (see fallback above)
3. Run `npx turbo clean` to clear stale cache

---

## User Story: US-002 - Remove transpilePackages config

**Linked ACs**: AC-US2-01, AC-US2-02, AC-US2-03
**Tasks**: 1 total, 0 completed

---

### T-003: Remove transpilePackages from both next.config.ts files

**User Story**: US-002 | **Satisfies ACs**: AC-US2-01, AC-US2-02, AC-US2-03 | **Status**: [x] completed

**Test Plan**:
- **Given** `transpilePackages` is present in both `next.config.ts` files
- **When** those lines are deleted
- **Then** `grep -r 'transpilePackages' apps/web/next.config.ts apps/admin/next.config.ts` returns no matches; build in T-004 confirms `@shopvui/ui` and `@shopvui/shared` still resolve via their pre-built `exports` maps

**Implementation**:
1. Edit `apps/web/next.config.ts`: remove the `transpilePackages` line/block
2. Edit `apps/admin/next.config.ts`: remove the `transpilePackages` line/block
3. No replacement needed — packages export pre-compiled JS with proper `exports` fields

---

## User Story: US-003 - Verify build and runtime for both apps

**Linked ACs**: AC-US3-01, AC-US3-02, AC-US3-03
**Tasks**: 2 total, 0 completed

---

### T-004: Run turbo build and verify both apps compile

**User Story**: US-003 | **Satisfies ACs**: AC-US3-01, AC-US3-03 | **Status**: [x] completed

**Test Plan**:
- **Given** `next` is at `^16.1.6` and `transpilePackages` is removed
- **When** `turbo build` runs from repo root
- **Then** both apps build with exit code 0 and `apps/web/public/sw.js` exists (Serwist PWA service worker)

**Test Cases**:
1. **Verification**: `turbo build` exits 0 with no TS errors
2. **Verification**: `ls apps/web/public/sw.js` — file present
3. **Fallback**: If Serwist webpack plugin fails, check for newer `@serwist/next`; disable temporarily with `disable: true` and open a follow-up increment only if blocking

**Implementation**:
1. Run `turbo build`
2. Inspect output for import resolution failures or TS errors
3. Verify `sw.js` presence

---

### T-005: Run existing test suite to confirm no regressions

**User Story**: US-003 | **Satisfies ACs**: AC-US3-02 | **Status**: [x] completed

**Test Plan**:
- **Given** the upgraded build completes successfully
- **When** `npx vitest run` executes across all packages
- **Then** all pre-existing tests pass (zero new failures)

**Test Cases**:
1. **Verification**: `npx vitest run` exits 0

**Implementation**:
1. Run `npx vitest run` (or `pnpm -r run test`) from repo root
2. Any new failures are regressions from the upgrade — investigate the Next.js 16 change responsible before marking complete

---

## User Story: US-004 - Verify third-party integration compatibility

**Linked ACs**: AC-US4-01, AC-US4-02, AC-US4-03, AC-US4-04
**Tasks**: 1 total, 0 completed

---

### T-006: Smoke-test third-party integrations in dev mode

**User Story**: US-004 | **Satisfies ACs**: AC-US4-01, AC-US4-02, AC-US4-03, AC-US4-04 | **Status**: [x] completed

**Test Plan**:
- **Given** the upgraded build succeeds
- **When** `next dev` is started for each app and key pages are loaded
- **Then** `next-intl` locale routing, `next-themes` toggle, `@tanstack/react-query` data loading, and `recharts` charts all function without console errors

**Test Cases**:
1. **Verification**: `pnpm --filter web dev` starts without terminal errors
2. **Verification**: `pnpm --filter admin dev` starts without terminal errors
3. **Manual smoke — web**: locale switch loads translated content; theme toggle switches dark/light; data queries return without network errors
4. **Manual smoke — admin**: charts render without React or Recharts errors in browser console

**Implementation**:
1. Start `pnpm --filter web dev`, confirm clean startup
2. Start `pnpm --filter admin dev`, confirm clean startup
3. Spot-check each integration in browser dev tools
4. Mark complete once all four ACs verified
