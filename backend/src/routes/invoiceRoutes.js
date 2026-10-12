const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateCreateInvoice, validateUpdateInvoice } = require('../middleware/validate');
const {
  listInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
} = require('../controllers/invoiceController');

router.use(authenticate);

router.get('/', listInvoices);
router.get('/:id', getInvoiceById);
router.post('/', validateCreateInvoice, createInvoice);
router.patch('/:id', validateUpdateInvoice, updateInvoice);
router.delete('/:id', deleteInvoice);

module.exports = router;
