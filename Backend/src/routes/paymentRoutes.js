const express = require('express');
const router = express.Router();
const { 
  createJobPaymentOrder, 
  verifyJobPayment, 
  releasePayment, 
  cashReceivedWorker, 
  cashConfirmClient, 
  razorpayWebhook 
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { requireKyc } = require('../middlewares/requireKyc');
const { requireSufficientBalance } = require('../middlewares/requireSufficientBalance');

// Webhook (Public, no auth)
router.post('/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

// Protected Routes
router.use(protect);
router.use(requireKyc);

// Client initiating payment for a job
router.post('/job/create-order', authorize('client'), requireSufficientBalance, createJobPaymentOrder);

// Client verifying razorpay payment
router.post('/job/verify', authorize('client'), verifyJobPayment);

// Client releasing payment
router.post('/job/:jobId/release', authorize('client'), releasePayment);

// Worker claiming cash received
router.post('/job/:jobId/cash-received', authorize('freelancer'), cashReceivedWorker);

// Client confirming cash received
router.post('/job/:jobId/cash-confirm', authorize('client'), cashConfirmClient);

module.exports = router;