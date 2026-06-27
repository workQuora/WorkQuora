const mongoose = require('mongoose');
const crypto = require('crypto');

const kycSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => crypto.randomUUID(),
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    mobileVerified: { type: Boolean, default: false },
    panVerified: { type: Boolean, default: false },
    aadhaarVerified: { type: Boolean, default: false },
    bankVerified: { type: Boolean, default: false },
    selfieVerified: { type: Boolean, default: false },
    
    documentUrls: {
      panDoc: { publicId: String, hash: String },
      aadhaarDoc: { publicId: String, hash: String },
      bankDoc: { publicId: String, hash: String },
      selfie: { publicId: String, hash: String },
    },
    
    // Encrypted field
    panNumber: {
      type: String,
      default: null,
    },
    
    aadhaarNumber: {
      type: String,
      default: null,
    },
    
    bankAccount: {
      accountNumber: { type: String, default: null }, // Encrypted
      ifsc: { type: String, default: null },
      holderName: { type: String, default: null },
    },
    
    rejectionReason: {
      type: String,
      default: null,
    },
    
    // Legacy fields for OTP flow / compatibility if needed during migration
    aadharOtp: { type: String, default: null, select: false },
    aadharOtpExpiry: { type: Date, default: null, select: false },

    submittedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Kyc', kycSchema);
