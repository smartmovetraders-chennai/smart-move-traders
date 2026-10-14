/**
 * pdfService.js
 * Bill preview, PDF generation, downloading, and sharing using expo-print and expo-sharing.
 * Includes official Smart Move Traders golden bull logo in the generated PDF bills.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform, Alert } from 'react-native';
import { formatRupees, formatDate } from '../utils/formatters';
import { LOGO_BASE64 } from '../assets/logoBase64';

const BUSINESS_DETAILS = {
  name: 'Smart Move Traders',
  addressLine1: 'Plot 8, GF, Bharathiyar Street,',
  addressLine2: 'Maruthi Nagar, Phase 1,',
  addressLine3: 'Thundalam,',
  city: 'Chennai',
  pincode: '600077'
};

export function buildBillHtml(invoice, isCustomerFacing = true) {
  const createdDate = formatDate(invoice.created_at);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Smart Move Traders - Invoice</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background: #fff; padding: 32px; font-size: 13px; }
    .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
    .logo { width: 96px; height: 96px; object-fit: contain; border-radius: 12px; margin-bottom: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
    .title { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; }
    .address { font-size: 13px; color: #475569; line-height: 1.5; }
    .doc-type { display: inline-block; background: #e0e7ff; color: #3730a3; font-weight: 700; font-size: 11px; padding: 4px 12px; border-radius: 9999px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-card { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
    .info-col h4 { font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.5px; }
    .info-col p { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f1f5f9; color: #334155; font-weight: 600; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .summary-card { margin-left: auto; width: 340px; background: #f8fafc; padding: 14px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .summary-line { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #475569; }
    .summary-line.total { border-top: 2px solid #cbd5e1; padding-top: 8px; margin-top: 8px; font-size: 16px; font-weight: 800; color: #0f172a; }
    .notice { font-size: 11px; color: #64748b; margin-top: 20px; padding: 12px; background: #f8fafc; border-left: 3px solid #4f46e5; border-radius: 4px; line-height: 1.5; }
    .footer { margin-top: 36px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${LOGO_BASE64}" class="logo" alt="Smart Move Traders Logo" />
    <div class="title">${BUSINESS_DETAILS.name}</div>
    <div class="address">
      ${BUSINESS_DETAILS.addressLine1}<br>
      ${BUSINESS_DETAILS.addressLine2}<br>
      ${BUSINESS_DETAILS.addressLine3}<br>
      ${BUSINESS_DETAILS.city} - ${BUSINESS_DETAILS.pincode}
    </div>
    <div class="doc-type">${isCustomerFacing ? 'Tax Invoice (Second-Hand Goods)' : 'Margin Scheme Accounting Bill (Rule 32(5))'}</div>
  </div>

  <div class="info-card">
    <div class="info-col">
      <h4>Customer Details</h4>
      <p>${invoice.client_name || 'Counter Sale / Cash'}</p>
      <p style="font-size: 12px; color: #64748b;">Payment Method: <strong>${invoice.payment_method}</strong></p>
      <p style="font-size: 12px; color: #64748b;">Status: <strong>${(invoice.status || 'draft').toUpperCase()}</strong></p>
    </div>
    <div class="info-col" style="text-align: right;">
      <h4>Invoice Info</h4>
      <p>Date: ${createdDate}</p>
      <p style="font-size: 12px; color: #64748b;">Ref: <strong>${invoice.invoice_number || 'N/A'}</strong></p>
      ${invoice.gst_invoice_number ? `<p style="font-size: 12px; color: #64748b;">Official GST No: <strong>${invoice.gst_invoice_number}</strong></p>` : ''}
      <p style="font-size: 12px; color: #64748b;">HSN: <strong>${invoice.hsn_code || '8517'}</strong></p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item Description</th>
        <th class="text-center">HSN</th>
        <th class="text-center">Quantity</th>
        <th class="text-right">Total Selling Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          Second-Hand Smartphones (Wholesale Lot)
          ${Array.isArray(invoice.items) && invoice.items.length > 0 ? `
            <div style="font-size: 11px; color: #64748b; margin-top: 5px; line-height: 1.4;">
              ${invoice.items.map(it => `• ${it.model}: <strong>${it.quantity} Qty</strong>`).join('<br>')}
            </div>
          ` : ''}
        </td>
        <td class="text-center">${invoice.hsn_code || '8517'}</td>
        <td class="text-center"><strong>${invoice.quantity} Devices</strong></td>
        <td class="text-right"><strong>${formatRupees(invoice.selling_amount)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="summary-card">
    <div class="summary-line">
      <span>Total Lot Selling Price:</span>
      <span>${formatRupees(invoice.selling_amount)}</span>
    </div>
    ${!isCustomerFacing ? `
    <div class="summary-line">
      <span>Purchase Lot Cost:</span>
      <span>${formatRupees(invoice.purchase_amount)}</span>
    </div>
    <div class="summary-line">
      <span>Gross Margin (Profit):</span>
      <span>${formatRupees(invoice.profit_amount)}</span>
    </div>
    ` : ''}
    <div class="summary-line">
      <span>CGST (9% on margin):</span>
      <span>${formatRupees(invoice.cgst_amount || 0)}</span>
    </div>
    <div class="summary-line">
      <span>SGST (9% on margin):</span>
      <span>${formatRupees(invoice.sgst_amount || 0)}</span>
    </div>
    <div class="summary-line total">
      <span>Final Net Amount:</span>
      <span>${formatRupees(invoice.selling_amount)}</span>
    </div>
  </div>

  <div class="notice">
    <strong>GST Margin Scheme Declaration:</strong> This supply is made under Rule 32(5) of the CGST Rules, 2017 (Margin Scheme for second-hand goods). Tax is charged on the margin of supply only. Input Tax Credit is not available on this invoice.
  </div>

  ${invoice.notes ? `<div style="margin-top: 16px; font-size: 12px; color: #64748b;"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}

  <div class="footer">
    Smart Move Traders • Thank you for your partnership.
  </div>
</body>
</html>`;
}

export async function printInvoice(invoice, isCustomerFacing = true) {
  const html = buildBillHtml(invoice, isCustomerFacing);
  await Print.printAsync({ html });
}

/**
 * Prepares the PDF file in a secure, FileProvider-accessible cache directory
 * with a clean, branded filename.
 */
