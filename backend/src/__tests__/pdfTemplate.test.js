const { generateBillHtml, formatRupees } = require('../services/billTemplate');
const { BUSINESS_DETAILS } = require('../config/constants');

describe('Bill & PDF Template Generation (Step 9 & Step 10 Requirement)', () => {
  const sampleInvoice = {
    id: 'test-uuid-1234',
    quantity: 50,
    purchase_amount: 294000,
    selling_amount: 320000,
    profit_amount: 26000,
    gst_amount: 4680,
    cgst_amount: 2340,
    sgst_amount: 2340,
    net_profit: 21320,
    payment_method: 'UPI',
    status: 'issued',
    client_name: 'Metro Telecom',
    invoice_number: 'LOT-2026-08',
    gst_invoice_number: null,
    hsn_code: '8517',
    created_at: '2026-04-10T10:00:00.000Z'
  };

  test('10. Business name is clearly visible in the bill header', () => {
    const html = generateBillHtml(sampleInvoice);
    expect(html).toContain('Smart Move Traders');
    expect(html).toContain(BUSINESS_DETAILS.name);
  });

  test('10b. Complete business address appears directly below business name', () => {
    const html = generateBillHtml(sampleInvoice);
    expect(html).toContain('Plot 8, GF, Bharathiyar Street');
    expect(html).toContain('Maruthi Nagar, Phase 1');
    expect(html).toContain('Thundalam');
    expect(html).toContain('Chennai - 600077');
  });

  test('Customer tax invoice does not disclose internal purchase cost or profit margin', () => {
    const customerHtml = generateBillHtml(sampleInvoice, { isCustomerFacing: true });
    expect(customerHtml).not.toContain('Lot Purchase Cost');
    expect(customerHtml).not.toContain('Gross Profit Margin');
    expect(customerHtml).toContain('Customer Tax Invoice');
  });

  test('Internal margin bill displays full Rule 32(5) margin breakdown', () => {
    const internalHtml = generateBillHtml(sampleInvoice, { isCustomerFacing: false });
    expect(internalHtml).toContain('Lot Purchase Cost');
    expect(internalHtml).toContain('Gross Profit Margin');
    expect(internalHtml).toContain('Wholesale Margin Scheme Invoice (Rule 32(5))');
  });

  test('Rupee formatting properly formats Indian currency', () => {
    expect(formatRupees(294000)).toMatch(/2,94,000/);
    expect(formatRupees(320000)).toMatch(/3,20,000/);
    expect(formatRupees(0)).toBe('₹0.00');
  });
});
