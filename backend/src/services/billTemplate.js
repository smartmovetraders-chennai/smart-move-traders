/**
 * billTemplate.js
 * Generates print/PDF HTML templates for Smart Move Traders bills.
 * Includes both customer-facing tax invoice and internal margin scheme breakdown.
 */

const { BUSINESS_DETAILS, GST_CONFIG } = require('../config/constants');

/**
 * Format number to Indian Rupee string (e.g. ₹ 2,94,000.00)
 */
function formatRupees(amount) {
  if (amount === null || amount === undefined) return '₹0.00';
  const num = Number(amount);
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Generates bill HTML.
 * @param {Object} invoice
 * @param {Object} options - { isCustomerFacing: boolean }
 */
function generateBillHtml(invoice, options = { isCustomerFacing: true }) {
  const isCustomer = options.isCustomerFacing !== false;
  const createdDate = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : new Date().toLocaleDateString('en-IN');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Move Traders - Bill</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #ffffff; padding: 32px; font-size: 14px; }
    .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
    .business-name { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; margin-bottom: 6px; text-transform: uppercase; }
    .business-address { font-size: 13px; color: #475569; line-height: 1.5; max-width: 480px; margin: 0 auto; }
    .invoice-title-badge { display: inline-block; background: #e0e7ff; color: #3730a3; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 9999px; margin-top: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .meta-column h4 { font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.5px; }
    .meta-column p { font-size: 14px; color: #0f172a; font-weight: 500; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f1f5f9; color: #334155; font-weight: 600; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .summary-box { margin-left: auto; width: 340px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #475569; }
    .summary-row.total { border-top: 2px solid #cbd5e1; padding-top: 10px; margin-top: 8px; font-size: 16px; font-weight: 800; color: #0f172a; }
    .notice { font-size: 11px; color: #64748b; margin-top: 24px; padding: 12px; background: #f8fafc; border-left: 3px solid #6366f1; border-radius: 4px; line-height: 1.5; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="business-name">${BUSINESS_DETAILS.name}</div>
    <div class="business-address">
      ${BUSINESS_DETAILS.addressLine1}<br>
      ${BUSINESS_DETAILS.addressLine2}<br>
      ${BUSINESS_DETAILS.addressLine3}<br>
      ${BUSINESS_DETAILS.city} - ${BUSINESS_DETAILS.pincode}
    </div>
    <div class="invoice-title-badge">${isCustomer ? 'Customer Tax Invoice' : 'Wholesale Margin Scheme Invoice (Rule 32(5))'}</div>
  </div>

  <div class="meta-grid">
    <div class="meta-column">
      <h4>Billed To</h4>
      <p><strong>${invoice.client_name || 'Counter Sale / Cash Customer'}</strong></p>
      <p>Payment: <strong>${invoice.payment_method || 'Cash'}</strong></p>
      <p>Status: <strong>${(invoice.status || 'draft').toUpperCase()}</strong></p>
    </div>
    <div class="meta-column text-right">
      <h4>Invoice Details</h4>
      <p>Date: <strong>${createdDate}</strong></p>
      <p>Ref: <strong>${invoice.invoice_number || 'N/A'}</strong></p>
      ${invoice.gst_invoice_number ? `<p>GST Inv No: <strong>${invoice.gst_invoice_number}</strong></p>` : ''}
      <p>HSN Code: <strong>${invoice.hsn_code || GST_CONFIG.DEFAULT_HSN}</strong></p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-center">HSN</th>
        <th class="text-center">Lot Quantity</th>
        <th class="text-right">Total Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          Second-Hand Smartphones (Wholesale Lot)
          ${Array.isArray(invoice.items) && invoice.items.length > 0 ? `
            <div style="font-size: 11px; color: #64748b; margin-top: 5px; line-height: 1.4;">
              ${invoice.items.map(it => `• ${it.model}: <strong>${it.quantity} Qty</strong>${it.price > 0 ? ` &mdash; <span style="color: #166534; font-weight: 600;">₹${Number(it.price).toLocaleString('en-IN')}</span>` : ''}`).join('<br>')}
            </div>
          ` : ''}
        </td>
        <td class="text-center">${invoice.hsn_code || GST_CONFIG.DEFAULT_HSN}</td>
        <td class="text-center"><strong>${invoice.quantity} Units</strong></td>
        <td class="text-right"><strong>${formatRupees(invoice.selling_amount)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="summary-box">
    <div class="summary-row">
      <span>Total Sale Value:</span>
      <span>${formatRupees(invoice.selling_amount)}</span>
    </div>
    ${!isCustomer ? `
    <div class="summary-row">
      <span>Lot Purchase Cost:</span>
      <span>${formatRupees(invoice.purchase_amount)}</span>
    </div>
    <div class="summary-row">
      <span>Gross Profit Margin:</span>
      <span>${formatRupees(invoice.profit_amount)}</span>
    </div>
    ` : ''}
    <div class="summary-row">
      <span>CGST (${(GST_CONFIG.RATE * GST_CONFIG.CGST_SHARE * 100).toFixed(0)}% on margin):</span>
      <span>${formatRupees(invoice.cgst_amount || 0)}</span>
    </div>
    <div class="summary-row">
      <span>SGST (${(GST_CONFIG.RATE * GST_CONFIG.SGST_SHARE * 100).toFixed(0)}% on margin):</span>
      <span>${formatRupees(invoice.sgst_amount || 0)}</span>
    </div>
    <div class="summary-row total">
      <span>Net Payable:</span>
      <span>${formatRupees(invoice.selling_amount)}</span>
    </div>
  </div>

  <div class="notice">
    <strong>GST Margin Scheme Declaration:</strong> This bill is issued in accordance with CGST Rule 32(5) for second-hand goods. GST is levied on the margin of supply only. The buyer is not entitled to claim Input Tax Credit on this supply.
  </div>

  ${invoice.notes ? `<div style="margin-top: 16px; font-size: 12px; color: #64748b;"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}

  <div class="footer">
    Thank you for your business with Smart Move Traders.
  </div>
</body>
</html>`;
}

module.exports = {
  formatRupees,
  generateBillHtml
};
