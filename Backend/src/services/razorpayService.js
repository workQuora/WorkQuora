const Razorpay = require('razorpay');
const crypto = require('crypto');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/**
 * Creates a Razorpay order.
 * @param {number} amountInPaise - Amount in smallest currency unit.
 * @param {string} currency - Currency code (e.g., 'INR').
 * @param {string} receiptId - Unique receipt identifier (e.g., job ID or transaction ID).
 * @returns {Promise<object>}
 */
exports.createOrder = async (amountInPaise, currency = 'INR', receiptId) => {
  const options = {
    amount: amountInPaise,
    currency,
    receipt: receiptId,
  };
  return await razorpay.orders.create(options);
};

/**
 * Verifies the Razorpay payment signature.
 * @param {string} orderId - Razorpay Order ID
 * @param {string} paymentId - Razorpay Payment ID
 * @param {string} signature - Razorpay Signature sent from client
 * @returns {boolean}
 */
exports.verifySignature = (orderId, paymentId, signature) => {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');
    
  return expectedSignature === signature;
};

/**
 * Initiates a payout to a bank account (Mock).
 * In production, this requires RazorpayX or a similar payouts API.
 * @param {object} accountDetails - Decrypted bank account details.
 * @param {number} amountInPaise - Amount to withdraw.
 * @returns {Promise<object>}
 */
exports.initiatePayout = async (accountDetails, amountInPaise) => {
  // TODO: Integrate RazorpayX Payouts API here in the future
  // For now, this is a stub that returns a fake payout ID to indicate manual admin processing is needed
  console.log(`[RazorpayX Stub] Initiating payout of ${amountInPaise / 100} to account ${accountDetails.accountNumber}`);
  return {
    success: true,
    payoutId: 'pout_dummy_' + Date.now(),
    status: 'pending_admin_approval'
  };
};

/**
 * Fetches payment details from Razorpay
 */
exports.fetchPayment = async (paymentId) => {
  return await razorpay.payments.fetch(paymentId);
};
