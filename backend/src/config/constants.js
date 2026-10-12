/**
 * constants.js
 * Business identity and GST margin scheme constants for Smart Move Traders.
 */

const BUSINESS_DETAILS = {
  name: 'Smart Move Traders',
  addressLine1: 'Plot 8, GF, Bharathiyar Street,',
  addressLine2: 'Maruthi Nagar, Phase 1,',
  addressLine3: 'Thundalam,',
  city: 'Chennai',
  pincode: '600077',
  fullAddress: 'Plot 8, GF, Bharathiyar Street, Maruthi Nagar, Phase 1, Thundalam, Chennai - 600077',
  state: 'Tamil Nadu',
  stateCode: '33'
};

const GST_CONFIG = {
  RATE: 0.18,          // 18% GST on positive margin
  CGST_SHARE: 0.5,     // 9% CGST (half of 18%)
  SGST_SHARE: 0.5,     // 9% SGST (half of 18%)
  DEFAULT_HSN: '8517'  // Mobile phones HSN classification (subject to CA verification)
};

const PAYMENT_METHODS = ['Bank Transfer', 'UPI', 'Cash', 'Cheque'];
const INVOICE_STATUSES = ['draft', 'issued', 'paid', 'void'];

module.exports = {
  BUSINESS_DETAILS,
  GST_CONFIG,
  PAYMENT_METHODS,
  INVOICE_STATUSES
};
