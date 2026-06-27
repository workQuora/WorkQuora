const Wallet = require('../models/Wallet');

/**
 * Middleware to ensure the user has sufficient wallet balance before proceeding.
 * Expects req.body.amount to be defined in paise, or looks for req.body.amount.
 * If req.body.paymentMethod is 'wallet', this middleware validates the balance.
 */
exports.requireSufficientBalance = async (req, res, next) => {
  try {
    const { amount, paymentMethod } = req.body;
    
    // Only check balance if the payment method is explicitly 'wallet'
    if (paymentMethod !== 'wallet') {
      return next();
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount provided' });
    }

    const wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found for this user' });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'INSUFFICIENT_BALANCE',
        message: `Insufficient wallet balance. You need ₹${amount/100}, but have ₹${wallet.balance/100}.` 
      });
    }

    // Attach wallet to req so controllers don't have to fetch it again if they don't want to
    req.wallet = wallet;
    next();
  } catch (error) {
    console.error('[requireSufficientBalance Middleware] Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while checking balance' });
  }
};
