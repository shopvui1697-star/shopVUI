---
id: FS-018
title: "Upgrade Next.js to v16"
type: feature
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
lastUpdated: 2026-03-15
tldr: "Both Next.js apps (`apps/web` and `apps/admin`) run on Next.js 15.x."
complexity: high
stakeholder_relevant: true
---

# Upgrade Next.js to v16

## TL;DR

**What**: Both Next.js apps (`apps/web` and `apps/admin`) run on Next.js 15.x.
**Status**: completed | **Priority**: P1
**User Stories**: 4

![Upgrade Next.js to v16 illustration](assets/feature-fs-018.jpg)

## Overview

Both Next.js apps (`apps/web` and `apps/admin`) run on Next.js 15.x. Version 16.x brings performance improvements, improved bundling, and long-term support alignment. The upgrade must handle the removal of the `transpilePackages` config option (used in both apps to transpile `@shopvui/ui` and `@shopvui/shared`) and verify all integration points remain functional.

## Implementation History

| Increment | Status | Completion Date |
|-----------|--------|----------------|
| [0018-nextjs-16-upgrade](../../../../../increments/0018-nextjs-16-upgrade/spec.md) | ✅ completed | 2026-03-15T00:00:00.000Z |

## User Stories

- [US-001: Upgrade Next.js packages (P0)](./us-001-upgrade-next-js-packages-p0.md)
- [US-002: Remove transpilePackages config (P0)](./us-002-remove-transpilepackages-config-p0.md)
- [US-003: Verify build and runtime for both apps (P1)](./us-003-verify-build-and-runtime-for-both-apps-p1.md)
- [US-004: Verify third-party integration compatibility (P1)](./us-004-verify-third-party-integration-compatibility-p1.md)
