const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getSummary, getMonthlyBreakdown } = require('../controllers/reportController');

router.use(authenticate);

router.get('/summary', getSummary);
router.get('/monthly', getMonthlyBreakdown);

module.exports = router;
