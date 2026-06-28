const Kyc = require('../models/Kyc');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const storageService = require('../services/storageService');
const smsService = require('../services/smsService');
const digilockerService = require('../services/digilockerService');
const encryption = require('../utils/encryption');

// Helper to check global KYC status and update atomically
const checkAndUpdateGlobalStatus = async (kycId) => {
  const kyc = await Kyc.findById(kycId);
  if (!kyc) return;

  const allVerified = kyc.mobileVerified && kyc.panVerified && kyc.aadhaarVerified && kyc.bankVerified && kyc.selfieVerified;
  const coreVerified = kyc.panVerified && kyc.aadhaarVerified;

  if (allVerified && kyc.status !== 'verified') {
    await Kyc.findByIdAndUpdate(kycId, {
      status: 'verified',
      verifiedAt: new Date(),
    });
    await User.findByIdAndUpdate(kyc.userId, { isVerified: true, kycVerified: true });
  } else if (coreVerified && kyc.status === 'rejected') {
    // Promote back from rejected if core steps pass
    await Kyc.findByIdAndUpdate(kycId, { status: 'pending' });
    await User.findByIdAndUpdate(kyc.userId, { kycVerified: false });
  }
};

// @desc    Send Mobile OTP
// @route   POST /api/v1/kyc/otp/send
// @access  Private
exports.sendOtp = async (req, res, next) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber) return res.status(400).json({ success: false, message: 'Mobile number is required' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await Kyc.findOneAndUpdate(
      { userId: req.user.id },
      { aadharOtp: otp, aadharOtpExpiry: otpExpiry, status: 'pending' },
      { upsert: true, new: true }
    );
    
    // Also save mobileNumber on user model temporarily if not set
    await User.findByIdAndUpdate(req.user.id, { mobileNumber });

    await smsService.sendOtp(mobileNumber, otp);

    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Mobile OTP
// @route   POST /api/v1/kyc/otp/verify
// @access  Private
exports.verifyOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

    const kyc = await Kyc.findOne({ userId: req.user.id }).select('+aadharOtp +aadharOtpExpiry');
    if (!kyc) return res.status(404).json({ success: false, message: 'KYC record not found' });
    if (kyc.mobileVerified) return res.status(400).json({ success: false, message: 'Mobile already verified' });

    if (kyc.aadharOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    if (new Date(kyc.aadharOtpExpiry) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    kyc.mobileVerified = true;
    kyc.aadharOtp = null;
    kyc.aadharOtpExpiry = null;
    await kyc.save();
    
    await checkAndUpdateGlobalStatus(kyc._id);

    res.status(200).json({ success: true, message: 'Mobile verified successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit PAN Details
// @route   POST /api/v1/kyc/pan/submit
// @access  Private
exports.submitPan = async (req, res, next) => {
  try {
    const { panNumber } = req.body;
    if (!panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Valid 10-character PAN number is required' });
    }

    const kyc = await Kyc.findOne({ userId: req.user.id });
    if (!kyc) return res.status(404).json({ success: false, message: 'KYC record not found' });
    if (kyc.panVerified) return res.status(400).json({ success: false, message: 'PAN already verified' });

    let panImageData = null;
    if (req.file) {
      panImageData = await storageService.uploadFile(req.file.buffer, `kyc/pan/${req.user.id}`, { type: 'authenticated', stripExif: true });
    }

    kyc.panNumber = encryption.encrypt(panNumber.toUpperCase());
    if (panImageData) {
      kyc.documentUrls.panDoc = { publicId: panImageData.publicId, hash: req.file.hash };
    }
    
    // Simulate manual review logic here: automatically approve in dev environment if requested
    // In production, an admin would review this via /api/admin/kyc/:id/review
    kyc.panVerified = true; // Auto-verify for demonstration
    await kyc.save();
    
    await checkAndUpdateGlobalStatus(kyc._id);

    res.status(200).json({ success: true, message: 'PAN details submitted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit Aadhaar Details (Manual Review)
// @route   POST /api/v1/kyc/aadhaar/submit
// @access  Private
exports.submitAadhaar = async (req, res, next) => {
  try {
    const { aadhaarNumber } = req.body;
    if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({ success: false, message: 'Valid 12-digit Aadhaar number is required' });
    }

    let kyc = await Kyc.findOne({ userId: req.user.id });
    if (!kyc) kyc = await Kyc.create({ userId: req.user.id });
    
    if (kyc.aadhaarVerified) return res.status(400).json({ success: false, message: 'Aadhaar already verified' });

    let aadhaarImageData = null;
    if (req.file) {
      aadhaarImageData = await storageService.uploadFile(req.file.buffer, `kyc/aadhaar/${req.user.id}`, { type: 'authenticated', stripExif: true });
    }

    kyc.aadhaarNumber = encryption.encrypt(aadhaarNumber);
    if (aadhaarImageData) {
      kyc.documentUrls.aadhaarDoc = { publicId: aadhaarImageData.publicId, hash: req.file.hash };
    }
    
    // Auto-verify for dev demonstration just like PAN
    kyc.aadhaarVerified = true; 
    await kyc.save();
    
    await checkAndUpdateGlobalStatus(kyc._id);

    res.status(200).json({ success: true, message: 'Aadhaar details submitted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Initialize Aadhaar DigiLocker Flow
// @route   GET /api/v1/kyc/aadhaar/init
// @access  Private
exports.aadhaarInit = async (req, res, next) => {
  try {
    const url = digilockerService.getOAuthUrl(req.user.id);
    res.status(200).json({ success: true, url });
  } catch (error) {
    next(error);
  }
};

// @desc    Callback for DigiLocker Aadhaar
// @route   POST /api/v1/kyc/aadhaar/callback
// @access  Private
exports.aadhaarCallback = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'OAuth code required' });

    const aadhaarData = await digilockerService.exchangeCodeAndFetchAadhaar(code);
    
    let kyc = await Kyc.findOne({ userId: req.user.id });
    if (!kyc) kyc = await Kyc.create({ userId: req.user.id });

    kyc.aadhaarVerified = true;
    kyc.documentUrls.aadhaarDoc = aadhaarData.documentUrl || 'verified_by_digilocker';
    await kyc.save();
    
    await checkAndUpdateGlobalStatus(kyc._id);

    res.status(200).json({ success: true, message: 'Aadhaar verified successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit Bank Details
// @route   POST /api/v1/kyc/bank/submit
// @access  Private
exports.submitBank = async (req, res, next) => {
  try {
    const { accountNumber, ifsc, holderName, pin } = req.body;
    if (!accountNumber || !ifsc || !holderName) {
      return res.status(400).json({ success: false, message: 'All bank details are required' });
    }
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid IFSC Code format' });
    }

    const kyc = await Kyc.findOne({ userId: req.user.id });
    if (!kyc) return res.status(404).json({ success: false, message: 'KYC record not found' });
    if (kyc.bankVerified) return res.status(400).json({ success: false, message: 'Bank already verified' });

    let bankImageData = null;
    if (req.file) {
      bankImageData = await storageService.uploadFile(req.file.buffer, `kyc/bank/${req.user.id}`, { type: 'authenticated', stripExif: true });
    }

    kyc.bankAccount = {
      accountNumber: encryption.encrypt(accountNumber),
      ifsc: ifsc.toUpperCase(),
      holderName
    };
    if (bankImageData) {
      kyc.documentUrls.bankDoc = { publicId: bankImageData.publicId, hash: req.file.hash };
    }
    
    // Set pending review
    kyc.bankVerified = false;
    await kyc.save();
    
    // Also update Wallet
    const wallet = await Wallet.findOne({ userId: req.user.id });
    if (wallet) {
      wallet.bankAccounts.push({
        bankName: 'Linked Bank',
        accountNumber: accountNumber.slice(-4),
        ifscCode: ifsc.toUpperCase(),
        isPrimary: wallet.bankAccounts.length === 0,
      });
      if (pin) wallet.withdrawalPin = pin;
      await wallet.save();
    }
    
    await checkAndUpdateGlobalStatus(kyc._id);

    res.status(200).json({ success: true, message: 'Bank details submitted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit Selfie
// @route   POST /api/v1/kyc/selfie/submit
// @access  Private
exports.submitSelfie = async (req, res, next) => {
  try {
    const kyc = await Kyc.findOne({ userId: req.user.id });
    if (!kyc) return res.status(404).json({ success: false, message: 'KYC not found' });
    if (kyc.selfieVerified) return res.status(400).json({ success: false, message: 'Selfie already verified' });

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Selfie image is required' });
    }

    const selfieData = await storageService.uploadFile(req.file.buffer, `kyc/selfie/${req.user.id}`, { type: 'authenticated', stripExif: true });
    
    kyc.documentUrls.selfie = { publicId: selfieData.publicId, hash: req.file.hash };
    kyc.selfieVerified = true; // Auto-verify for dev
    await kyc.save();
    
    await checkAndUpdateGlobalStatus(kyc._id);
    
    // Fire Socket event
    const io = req.app.get('io');
    if (io) io.to(req.user.id).emit('kyc:update', kyc);

    res.status(200).json({ success: true, message: 'Selfie submitted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get KYC Status
// @route   GET /api/v1/kyc/status
// @access  Private
exports.getStatus = async (req, res, next) => {
  try {
    const kyc = await Kyc.findOne({ userId: req.user.id });
    if (!kyc) return res.status(200).json({ success: true, data: null });
    
    res.status(200).json({ success: true, data: kyc });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset KYC (For testing)
// @route   POST /api/v1/kyc/reset
// @access  Private
exports.resetKyc = async (req, res, next) => {
  try {
    await Kyc.findOneAndUpdate({ userId: req.user.id }, {
      status: 'pending',
      mobileVerified: false,
      panVerified: false,
      aadhaarVerified: false,
      bankVerified: false,
      selfieVerified: false,
      panNumber: null,
      bankAccount: {},
      documentUrls: {}
    });
    await User.findByIdAndUpdate(req.user.id, { isVerified: false, kycVerified: false });
    res.status(200).json({ success: true, message: 'KYC Reset' });
  } catch (error) {
    next(error);
  }
};