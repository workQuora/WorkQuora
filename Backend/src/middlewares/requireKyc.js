const Kyc = require('../models/Kyc');

/**
 * Middleware to check if a user has completed the full KYC process.
 * If not, blocks the request and returns a 403.
 */
exports.requireKyc = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const kyc = await Kyc.findOne({ userId: req.user.id });
    
    if (!kyc || kyc.status !== 'verified') {
      return res.status(403).json({
        success: false,
        error: 'KYC_REQUIRED',
        message: 'Complete your KYC verification to continue.'
      });
    }

    next();
  } catch (error) {
    console.error('[requireKyc Middleware] Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during KYC verification check' });
  }
};
