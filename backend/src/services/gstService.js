/**
 * gstService.js
 * ============================================================================
 * Second-hand goods GST margin scheme (CGST Rule 32(5)) calculation engine.
 *
 * Under Rule 32(5), GST applies ONLY to the positive profit margin on a
 * wholesale lot sale, never to the full selling amount and never to the
 * purchase amount.
 *
 * All money arithmetic is performed using integer PAISE (1 Rupee = 100 Paise)
 * to prevent floating-point inaccuracies.
 * ============================================================================
 */

const { GST_CONFIG, PAYMENT_METHODS } = require('../config/constants');

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

/**
 * Convert rupees to integer paise, rounding half-away-from-zero.
 * @param {number} rupees
 * @returns {number} integer paise
 */
function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

/**
 * Convert integer paise to rupees with exactly 2 decimal precision.
 * @param {number} paise
 * @returns {number} rupees
 */
function toRupees(paise) {
  return Math.round(paise) / 100;
}

/**
 * Validates transaction inputs.
 * @param {Object} input
 * @returns {Object} cleaned inputs
 */
function validateTransactionInput(input = {}) {
  const quantity = Number(input.quantity);
  const purchaseAmount = Number(input.purchaseAmount);
  const sellingAmount = Number(input.sellingAmount);
  const paymentMethod = input.paymentMethod;

  if (input.quantity === undefined || input.quantity === null || !Number.isInteger(quantity) || quantity <= 0) {
    throw new ValidationError('quantity must be a positive whole number');
  }

  if (input.purchaseAmount === undefined || input.purchaseAmount === null || typeof input.purchaseAmount === 'boolean' || isNaN(purchaseAmount) || !Number.isFinite(purchaseAmount) || purchaseAmount < 0) {
    throw new ValidationError('purchaseAmount must be a non-negative number');
  }

  if (input.sellingAmount === undefined || input.sellingAmount === null || typeof input.sellingAmount === 'boolean' || isNaN(sellingAmount) || !Number.isFinite(sellingAmount) || sellingAmount < 0) {
    throw new ValidationError('sellingAmount must be a non-negative number');
  }

  if (!paymentMethod || !PAYMENT_METHODS.includes(paymentMethod)) {
    throw new ValidationError(`paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`);
  }

  return {
    quantity,
    purchaseAmount,
    sellingAmount,
    paymentMethod
  };
}

/**
 * Calculates GST margin scheme figures under CGST Rule 32(5).
 * Pure function: deterministic, no side effects.
 *
 * @param {{quantity: number, purchaseAmount: number, sellingAmount: number, paymentMethod: string}} input
 * @returns {{profitAmount: number, gstAmount: number, cgstAmount: number, sgstAmount: number, netProfit: number}}
 */
function calculateGst(input) {
  const purchasePaise = toPaise(input.purchaseAmount);
  const sellingPaise = toPaise(input.sellingAmount);

  const profitPaise = sellingPaise - purchasePaise;

  // Zero or negative margin: no tax under Rule 32(5)
  if (profitPaise <= 0) {
    return {
      profitAmount: toRupees(profitPaise),
      gstAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      netProfit: toRupees(profitPaise)
    };
  }

  // Positive margin: 18% GST split into 9% CGST + 9% SGST
  const gstPaise = Math.round(profitPaise * GST_CONFIG.RATE);
  const cgstPaise = Math.round(gstPaise * GST_CONFIG.CGST_SHARE);
  const sgstPaise = gstPaise - cgstPaise; // Guarantees cgst + sgst === gst exactly
  const netProfitPaise = profitPaise - gstPaise;

  return {
    profitAmount: toRupees(profitPaise),
    gstAmount: toRupees(gstPaise),
    cgstAmount: toRupees(cgstPaise),
    sgstAmount: toRupees(sgstPaise),
    netProfit: toRupees(netProfitPaise)
  };
}

/**
 * Validates input and calculates GST in one step.
 * @param {Object} input
 * @returns {Object}
 */
function validateAndCalculate(input) {
  const validated = validateTransactionInput(input);
  const breakdown = calculateGst(validated);
  return {
    ...validated,
    ...breakdown
  };
}

module.exports = {
  GST_CONFIG,
  PAYMENT_METHODS,
  ValidationError,
  toPaise,
  toRupees,
  validateTransactionInput,
  calculateGst,
  validateAndCalculate
};
