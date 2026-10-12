const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Smart Move Traders Billing API',
    business: 'Smart Move Traders',
    address: 'Plot 8, GF, Bharathiyar Street, Maruthi Nagar, Phase 1, Thundalam, Chennai - 600077',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
