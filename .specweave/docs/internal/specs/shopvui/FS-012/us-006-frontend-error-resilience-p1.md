---
id: US-006
feature: FS-012
title: "Frontend Error Resilience (P1)"
status: completed
priority: P0
created: 2026-03-13T00:00:00.000Z
tldr: "**As a** customer or admin user."
project: shopvui
---

# US-006: Frontend Error Resilience (P1)

**Feature**: [FS-012](./FEATURE.md)

**As a** customer or admin user
**I want** graceful error boundaries and loading states in both web and admin apps
**So that** I see helpful feedback instead of a blank screen when something fails or is loading

---

## Acceptance Criteria

- [x] **AC-US6-01**: Given Next.js App Router error boundaries, when an unhandled error occurs in any route segment of apps/web or apps/admin, then an error.tsx component renders with a user-friendly message and a retry button
- [x] **AC-US6-02**: Given loading.tsx files are added to route segments, when a page is loading via server components, then a loading skeleton or spinner is displayed
- [x] **AC-US6-03**: Given apps/web root layout, when the page renders, then it includes enhanced metadata with proper Open Graph tags (og:title, og:description, og:image, og:type)
- [x] **AC-US6-04**: Given a product detail page in apps/web, when the page renders, then it generates dynamic metadata using the product's name, description, and image for SEO and social sharing

---

## Implementation

**Increment**: [0012-production-hardening](../../../../../increments/0012-production-hardening/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-011**: Add error.tsx and loading.tsx to web app route segments
- [x] **T-012**: Add admin app root error boundary and loading state
- [x] **T-013**: Enhance Open Graph metadata for web app root and product detail pages
