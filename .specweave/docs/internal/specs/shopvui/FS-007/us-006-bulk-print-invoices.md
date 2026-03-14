---
id: US-006
feature: FS-007
title: "Bulk Print Invoices"
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-006: Bulk Print Invoices

**Feature**: [FS-007](./FEATURE.md)

**As an** admin
**I want** to select multiple orders and print their invoices in bulk
**So that** I can efficiently prepare invoices for shipment without opening each order individually

---

## Acceptance Criteria

- [x] **AC-US6-01**: Given the admin order list with bulk actions, when the admin selects orders and chooses "Print Invoices", then a printable page opens with invoices for all selected orders
- [x] **AC-US6-02**: Given a generated invoice, when rendered, then it includes order number, order date, customer name, phone, email, shipping address, line items with quantity and unit price, subtotal, discount amount, coupon code (if applied), shipping fee, and total
- [x] **AC-US6-03**: Given multiple invoices generated, when the admin triggers print (browser print dialog), then each invoice starts on a new page with proper page-break styling
- [x] **AC-US6-04**: Given the bulk print action, when more than 50 orders are selected, then a warning is shown suggesting the admin reduce the selection for performance reasons
- [x] **AC-US6-05**: Given the invoice layout, when printed on A4 paper, then the layout fits cleanly without content overflow or clipping

---

## Implementation

**Increment**: [0007-feature-enhancements](../../../../../increments/0007-feature-enhancements/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-017**: Add bulk invoice HTML endpoint to admin orders
- [x] **T-018**: Invoice HTML template with print CSS
- [x] **T-019**: Add "Print Invoices" to admin order bulk actions
- [x] **T-020**: [P] Invoice print layout visual test
