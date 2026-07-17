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
// Phase A: requireKyc moved from router-level to per-route — it was
// previously applied to every route below, including the freelancer-only
// cash-received route. Client-side KYC requirement is now removed (commented
// below); the freelancer route keeps its gate.

// Client initiating payment for a job
// DEPRECATED (Phase A): client KYC requirement removed.
// router.post('/job/create-order', authorize('client'), requireKyc, requireSufficientBalance, createJobPaymentOrder);
router.post('/job/create-order', authorize('client'), requireSufficientBalance, createJobPaymentOrder);

// Client verifying razorpay payment
// DEPRECATED (Phase A): client KYC requirement removed.
// router.post('/job/verify', authorize('client'), requireKyc, verifyJobPayment);
router.post('/job/verify', authorize('client'), verifyJobPayment);

// Client releasing payment
// DEPRECATED (Phase A): client KYC requirement removed.
// router.post('/job/:jobId/release', authorize('client'), requireKyc, releasePayment);
router.post('/job/:jobId/release', authorize('client'), releasePayment);

// Worker claiming cash received — KYC stays mandatory for freelancers.
router.post('/job/:jobId/cash-received', authorize('freelancer'), requireKyc, cashReceivedWorker);

// Client confirming cash received
// DEPRECATED (Phase A): client KYC requirement removed.
// router.post('/job/:jobId/cash-confirm', authorize('client'), requireKyc, cashConfirmClient);
router.post('/job/:jobId/cash-confirm', authorize('client'), cashConfirmClient);

module.exports = router;