const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/razorpayController');
const { protect } = require('../middlewares/authMiddleware');
const { requireKyc } = require('../middlewares/requireKyc');

router.use(protect);
router.post('/create-order', requireKyc, createRazorpayOrder);
router.post('/verify', requireKyc, verifyRazorpayPayment);

module.exports = router;
