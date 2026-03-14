import { test, expect } from '@playwright/test';

// A4 at 96 DPI: 794 x 1123 px
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

test.describe('Invoice print layout', () => {
  test('invoice content fits A4 width without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: A4_WIDTH, height: A4_HEIGHT });

    // Navigate to the invoice page with test order IDs.
    // In CI, seed data should provide known order IDs via environment variable.
    const ids = process.env.TEST_ORDER_IDS || 'test-order-1,test-order-2';
    await page.goto(`/admin/orders/invoices?ids=${ids}`);

    // Wait for invoice content to render
    await page.waitForSelector('.invoice');

    // Check that no element overflows the page width
    const overflowCount = await page.evaluate(() => {
      let count = 0;
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        if (el.scrollWidth > el.clientWidth + 1) {
          count++;
        }
      }
      return count;
    });

    expect(overflowCount).toBe(0);
  });

  test('multiple invoices have page-break styles', async ({ page }) => {
    await page.setViewportSize({ width: A4_WIDTH, height: A4_HEIGHT });

    const ids = process.env.TEST_ORDER_IDS || 'test-order-1,test-order-2';
    await page.goto(`/admin/orders/invoices?ids=${ids}`);

    await page.waitForSelector('.invoice');

    const invoices = await page.locator('.invoice').all();
    expect(invoices.length).toBeGreaterThanOrEqual(2);

    // The first invoice should NOT have page-break-before
    // Subsequent invoices should have page-break-before: always
    for (let i = 1; i < invoices.length; i++) {
      const pageBreak = await invoices[i].evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.getPropertyValue('page-break-before') || style.getPropertyValue('break-before');
      });
      expect(['always', 'page']).toContain(pageBreak);
    }
  });
});
