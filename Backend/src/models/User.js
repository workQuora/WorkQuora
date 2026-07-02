const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => crypto.randomUUID(),
    },
    name: { type: String, required: [true, 'Name is required'], trim: true },
    
    // Email Trackers
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    isEmailEdited: { type: Boolean, default: false }, // Rule: Can only edit email once
    
    // Username (optional, unique)
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    
    // Mobile Trackers
    mobileNumber: { type: String },
    isMobileEdited: { type: Boolean, default: false }, // Rule: Can only edit mobile once
    isMobileVerified: { type: Boolean, default: false },
    mobileVerified: { type: Boolean, default: false },
    mobileOtp: { type: String, default: null, select: false },
    mobileOtpExpires: { type: Date, default: null, select: false },
    mobileOtpCount: { type: Number, default: 0 },
    mobileOtpLastSent: { type: Date, default: null },
    
    password: { type: String, required: [true, 'Password is required'], select: false },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: 'OTHER' },
    role: { type: String, enum: ['CLIENT', 'FREELANCER', 'ADMIN'], default: 'CLIENT' },
    avatar: { type: String, default: null },
    profilePic: { type: String, default: null },
    
    // Profile information
    title: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    normalizedSkills: { type: [String], default: [] },
    skillTags: { type: [String], default: [] },
    hourlyRate: { type: Number, default: 0 },
    
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
      address: String,
      city: String,
    },
    
    serviceRadius: { type: Number, default: 25 },
    isAvailable: { type: Boolean, default: true },
    availabilityStatus: { type: String, enum: ['AVAILABLE', 'ONLINE', 'BUSY', 'ON_JOB', 'VACATION', 'OFFLINE'], default: 'AVAILABLE' },
    averageRating: { type: Number, default: 0 },
    totalJobsCompleted: { type: Number, default: 0 },
    // Bible Vol 8: Trust score (0–100) computed from ratings, KYC, job history, response time
    trustScore: { type: Number, default: 0, min: 0, max: 100 },
    isEmailVerified: { type: Boolean, default: false },   // Email OTP verified
    isKycVerified: { type: Boolean, default: false },  // Aadhaar + PAN both verified
    
    // Performance Metrics (Vol 8)
    jobSuccessRate: { type: Number, default: 95, min: 0, max: 100 },
    experienceYears: { type: Number, default: 2 },
    responseTimeMinutes: { type: Number, default: 30 },
    cancellationRate: { type: Number, default: 2, min: 0, max: 100 },
    
    // Utilization / Marketplace Balancer
    pendingJobsCount: { type: Number, default: 0 },
    recentJobsReceivedCount: { type: Number, default: 0 },
    
    // Security & OTP fields
    twoFactorEnabled: { type: Boolean, default: false },
    resetPasswordOtp: { type: String, default: null, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false },
    blockedUsers: { type: [String], default: [] },
    withdrawalPin: { type: String, default: null, select: false },
    
    // Security Hardening Parameters (Phase 2)
    passwordHistory: { type: [String], default: [] },
    passwordChangedAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    otpLockedUntil: { type: Date, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    
    // Social Logins
    googleId: { type: String, default: null },
    facebookId: { type: String, default: null }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for compatibility with user.id
userSchema.virtual('id').get(function () {
  return this._id;
});

userSchema.virtual('isVerified')
  .get(function() { return this.isEmailVerified; })
  .set(function(val) { this.isEmailVerified = val; });

userSchema.virtual('kycVerified')
  .get(function() { return this.isKycVerified; })
  .set(function(val) { this.isKycVerified = val; });

// 2dsphere index for radius search (Geo-spatial)
userSchema.index({ location: '2dsphere' });

// Advanced Search Indexing (Phase 3 compliance)
userSchema.index(
  { name: 'text', skills: 'text', title: 'text', bio: 'text' },
  { weights: { name: 10, skills: 5, title: 3, bio: 1 }, name: 'UserTextSearchIndex' }
);
userSchema.index({ role: 1, availabilityStatus: 1, rating: -1 });

// Hash password before saving (Fixed for latest Mongoose)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Normalize skills to lowercase and trim on saving
userSchema.pre('save', function () {
  if (this.isModified('skills')) {
    this.normalizedSkills = (this.skills || []).map(s => s.toLowerCase().trim());
    this.skillTags = this.skills || [];
  }
});

// Compare password utility for Login
userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
module.exports = User;