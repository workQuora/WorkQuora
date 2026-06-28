const Kyc = require('../models/Kyc');

/**
 * Middleware to check if a user has completed the core KYC steps required
 * by the Engineering Bible (Vol 2): Aadhaar + PAN verification.
 *
 * The full `status === 'verified'` (which also requires bank + selfie) is a
 * trust badge shown in the UI but must NOT block the core job/proposal flow.
 * A user without bank/selfie can still post jobs and bid — they just won't
 * have the "Fully Verified" badge.
 */
exports.requireKyc = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const kyc = await Kyc.findOne({ userId: req.user.id });

    // Core KYC: Aadhaar + PAN must be verified (Vol 2 requirement)
    const coreKycPassed = kyc && kyc.aadhaarVerified && kyc.panVerified;

    if (!coreKycPassed) {
      return res.status(403).json({
        success: false,
        error: 'KYC_REQUIRED',
        message: 'Complete your KYC verification (Aadhaar + PAN) to continue.',
        steps: {
          aadhaarVerified: kyc?.aadhaarVerified || false,
          panVerified:     kyc?.panVerified     || false,
        },
      });
    }

    next();
  } catch (error) {
    console.error('[requireKyc Middleware] Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during KYC verification check' });
  }
};

/**
 * Middleware for routes that require FULL KYC (all 5 steps).
 * Use this for payment withdrawal, admin-level operations etc.
 */
exports.requireFullKyc = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const kyc = await Kyc.findOne({ userId: req.user.id });

    if (!kyc || kyc.status !== 'verified') {
      return res.status(403).json({
        success: false,
        error: 'FULL_KYC_REQUIRED',
        message: 'Complete all KYC steps (Aadhaar, PAN, Bank, Selfie) to access this feature.',
      });
    }

    next();
  } catch (error) {
    console.error('[requireFullKyc Middleware] Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during KYC verification check' });
  }
};
