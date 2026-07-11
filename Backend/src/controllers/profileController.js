const User = require('../models/User');
const Kyc = require('../models/Kyc');
const BankDetails = require('../models/BankDetails');
const Earnings = require('../models/Earnings');
const cloudinary = require('../config/cloudinary');
const Job = require('../models/Job');
const encryption = require('../utils/encryption');

// GET /profile/me
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.id = user._id;
    user.earnings = await Earnings.findOne({ userId: req.user.id }).lean();
    user.kyc = await Kyc.findOne({ userId: req.user.id }).lean();
    user.bankDetails = await BankDetails.findOne({ userId: req.user.id }).lean();

    // kycVerified = dedicated KYC flag (Aadhaar + PAN) — use as truth, fallback to kyc record
    const kycVerified = !!(user.isKycVerified || (user.kyc && user.kyc.aadhaarVerified && user.kyc.panVerified));

    res.status(200).json({
      success: true,
      data: {
        ...user,
        skills:        user.skills        || [],
        bio:           user.bio           || '',
        title:         user.title         || '',
        hourlyRate:    user.hourlyRate     || 0,
        averageRating: user.averageRating  || 0,
        reviewsCount:  user.totalJobsCompleted || 0,
        isAvailable:   user.isAvailable   ?? true,
        avatar:        user.avatar        || user.profilePic || null,
        location:      user.location      || null,
        serviceRadius: user.serviceRadius || 25,
        isVerified:    kycVerified,
        kycVerified:   kycVerified,
        isKycVerified: kycVerified,
        isEmailVerified: user.isEmailVerified,
        maskedAadhaar: (() => {
          if (!user.kyc?.aadhaarNumber) return '';
          try {
            const dec = encryption.decrypt(user.kyc.aadhaarNumber);
            return dec ? `**** **** ${dec.slice(-4)}` : '';
          } catch (e) {
            return '';
          }
        })(),
        maskedPan: (() => {
          if (!user.kyc?.panNumber) return '';
          try {
            const dec = encryption.decrypt(user.kyc.panNumber);
            return dec ? `${dec.slice(0, 5)}****${dec.slice(-1)}` : '';
          } catch (e) {
            return '';
          }
        })(),
        kyc: user.kyc ? {
          status: user.kyc.status,
          aadhaarVerified: user.kyc.aadhaarVerified,
          panVerified: user.kyc.panVerified,
        } : null,
      },
    });
  } catch (error) { next(error); }
};

// PUT /profile/update
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, title, skills, hourlyRate, isAvailable, serviceRadius, username, twoFactorEnabled, address, city, coordinates, email, mobileNumber, dateOfBirth } = req.body;

    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date of birth' });
      }
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        return res.status(400).json({ success: false, message: 'You must be at least 18 years old' });
      }
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (name !== undefined) user.name = name;
    if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;
    if (bio !== undefined) user.bio = bio;
    if (title !== undefined) user.title = title;
    if (Array.isArray(skills)) user.skills = skills;
    if (hourlyRate !== undefined) user.hourlyRate = Number(hourlyRate);
    if (isAvailable !== undefined) user.isAvailable = isAvailable;
    if (serviceRadius !== undefined) user.serviceRadius = Number(serviceRadius);

    if (address !== undefined) user.location.address = address;
    if (city !== undefined) {
      // Normalize city label to prevent inconsistencies
      user.location.city = city;
    }
    if (coordinates !== undefined) {
      user.location.coordinates = coordinates;
    }

    if (email) {
      const emailLower = email.toLowerCase().trim();
      const existing = await User.findOne({ email: emailLower, _id: { $ne: req.user.id } });
      if (existing) return res.status(400).json({ success: false, message: 'Email is already in use by another account' });
      user.email = emailLower;
    }

    if (mobileNumber) {
      user.mobileNumber = mobileNumber;
      // Also update Kyc record if it exists
      await Kyc.findOneAndUpdate({ userId: req.user.id }, { mobileNumber });
    }

    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: req.user.id } });
      if (existing) return res.status(400).json({ success: false, message: 'Username is already taken' });
      user.username = username;
    }

    await user.save();
    res.status(200).json({ success: true, message: 'Profile updated' });
  } catch (error) { next(error); }
};

// POST /profile/photo
exports.uploadProfilePhoto = async (req, res, next) => {
  try {
    const storageService = require('../services/storageService');
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const result = await storageService.uploadFile(req.file.buffer, `profile-pictures/${req.user.id}`, {
      transformation: { width: 500, crop: 'scale' }
    });

    await User.findByIdAndUpdate(req.user.id, { 
      profilePic: result.secureUrl, 
      avatar: result.secureUrl 
    });

    res.status(200).json({ success: true, message: 'Photo uploaded', profilePic: result.secureUrl });
  } catch (error) { next(error); }
};

