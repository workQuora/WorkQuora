const Kyc = require('../../../models/Kyc');
const User = require('../../../models/User');
const { createAuditLog } = require('../utils/adminAuditLogger');
const { createNotification } = require('../../../utils/notification');

// Helper to recalculate status
const recalculateKycStatus = async (kycId, io) => {
  const kyc = await Kyc.findById(kycId);
  if (!kyc) return;

  const wasVerified = kyc.status === 'verified';
  const isVerified = kyc.isMobileVerified && kyc.panVerified && kyc.aadhaarVerified && kyc.bankVerified && kyc.selfieVerified;

  if (isVerified) {
    kyc.status = 'verified';
    kyc.verifiedAt = new Date();
    await kyc.save();
    await User.findByIdAndUpdate(kyc.userId, { isKycVerified: true });

    if (!wasVerified) {
      await createNotification({
        recipient: kyc.userId,
        type: 'kyc_update',
        message: 'Your KYC verification is complete!',
        io,
      }).catch(() => {});
    }
  } else {
    // If any step was rejected
    kyc.status = 'pending';
    await kyc.save();
    await User.findByIdAndUpdate(kyc.userId, { isKycVerified: false });
  }

  // Emit socket update
  if (io) {
    io.to(kyc.userId.toString()).emit('kyc:update', kyc);
  }
};

// @desc    Get all pending KYC submissions
// @route   GET /api/v1/admin/kyc/pending
// @access  Private (Admin)
exports.getPendingKycs = async (req, res, next) => {
  try {
    // Basic admin check (could be robust middleware in prod)
    if (!req.admin || (req.admin.role !== 'ADMIN' && req.admin.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const pendingKycs = await Kyc.find({ status: 'pending' }).populate('userId', 'name email role');
    res.status(200).json({ success: true, data: pendingKycs });
  } catch (error) {
    next(error);
  }
};

// @desc    Review a specific KYC step
// @route   PATCH /api/v1/admin/kyc/:userId/review
// @access  Private (Admin)
exports.reviewKycStep = async (req, res, next) => {
  try {
    if (!req.admin || (req.admin.role !== 'ADMIN' && req.admin.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { step, decision, reason } = req.body;
    // step can be 'pan', 'bank', 'selfie'
    // decision can be 'approve' or 'reject'

    const kyc = await Kyc.findOne({ userId: req.params.userId });
    if (!kyc) return res.status(404).json({ success: false, message: 'KYC record not found' });

    const isApprove = decision === 'approve';

    if (step === 'pan') {
      kyc.panVerified = isApprove;
    } else if (step === 'bank') {
      kyc.bankVerified = isApprove;
    } else if (step === 'selfie') {
      kyc.selfieVerified = isApprove;
    } else if (step === 'aadhaar') {
      kyc.aadhaarVerified = isApprove;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid KYC step' });
    }

    if (!isApprove) {
      kyc.rejectionReason = reason || `${step} was rejected. Please resubmit.`;
      
      const storageService = require('../../../services/storageService');
      
      // Delete the orphaned document from Cloudinary if it exists
      if (step === 'pan' && kyc.documentUrls?.panDoc?.publicId) {
        await storageService.deleteFile(kyc.documentUrls.panDoc.publicId).catch(console.error);
        kyc.documentUrls.panDoc = undefined;
      } else if (step === 'bank' && kyc.documentUrls?.bankDoc?.publicId) {
        await storageService.deleteFile(kyc.documentUrls.bankDoc.publicId).catch(console.error);
        kyc.documentUrls.bankDoc = undefined;
      } else if (step === 'selfie' && kyc.documentUrls?.selfie?.publicId) {
        await storageService.deleteFile(kyc.documentUrls.selfie.publicId).catch(console.error);
        kyc.documentUrls.selfie = undefined;
      } else if (step === 'aadhaar' && kyc.documentUrls?.aadhaarDoc?.publicId) {
        await storageService.deleteFile(kyc.documentUrls.aadhaarDoc.publicId).catch(console.error);
        kyc.documentUrls.aadhaarDoc = undefined;
      }
    }

    await kyc.save();

    const io = req.app.get('io');
    await recalculateKycStatus(kyc._id, io);

    if (!isApprove) {
      const stepLabel = step.charAt(0).toUpperCase() + step.slice(1);
      await createNotification({
        recipient: kyc.userId,
        type: 'kyc_update',
        message: `Your ${stepLabel} verification was rejected: ${kyc.rejectionReason}`,
        io,
      }).catch(() => {});
    }

    await createAuditLog({
      admin: req.admin,
      actionType: 'USER_KYC_MODIFY',
      targetType: 'USER',
      targetId: kyc.userId,
      description: `KYC step "${step}" ${isApprove ? 'approved' : 'rejected'} for user ${kyc.userId}.${!isApprove ? ` Reason: ${kyc.rejectionReason}` : ''}`,
      newData: { step, decision },
      req,
      severity: 'HIGH',
    });

    res.status(200).json({ success: true, message: `KYC step ${step} marked as ${decision}` });
  } catch (error) {
    next(error);
  }
};
