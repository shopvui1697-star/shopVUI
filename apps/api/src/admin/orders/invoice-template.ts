interface OrderItemDetail {
  product: { name: string };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderAddress {
  fullName: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
}

interface OrderWithDetails {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  couponCode: string | null;
  createdAt: Date;
  items: OrderItemDetail[];
  address: OrderAddress | null;
}

function formatVnd(amount: number): string {
  return amount.toLocaleString('vi-VN') + '₫';
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function buildSingleInvoice(order: OrderWithDetails): string {
  const address = order.address;
  const addressStr = address
    ? `${escapeHtml(address.street)}, ${escapeHtml(address.ward)}, ${escapeHtml(address.district)}, ${escapeHtml(address.province)}`
    : '';

  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.product.name)}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${formatVnd(item.unitPrice)}</td>
        <td class="num">${formatVnd(item.subtotal)}</td>
      </tr>`,
    )
    .join('');

  const couponRow = order.couponCode
    ? `<tr><td colspan="3">Coupon: ${escapeHtml(order.couponCode)}</td><td class="num">-${formatVnd(order.discountAmount)}</td></tr>`
    : '';

  return `
    <div class="invoice">
      <div class="invoice-header">
        <h2>HO&Aacute; ĐƠN / INVOICE</h2>
        <div class="invoice-meta">
          <p><strong>Order:</strong> ${escapeHtml(order.orderNumber)}</p>
          <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div class="customer-info">
        <p><strong>Customer:</strong> ${escapeHtml(order.customerName)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(order.customerPhone)}</p>
        <p><strong>Email:</strong> ${escapeHtml(order.customerEmail)}</p>
        <p><strong>Address:</strong> ${addressStr}</p>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Product</th>
            <th class="num">Qty</th>
            <th class="num">Unit Price</th>
            <th class="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div class="totals">
        <table>
          <tr><td>Subtotal</td><td class="num">${formatVnd(order.subtotal)}</td></tr>
          ${couponRow}
          ${order.discountAmount && !order.couponCode ? `<tr><td>Discount</td><td class="num">-${formatVnd(order.discountAmount)}</td></tr>` : ''}
          <tr><td>Shipping</td><td class="num">${formatVnd(order.shippingFee)}</td></tr>
          <tr class="total-row"><td><strong>Total</strong></td><td class="num"><strong>${formatVnd(order.total)}</strong></td></tr>
        </table>
      </div>
    </div>`;
}

export function buildInvoiceHtml(orders: OrderWithDetails[]): string {
  const invoices = orders.map((order) => buildSingleInvoice(order)).join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoices</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 20px; }
    .invoice { padding: 20px; border: 1px solid #ddd; margin-bottom: 20px; }
    .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
    .invoice-header h2 { font-size: 18px; }
    .invoice-meta p { font-size: 11px; }
    .customer-info { margin-bottom: 15px; }
    .customer-info p { margin-bottom: 3px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    .items-table th, .items-table td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    .items-table th { background: #f5f5f5; font-weight: bold; }
    .num { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals table { width: 100%; }
    .totals td { padding: 4px 8px; }
    .total-row td { border-top: 2px solid #333; }

    @media print {
      body { padding: 0; }
      .invoice { border: none; margin-bottom: 0; padding: 15px 0; }
      .invoice + .invoice { page-break-before: always; }
    }
  </style>
</head>
<body>
  ${invoices}
</body>
</html>`;
}

export type { OrderWithDetails };