// POST /profile/kyc
exports.updateKyc = async (req, res, next) => {
  try {
    const { aadharNumber, panCard } = req.body;
    if (!aadharNumber) return res.status(400).json({ success: false, message: 'Aadhar required' });

    const existing = await Kyc.findOne({
      $or: [
        { aadharNumber },
        ...(panCard ? [{ panCard: panCard.toUpperCase() }] : [])
      ],
      userId: { $ne: req.user.id }
    });
    if (existing) return res.status(400).json({ success: false, message: 'Aadhar/PAN already registered' });

    const kyc = await Kyc.findOneAndUpdate(
      { userId: req.user.id },
      { aadharNumber, panCard: panCard?.toUpperCase(), status: 'pending' },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'KYC submitted', data: kyc });
  } catch (error) {
    next(error);
  }
};

// POST /profile/bank
exports.updateBankDetails = async (req, res, next) => {
  try {
    const { accountNo, ifscCode, bankName } = req.body;
    if (!accountNo || !ifscCode || !bankName)
      return res.status(400).json({ success: false, message: 'All bank fields required' });

    const bank = await BankDetails.findOneAndUpdate(
      { userId: req.user.id },
      { accountNo, ifscCode: ifscCode.toUpperCase(), bankName },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: 'Bank details updated', data: bank });
  } catch (error) { next(error); }
};

// @desc    Get public freelancer profile
// @route   GET /api/v1/profile/user/:userId
// @access  Public
exports.getPublicProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(404).json({ success: false, message: 'User not found (invalid id)' });
    }
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.id = user._id;
    user.earnings = await Earnings.findOne({ userId: user.id }).lean();
    user.kyc = await Kyc.findOne({ userId: user.id }).lean();
    user.bankDetails = await BankDetails.findOne({ userId: user.id }).lean();

    // Get active jobs count from MongoDB
    const Proposal = require('../models/Proposal');
    const activeProposals = await Proposal.countDocuments({ freelancer: user.id, status: 'accepted' });
    const completedProposals = await Proposal.countDocuments({ freelancer: user.id, status: { $in: ['completed'] } });
    const totalProposals = await Proposal.countDocuments({ freelancer: user.id });

    // Check if user was active recently (within last 15 minutes based on updatedAt)
    const isActive = user.updatedAt ? (Date.now() - new Date(user.updatedAt).getTime()) < 15 * 60 * 1000 : false;

    // Build stats based on role
    const stats = user.role === 'CLIENT' ? {
      postedJobs: await Job.countDocuments({ client: user.id }),
      activeJobs: await Job.countDocuments({ client: user.id, status: 'in-progress' }),
      completedJobs: await Job.countDocuments({ client: user.id, status: 'completed' }),
    } : {
      activeProjects: activeProposals,
      completedProjects: user.earnings?.completedJobs || completedProposals,
      totalProposals,
    };

    // kycVerified = dedicated KYC flag (Aadhaar + PAN) — use as truth, fallback to kyc record
    const kycVerified = !!(user.isKycVerified || (user.kyc && user.kyc.aadhaarVerified && user.kyc.panVerified));

    res.status(200).json({
      success: true,
      data: {
        ...user,
        id: user.id,
        profilePic: user.profilePic || user.avatar,
        createdAt: user.createdAt,
        isVerified: kycVerified,
        kycVerified: kycVerified,
        isKycVerified: kycVerified,
        isEmailVerified: user.isEmailVerified,
        kyc: user.kyc ? { status: user.kyc.status, aadhaarVerified: user.kyc.aadhaarVerified, panVerified: user.kyc.panVerified } : null,
        bankDetails: user.bankDetails ? { id: user.bankDetails._id } : null,
        earnings: user.earnings ? { completedJobs: user.earnings.completedJobs, allTimeIncome: user.earnings.allTimeIncome, rating: user.averageRating } : null,
        stats,
        isActive,
        verifications: {
          email: !!user.email,
          phone: !!user.mobileNumber,
          aadhar: user.kyc?.aadhaarVerified || false,
          pan: user.kyc?.panVerified || false,
          bank: !!user.bankDetails,
          kycStatus: user.kyc?.status || 'not_submitted',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Block a user
// @route   POST /api/v1/profile/block/:userId
// @access  Private
exports.blockUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    if (targetUserId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User to block not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user.blockedUsers) {
      user.blockedUsers = [];
    }

    if (!user.blockedUsers.includes(targetUserId)) {
      user.blockedUsers.push(targetUserId);
      await user.save();
    }

    res.status(200).json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Unblock a user
// @route   POST /api/v1/profile/unblock/:userId
// @access  Private
exports.unblockUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const user = await User.findById(req.user.id);
    
    if (user.blockedUsers) {
      user.blockedUsers = user.blockedUsers.filter(id => id !== targetUserId);
      await user.save();
    }

    res.status(200).json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /profile/photo — remove the user's avatar (Phase 5, worker app)
exports.deleteProfilePhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.profilePic = null;
    await user.save();
    res.status(200).json({ success: true, message: 'Photo removed', profilePic: null });
  } catch (e) { next(e); }
};
