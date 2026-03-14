# Validation Report: 0003-product-catalog

**Date**: 2026-03-11
**Gate 1 Score**: 130/141 (72/100 — ACCEPTABLE)
**Gate 2 Score**: 70.7/100 (ACCEPTABLE)
**Grill Verdict**: FAIL (2 critical code issues)
**Overall**: NOT READY for closure

## Gate 1: Rule-Based Validation

| Category          | Passed | Total | Status |
|-------------------|--------|-------|--------|
| Structure         | 5      | 5     | PASS   |
| Three-File (0047) | 9      | 10    | WARN   |
| Consistency       | 41     | 47    | FAIL   |
| Completeness      | 23     | 23    | PASS   |
| Quality           | 30     | 31    | WARN   |
| Traceability      | 18     | 19    | FAIL   |
| AC Coverage       | 4      | 6     | FAIL   |

### Critical Issues
- 8/19 ACs unmapped: AC-US1-04, AC-US1-05, AC-US2-04, AC-US2-05, AC-US3-04, AC-US3-05, AC-US4-03, AC-US4-04
- T-004 mislinked to StockBadge ACs instead of category ACs
- T-005 mislinked to database schema ACs instead of UI ACs
- tasks.md metadata: completed_tasks says 7, actual is 8
- Section headers show "0 completed" — stale

## Gate 2: AI Quality Assessment

| Dimension       | Weight | Score | Issues |
|-----------------|--------|-------|--------|
| Clarity         | 0.20   | 68    | Field name drift, pagination contradiction |
| Testability     | 0.25   | 74    | 8 unmapped ACs, threshold boundary gaps |
| Completeness    | 0.20   | 62    | Missing AC coverage, T-004 mislinkage |
| Feasibility     | 0.15   | 78    | Plan adds unspecified endpoints |
| Maintainability | 0.10   | 75    | Shared types drift from Prisma models |
| Edge Cases      | 0.10   | 70    | No query param validation specified |

## Grill Issues (Code)

| # | Severity | Issue | File |
|---|----------|-------|------|
| 1 | CRITICAL | null as unknown as Product type lie | api.ts:24 |
| 2 | CRITICAL | No pagination bounds (DoS vector) | products.service.ts:12-14 |
| 3 | HIGH | Missing DB indexes on FKs | schema.prisma:49,63 |
| 4 | HIGH | No error boundary on pages | products/page.tsx:12-19 |
| 5 | HIGH | Negative stock shows "Low Stock" | StockBadge.tsx:13 |
| 6 | HIGH | parseInt produces NaN on bad input | products.controller.ts:24-25 |

## Fix Priority

### MUST FIX
1. api.ts:24 — Change return type to `Promise<Product | null>`
2. products.service.ts — Clamp page >= 1, 1 <= pageSize <= 100
3. tasks.md — Fix 8 unmapped ACs + mislinked T-004/T-005
4. tasks.md — Update metadata completed_tasks: 8

### SHOULD FIX
5. Reconcile field names across spec/plan/schema
6. Update plan AD-4 to acknowledge pagination
7. Add @@index on Product.categoryId, ProductImage.productId
8. StockBadge: change `=== 0` to `<= 0`
