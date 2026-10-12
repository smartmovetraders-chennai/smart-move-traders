const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/businessController');

router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

module.exports = router;
