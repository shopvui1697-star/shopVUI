---
id: US-004
feature: FS-014
title: "Translate Commerce Pages"
status: completed
priority: P1
created: 2026-03-14T00:00:00.000Z
tldr: "**As a** shopper."
project: shopvui
---

# US-004: Translate Commerce Pages

**Feature**: [FS-014](./FEATURE.md)

**As a** shopper
**I want** the cart, checkout, login, product listing, and product detail pages translated
**So that** I can complete my shopping journey entirely in my preferred language

---

## Acceptance Criteria

- [x] **AC-US4-01**: Given locale is vi, when the cart page renders, then all labels (quantity, subtotal, remove, checkout button) display in Vietnamese
- [x] **AC-US4-02**: Given locale is vi, when the checkout page renders, then form labels, validation messages, and action buttons display in Vietnamese
- [x] **AC-US4-03**: Given locale is en, when the product listing page renders, then filter labels, sort options, and "Add to Cart" buttons display in English
- [x] **AC-US4-04**: Given locale is vi, when the product detail page renders, then UI chrome (stock badge, price tier labels, reviews heading) displays in Vietnamese while product name and description remain untranslated (dynamic API content)
- [x] **AC-US4-05**: Given locale is vi, when the login page renders, then the "Sign in with Google" button label and any helper text display in Vietnamese

---

## Implementation

**Increment**: [0014-multi-language](../../../../../increments/0014-multi-language/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-008**: Extract cart and checkout strings
- [x] **T-009**: Extract product listing, product detail, and login strings
- [x] **T-010**: Extract orders page strings
