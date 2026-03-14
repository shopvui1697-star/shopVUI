---
id: US-002
feature: FS-014
title: "Language Switcher UI"
status: completed
priority: P1
created: 2026-03-14T00:00:00.000Z
tldr: "**As a** user."
project: shopvui
---

# US-002: Language Switcher UI

**Feature**: [FS-014](./FEATURE.md)

**As a** user
**I want** a language switcher in the navbar
**So that** I can toggle between Vietnamese and English at any time

---

## Acceptance Criteria

- [x] **AC-US2-01**: Given a logged-in user, when they open the profile dropdown in the navbar, then a language toggle option appears showing the current language
- [x] **AC-US2-02**: Given an anonymous user, when they view the navbar, then a globe icon button is visible that opens a language selector
- [x] **AC-US2-03**: Given a user switches from vi to en, when the page re-renders, then all UI text updates to English and a NEXT_LOCALE cookie is set to "en" with a localStorage mirror
- [x] **AC-US2-04**: Given a user closes the browser and returns, when the page loads, then the previously selected language is restored from the cookie

---

## Implementation

**Increment**: [0014-multi-language](../../../../../increments/0014-multi-language/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-004**: Create LanguageSwitcher component
- [x] **T-005**: Integrate LanguageSwitcher into Navbar
