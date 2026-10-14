/**
 * validate.js
 * Request body validation middleware.
 */

const { validateTransactionInput, ValidationError } = require('../services/gstService');
const { INVOICE_STATUSES } = require('../config/constants');

function validateCreateInvoice(req, res, next) {
  try {
    let { quantity, purchaseAmount, sellingAmount, paymentMethod, items } = req.body;

    if ((quantity === undefined || quantity === null || quantity === '') && Array.isArray(items) && items.length > 0) {
      quantity = items.reduce((acc, curr) => acc + (parseInt(curr.quantity, 10) || 0), 0);
      req.body.quantity = quantity;
    }

    validateTransactionInput({ quantity, purchaseAmount, sellingAmount, paymentMethod });

    if (req.body.status && !INVOICE_STATUSES.includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${INVOICE_STATUSES.join(', ')}`
      });
    }

    next();
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    next(err);
  }
}

function validateUpdateInvoice(req, res, next) {
  try {
    const { quantity, purchaseAmount, sellingAmount, paymentMethod, status } = req.body;

    if (quantity !== undefined) {
      const q = Number(quantity);
      if (!Number.isInteger(q) || q <= 0) {
        return res.status(400).json({ success: false, error: 'quantity must be a positive whole number' });
      }
    }

    if (purchaseAmount !== undefined) {
      const p = Number(purchaseAmount);
      if (typeof purchaseAmount === 'boolean' || isNaN(p) || p < 0) {
        return res.status(400).json({ success: false, error: 'purchaseAmount must be a non-negative number' });
      }
    }

    if (sellingAmount !== undefined) {
      const s = Number(sellingAmount);
      if (typeof sellingAmount === 'boolean' || isNaN(s) || s < 0) {
        return res.status(400).json({ success: false, error: 'sellingAmount must be a non-negative number' });
      }
    }

    if (paymentMethod !== undefined) {
      const { PAYMENT_METHODS } = require('../config/constants');
      if (!PAYMENT_METHODS.includes(paymentMethod)) {
        return res.status(400).json({ success: false, error: `paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}` });
      }
    }

    if (status !== undefined && !INVOICE_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of: ${INVOICE_STATUSES.join(', ')}` });
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  validateCreateInvoice,
  validateUpdateInvoice
};