async function preparePdfFile(invoice, isCustomerFacing = true) {
  const html = buildBillHtml(invoice, isCustomerFacing);
  const { uri: tempUri } = await Print.printToFileAsync({ html });

  const cleanRef = (invoice.invoice_number || invoice.id?.slice(0, 8) || 'bill')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `SmartMoveTraders_Invoice_${cleanRef}.pdf`;
  const destinationUri = `${FileSystem.cacheDirectory}${filename}`;

  try {
    const fileInfo = await FileSystem.getInfoAsync(destinationUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(destinationUri, { idempotent: true });
    }
    await FileSystem.copyAsync({
      from: tempUri,
      to: destinationUri
    });
    return { uri: destinationUri, filename };
  } catch (copyErr) {
    console.warn('PDF cache copy fallback:', copyErr);
    return { uri: tempUri, filename };
  }
}

export async function shareInvoicePdf(invoice, isCustomerFacing = true) {
  const { uri, filename } = await preparePdfFile(invoice, isCustomerFacing);
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Share Invoice - ${filename}`
    });
  } else {
    Alert.alert('Sharing Unavailable', 'File sharing is not supported on this device.');
  }
  return uri;
}

export async function downloadInvoicePdf(invoice, isCustomerFacing = true) {
  const { uri, filename } = await preparePdfFile(invoice, isCustomerFacing);

  // On Android, attempt direct native save to user-selected folder (e.g. Downloads) via StorageAccessFramework
  if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
    try {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64
        });
        const createdUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          filename,
          'application/pdf'
        );
        await FileSystem.writeAsStringAsync(createdUri, base64, {
          encoding: FileSystem.EncodingType.Base64
        });
        Alert.alert('Downloaded Successfully', `Invoice PDF saved as:\n${filename}`);
        return createdUri;
      }
    } catch (safErr) {
      console.warn('StorageAccessFramework skipped or canceled, using share sheet:', safErr);
    }
  }

  // Fallback for iOS or if user dismisses folder picker: open share sheet to save/share
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Save / Download Invoice - Smart Move Traders`
    });
  } else {
    Alert.alert('Download Ready', `File generated: ${filename}`);
  }
  return uri;
}
