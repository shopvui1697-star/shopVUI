---
id: US-003
feature: FS-014
title: "Translate Navigation and Layout"
status: completed
priority: P1
created: 2026-03-14T00:00:00.000Z
tldr: "**As a** user."
project: shopvui
---

# US-003: Translate Navigation and Layout

**Feature**: [FS-014](./FEATURE.md)

**As a** user
**I want** the navbar, footer, search bar, error pages, and loading states translated
**So that** I can navigate the site entirely in my preferred language

---

## Acceptance Criteria

- [x] **AC-US3-01**: Given locale is vi, when the navbar renders, then all navigation links (Home, Products, Cart, Login, Account) display in Vietnamese
- [x] **AC-US3-02**: Given locale is en, when the footer renders, then all footer text including copyright and link labels display in English
- [x] **AC-US3-03**: Given locale is vi, when the search bar renders, then the placeholder text displays in Vietnamese
- [x] **AC-US3-04**: Given an error occurs, when the error page (error.tsx) or loading page (loading.tsx) renders, then the messages display in the active locale

---

## Implementation

**Increment**: [0014-multi-language](../../../../../increments/0014-multi-language/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-006**: Extract navbar, footer, and search strings
- [x] **T-007**: Extract error and loading page strings
