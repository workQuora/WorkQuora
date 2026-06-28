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
    mobileVerified:  { type: Boolean, default: false },
    panVerified:     { type: Boolean, default: false },
    // Canonical field (double-a) — used throughout kycController & adminKycController
    aadhaarVerified: { type: Boolean, default: false },
    // Alias field (single-a) — kept in sync for legacy controllers (proposal, profile, dashboard)
    aadharVerified:  { type: Boolean, default: false },
    bankVerified:    { type: Boolean, default: false },
    selfieVerified:  { type: Boolean, default: false },

    documentUrls: {
      panDoc:     { publicId: String, hash: String },
      aadhaarDoc: { publicId: String, hash: String },
      bankDoc:    { publicId: String, hash: String },
      selfie:     { publicId: String, hash: String },
    },

    // Encrypted fields (AES-256-CBC)
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
      ifsc:          { type: String, default: null },
      holderName:    { type: String, default: null },
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    // Legacy OTP fields (used by KYC mobile verification flow)
    aadharOtp:       { type: String, default: null, select: false },
    aadharOtpExpiry: { type: Date,   default: null, select: false },

    submittedAt: { type: Date, default: null },
    verifiedAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

/**
 * Keep both spellings in sync on every save.
 * Uses async style (Mongoose v9 compatible — no `next` callback needed).
 */
kycSchema.pre('save', async function () {
  // If aadhaarVerified was modified, mirror to alias field
  if (this.isModified('aadhaarVerified')) {
    this.aadharVerified = this.aadhaarVerified;
  }
  // If only aadharVerified was modified (legacy path), push to canonical
  if (this.isModified('aadharVerified') && !this.isModified('aadhaarVerified')) {
    this.aadhaarVerified = this.aadharVerified;
  }
});

module.exports = mongoose.model('Kyc', kycSchema);
