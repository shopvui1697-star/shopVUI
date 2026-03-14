---
id: US-001
feature: FS-014
title: "i18n Infrastructure Setup"
status: completed
priority: P1
created: 2026-03-14T00:00:00.000Z
tldr: "**As a** developer."
project: shopvui
---

# US-001: i18n Infrastructure Setup

**Feature**: [FS-014](./FEATURE.md)

**As a** developer
**I want** next-intl integrated into the Next.js 15 App Router
**So that** the codebase supports internationalized strings with cookie-based locale detection

---

## Acceptance Criteria

- [x] **AC-US1-01**: Given next-intl is installed, when the app boots, then NextIntlClientProvider wraps the root layout with the active locale's messages
- [x] **AC-US1-02**: Given translation files vi.json and en.json exist in apps/web/messages/, when a translation key is used via useTranslations(), then the correct string renders for the active locale
- [x] **AC-US1-03**: Given no NEXT_LOCALE cookie is set, when a user visits the site, then Vietnamese (vi) is used as the default locale
- [x] **AC-US1-04**: Given next.config.ts is updated with the next-intl plugin, when the app builds, then no build errors occur and i18n middleware reads the locale cookie without URL prefix routing

---

## Implementation

**Increment**: [0014-multi-language](../../../../../increments/0014-multi-language/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-001**: Install next-intl and create i18n config files
- [x] **T-002**: Update next.config.ts and middleware for next-intl
- [x] **T-003**: Update root layout with NextIntlClientProvider
