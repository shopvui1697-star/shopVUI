import { describe, it, expect } from 'vitest';
import { buildInvoiceHtml, type OrderWithDetails } from './invoice-template';

function makeSampleOrder(overrides: Partial<OrderWithDetails> = {}): OrderWithDetails {
  return {
    id: 'order-1',
    orderNumber: 'ORD-001',
    customerName: 'Nguyen Van A',
    customerPhone: '0901234567',
    customerEmail: 'a@test.com',
    subtotal: 300000,
    discountAmount: 50000,
    shippingFee: 30000,
    total: 280000,
    couponCode: 'SAVE50',
    createdAt: new Date('2026-01-15'),
    items: [
      {
        product: { name: 'Product A' },
        quantity: 2,
        unitPrice: 100000,
        subtotal: 200000,
      },
      {
        product: { name: 'Product B' },
        quantity: 1,
        unitPrice: 100000,
        subtotal: 100000,
      },
    ],
    address: {
      fullName: 'Nguyen Van A',
      phone: '0901234567',
      street: '123 Le Loi',
      ward: 'Ben Nghe',
      district: 'District 1',
      province: 'Ho Chi Minh City',
    },
    ...overrides,
  };
}

describe('buildInvoiceHtml', () => {
  it('templateContainsOrderNumber', () => {
    const html = buildInvoiceHtml([makeSampleOrder()]);
    expect(html).toContain('ORD-001');
  });

  it('templateContainsLineItemsTable', () => {
    const html = buildInvoiceHtml([makeSampleOrder()]);
    expect(html).toContain('Product A');
    expect(html).toContain('Product B');
    // Check quantities
    expect(html).toContain('>2<');
    expect(html).toContain('>1<');
  });

  it('templateContainsCouponRowOnlyWhenApplied', () => {
    const withCoupon = buildInvoiceHtml([makeSampleOrder()]);
    expect(withCoupon).toContain('SAVE50');

    const withoutCoupon = buildInvoiceHtml([
      makeSampleOrder({ couponCode: null, discountAmount: 0 }),
    ]);
    expect(withoutCoupon).not.toContain('Coupon:');
  });

  it('templatePageBreakPresentOnSecondInvoice', () => {
    const html = buildInvoiceHtml([
      makeSampleOrder({ id: 'o1', orderNumber: 'ORD-001' }),
      makeSampleOrder({ id: 'o2', orderNumber: 'ORD-002' }),
    ]);
    // The CSS rule .invoice + .invoice { page-break-before: always }
    expect(html).toContain('page-break-before: always');
    // Should have two invoice divs
    const invoiceCount = (html.match(/class="invoice"/g) || []).length;
    expect(invoiceCount).toBe(2);
  });

  it('templateStartsWithDoctype', () => {
    const html = buildInvoiceHtml([makeSampleOrder()]);
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/);
  });

  it('templateContainsCustomerDetails', () => {
    const html = buildInvoiceHtml([makeSampleOrder()]);
    expect(html).toContain('Nguyen Van A');
    expect(html).toContain('0901234567');
    expect(html).toContain('a@test.com');
    expect(html).toContain('123 Le Loi');
    expect(html).toContain('Ho Chi Minh City');
  });

  it('templateContainsTotals', () => {
    const html = buildInvoiceHtml([makeSampleOrder()]);
    expect(html).toContain('Subtotal');
    expect(html).toContain('Shipping');
    expect(html).toContain('Total');
  });

  it('escapes HTML in customer name', () => {
    const html = buildInvoiceHtml([
      makeSampleOrder({ customerName: '<script>alert("xss")</script>' }),
    ]);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
