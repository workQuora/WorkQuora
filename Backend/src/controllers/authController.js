const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Earnings = require('../models/Earnings');
const Kyc = require('../models/Kyc');
const BankDetails = require('../models/BankDetails');
const Session = require('../models/Session');
const Job = require('../models/Job');
const Review = require('../models/Review');
const { parseUserAgent } = require('../utils/uaParser');
const { getLocationFromIp } = require('../utils/ipGeolocation');
const { createAuditLog } = require('../utils/auditLogger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const sendEmail = require('../utils/sendEmail');
const smsService = require('../services/smsService');
const crypto = require('crypto');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Derives a unique username from an email's local-part (e.g.
// "prashant.jha@gmail.com" -> "prashant.jha"), appending a numeric suffix
// ("prashant.jha1", "prashant.jha2", ...) if it's already taken.
const generateUniqueUsername = async (rawLocalPart) => {
  let base = (rawLocalPart || '').toLowerCase().replace(/[^a-z0-9._]/g, '');
  if (!base) base = 'user';
  if (base.length < 3) base = base.padEnd(3, '0');

  let candidate = base;
  let suffix = 1;
  while (await User.exists({ username: candidate })) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }
  return candidate;
};

const getOnboardingStatus = (user) => {
  try {
    const filePath = path.join(__dirname, '../config/terms.json');
    const terms = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const roleSelected = !!(user.role && ['CLIENT', 'FREELANCER'].includes(user.role.toUpperCase()));
    const currentTermsAccepted = user.termsAcceptedVersion === terms.version && !!user.termsAcceptedAt;
    const onboardingComplete = roleSelected && currentTermsAccepted;

    return {
      roleSelected,
      termsAccepted: currentTermsAccepted,
      currentTermsVersion: terms.version,
      acceptedTermsVersion: user.termsAcceptedVersion || null,
      onboardingComplete
    };
  } catch (error) {
    return {
      roleSelected: !!user.role,
      termsAccepted: false,
      currentTermsVersion: null,
      acceptedTermsVersion: null,
      onboardingComplete: false
    };
  }
};

// Cross-site cookie attrs: frontend (workquora.com) and backend (onrender.com) are
// different registrable domains, so cookies need SameSite=None + Secure in production
// (browsers reject SameSite=None without Secure). Locally both run on http://localhost,
// where Secure would block the cookie from being set at all, so we fall back to Lax.
const authCookieOptions = () =>
  process.env.NODE_ENV === 'production'
    ? { secure: true, sameSite: 'none' }
    : { secure: false, sameSite: 'lax' };

// Session based token response generation (Module 1)
const sendTokenResponse = async (user, statusCode, req, res) => {
  const ua = parseUserAgent(req.headers['user-agent']);
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const { country, city } = await getLocationFromIp(ip);

  // Generate Refresh Token (rotated)
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenHash = Session.hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Suspicious Login Detection (Module 5)
  let isSuspicious = false;
  const lastSession = await Session.findOne({ userId: user.id }).sort({ createdAt: -1 });
  if (lastSession) {
    if (
      (lastSession.country !== 'Unknown' && country !== 'Unknown' && lastSession.country !== country) ||
      (lastSession.browser !== 'Unknown' && ua.browser !== 'Unknown' && lastSession.browser !== ua.browser) ||
      (lastSession.operatingSystem !== 'Unknown' && ua.operatingSystem !== 'Unknown' && lastSession.operatingSystem !== ua.operatingSystem)
    ) {
      isSuspicious = true;
      console.log(`⚠️ Suspicious login detected for user: ${user.email} from IP: ${ip}`);
      await createAuditLog(req, {
        userId: user.id,
        action: 'SUSPICIOUS_LOGIN',
        entity: 'User',
        entityId: user.id,
        metadata: { ip, country, browser: ua.browser, os: ua.operatingSystem }
      });
    }
  }

  // Save Session
  const session = await Session.create({
    userId: user.id,
    refreshTokenHash,
    deviceName: ua.deviceName,
    browser: ua.browser,
    operatingSystem: ua.operatingSystem,
    ipAddress: ip,
    country,
    city,
    userAgent: req.headers['user-agent'] || '',
    expiresAt,
  });

  req.sessionId = session.sessionId;

  // Access Token (1 hour expiry) — embeds sessionId so /auth/sessions can
  // flag which row is "this device" without a separate lookup.
  const accessToken = jwt.sign({ id: user.id, sessionId: session.sessionId }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '1h',
  });

  // Append-only Audit Log (Module 3)
  await createAuditLog(req, {
    userId: user.id,
    action: isSuspicious ? 'LOGIN_SUSPICIOUS' : 'LOGIN',
    entity: 'User',
    entityId: user.id,
    metadata: { sessionId: session.sessionId }
  });

  // Set HTTP-Only cookies
  res.cookie('jwt', accessToken, {
    expires: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
    httpOnly: true,
    ...authCookieOptions(),
  });

  res.cookie('refreshToken', refreshToken, {
    expires: expiresAt,
    httpOnly: true,
    ...authCookieOptions(),
  });

  const userObj = user.toObject ? user.toObject() : user;
  userObj.password = undefined;

  res.status(statusCode).json({
    success: true,
    token: accessToken,
    refreshToken,
    user: userObj,
    data: userObj,
    onboarding: getOnboardingStatus(user)
  });
};

// POST /auth/register
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, mobileNumber, role, username, gender, agreedToTerms, agreedToPrivacy } = req.body;
    const emailLower = email.toLowerCase().trim();

    if (!agreedToTerms || !agreedToPrivacy) {
      return res.status(400).json({
        success: false,
        message: 'You must agree to the Terms of Service and Privacy Policy to register'
      });
    }

    const emailUser = await User.findOne({ email: emailLower });
    if (emailUser && emailUser.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    if (username) {
      const cleanUsername = username.toLowerCase().trim();
      const usernameUser = await User.findOne({ username: cleanUsername });
      if (usernameUser && (usernameUser.isEmailVerified || usernameUser.email !== emailLower)) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }
    }

    let user = await User.findOne({ email: emailLower });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry, matches email template (Module 4)

    const cleanGender = (gender || 'OTHER').toUpperCase();
    const defaultAvatar = (cleanGender === 'MALE')
      ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack'
      : (cleanGender === 'FEMALE')
        ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily'
        : 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';

    const termsConfig = require('../config/terms.json');
    const consentTimestamp = new Date();

    if (user) {
      user.name = name;
      user.password = password;
      user.role = (role || 'CLIENT').toUpperCase();
      user.gender = cleanGender;
      user.avatar = defaultAvatar;
      user.resetPasswordOtp = otp;
      user.resetPasswordExpires = otpExpires;
      user.otpAttempts = 0;
      user.otpLockedUntil = null;
      user.termsAcceptedVersion = termsConfig.version;
      user.termsAcceptedAt = consentTimestamp;
      user.privacyAcceptedAt = consentTimestamp;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        username,
        mobileNumber,
        password,
        role: (role || 'CLIENT').toUpperCase(),
        gender: cleanGender,
        avatar: defaultAvatar,
        isEmailVerified: false,
        resetPasswordOtp: otp,
        resetPasswordExpires: otpExpires,
        termsAcceptedVersion: termsConfig.version,
        termsAcceptedAt: consentTimestamp,
        privacyAcceptedAt: consentTimestamp
      });
      await Earnings.create({ userId: user._id }).catch(() => {});
      const Wallet = require('../models/Wallet');
      await Wallet.create({ user: user._id, userId: user._id }).catch(() => {});
    }

    await createAuditLog(req, {
      userId: user.id,
      action: 'REGISTER',
      entity: 'User',
      entityId: user.id
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔑 [DEVELOPER ONLY] Registration OTP for ${user.email} is: ${otp}`);
    }

    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify your WorkQuora account — Your OTP Code',
        message: `Hi ${user.name},\n\nYour registration OTP is: ${otp}\n\nIt expires in 10 minutes.\n\nWorkQuora Team`,
        otp,
      });
    } catch (err) {
      console.error('❌ Registration Email sending failed:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Account created. Verification OTP has been dispatched to your email.',
      emailSent: true,
      ...((process.env.NODE_ENV === 'development' || process.env.ENABLE_DEV_BYPASS === 'true') && { otp })
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/resend-otp
exports.resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, isEmailVerified: false });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No pending verification found for this email'
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify your WorkQuora account — Your OTP Code',
        message: `Your new OTP is: ${otp}. Valid for 10 minutes.`,
        otp,
      });
    } catch (err) {
      console.error('❌ Resend OTP Email sending failed:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to resend verification email. Please try again later.'
      });
    }

    return res.json({ 
      success: true, 
      message: 'OTP resent successfully',
      ...((process.env.NODE_ENV === 'development' || process.env.ENABLE_DEV_BYPASS === 'true') && { otp })
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/verify-registration
exports.verifyRegistration = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower }).select('+resetPasswordOtp +resetPasswordExpires +otpAttempts +otpLockedUntil');

    if (!user || user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'User not found or already verified' });
    }

    // Check OTP Lock (Module 4)
    if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
      return res.status(400).json({
        success: false,
        message: `OTP verification is locked due to multiple failures. Try again in 15 minutes.`
      });
    }

    const isDevBypass = process.env.NODE_ENV === 'development' && otp === '123456';
    if (!isDevBypass && (user.resetPasswordOtp !== otp || new Date() > user.resetPasswordExpires)) {
      // Increment failures
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 5) {
        user.otpLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Reset attempts on success
    user.isEmailVerified = true;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    user.otpAttempts = 0;
    user.otpLockedUntil = null;
    await user.save();

    await createAuditLog(req, {
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      entity: 'User',
      entityId: user.id
    });

    // Email OTP is now the sole registration gate — no mandatory mobile SMS
    // step. Log the user in immediately.
    return sendTokenResponse(user, 201, req, res);
  } catch (error) {
    next(error);
  }
};

// POST /auth/verify-mobile
exports.verifyMobile = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and Mobile OTP are required' });
    }

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower }).select('+mobileOtp +mobileOtpExpires +otpAttempts +otpLockedUntil');

    if (!user || !user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'User not found or email not verified' });
    }

    if (user.isMobileVerified) {
      return res.status(400).json({ success: false, message: 'Mobile already verified' });
    }

    // OTP Lock (Module 4)
    if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP verification is locked. Try again in 15 minutes.'
      });
    }

    const isDevBypass = process.env.NODE_ENV === 'development' && otp === '123456';
    const isMatch = user.mobileOtp ? await bcrypt.compare(otp, user.mobileOtp) : false;

    if (!isDevBypass && (!isMatch || new Date() > user.mobileOtpExpires)) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 5) {
        user.otpLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid or expired Mobile OTP' });
    }

    user.isMobileVerified = true;
    user.mobileOtp = null;
    user.mobileOtpExpires = null;
    user.otpAttempts = 0;
    user.otpLockedUntil = null;
    await user.save();

    await createAuditLog(req, {
      userId: user.id,
      action: 'PHONE_VERIFIED',
      entity: 'User',
      entityId: user.id
    });

    await sendTokenResponse(user, 201, req, res);
  } catch (error) {
    next(error);
  }
};

// POST /auth/send-mobile-otp
exports.sendMobileOtp = async (req, res, next) => {
  try {
    const email = req.body.email;
    const userId = req.user?.id;

    if (!email && !userId) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    let user;
    if (userId) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isMobileVerified) return res.status(400).json({ success: false, message: 'Mobile already verified' });
    if (!user.mobileNumber) return res.status(400).json({ success: false, message: 'No mobile number associated' });

    // Cooldown verification (60 seconds resend gap - Module 4)
    const now = new Date();
    if (user.mobileOtpLastSent && (now - user.mobileOtpLastSent) < 60 * 1000) {
      return res.status(429).json({ success: false, message: 'Please wait 60 seconds before requesting another OTP.' });
    }

    const mobileOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(mobileOtp, salt);

    user.mobileOtp = hashedOtp;
    user.mobileOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    user.mobileOtpCount = (user.mobileOtpCount || 0) + 1;
    user.mobileOtpLastSent = now;
    await user.save();

    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 [DEVELOPER ONLY] Resend Mobile OTP for ${user.mobileNumber} is: ${mobileOtp}`);
    }

    try {
      await smsService.sendOtp(user.mobileNumber, mobileOtp);
    } catch (err) {
      console.error('Failed to send Mobile OTP:', err);
    }

    res.status(200).json({ success: true, message: 'Mobile OTP sent via SMS' });
  } catch (error) {
    next(error);
  }
};

// POST /auth/login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email/Username and password required' });

    const searchKey = email.toLowerCase().trim();
    const user = await User.findOne({
      $or: [
        { email: searchKey },
        { username: searchKey }
      ]
    }).select('+password +failedLoginAttempts +lockedUntil');

    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Account locking verification (Module 5)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked due to multiple login failures. Try again in 15 minutes.'
      });
    }

    const isMatch = await user.comparePassword(password, user.password);
    if (!isMatch) {
      // Increment failures
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();

      await createAuditLog(req, {
        userId: user.id,
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: user.id,
        metadata: { failedAttempts: user.failedLoginAttempts }
      });

      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Success logins reset failed parameters
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    await sendTokenResponse(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

// GET /auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.id = user._id;
    user.earnings = await Earnings.findOne({ userId: req.user.id }).lean();
    user.kyc = await Kyc.findOne({ userId: req.user.id }).lean();
    user.bankDetails = await BankDetails.findOne({ userId: req.user.id }).lean();
    user.totalReviews = await Review.countDocuments({ reviewee: user._id });
    user.password = undefined;
    res.status(200).json({ success: true, data: user, onboarding: getOnboardingStatus(user) });
  } catch (error) {
    next(error);
  }
};

// POST /auth/logout
exports.logoutUser = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    if (refreshToken) {
      const hash = Session.hashToken(refreshToken);
      await Session.findOneAndUpdate({ refreshTokenHash: hash }, { isRevoked: true });
    }

    await createAuditLog(req, {
      userId: req.user?.id || null,
      action: 'LOGOUT',
      entity: 'User',
      entityId: req.user?.id || null
    });

    res.cookie('jwt', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true, ...authCookieOptions() });
    res.cookie('refreshToken', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true, ...authCookieOptions() });
    res.status(200).json({ success: true, message: 'Logged out' });
  } catch (error) {
    next(error);
  }
};

// POST /auth/logout-all
exports.logoutAllDevices = async (req, res, next) => {
  try {
    await Session.updateMany({ userId: req.user.id }, { isRevoked: true });

    await createAuditLog(req, {
      userId: req.user.id,
      action: 'LOGOUT_ALL_DEVICES',
      entity: 'User',
      entityId: req.user.id
    });

    res.cookie('jwt', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true, ...authCookieOptions() });
    res.cookie('refreshToken', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true, ...authCookieOptions() });
    res.status(200).json({ success: true, message: 'Logged out from all sessions' });
  } catch (error) {
    next(error);
  }
};

// POST /auth/refresh (Module 1 Token Rotation)
exports.refreshSession = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const hash = Session.hashToken(refreshToken);
    const session = await Session.findOne({ refreshTokenHash: hash, isRevoked: false });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session refresh token' });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User associated with session not found' });
    }

    // Rotate tokens
    const newAccessToken = jwt.sign({ id: user.id, sessionId: session.sessionId }, process.env.JWT_SECRET || 'secret123', {
      expiresIn: '1h',
    });

    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newHash = Session.hashToken(newRefreshToken);

    session.refreshTokenHash = newHash;
    session.lastUsedAt = new Date();
    session.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await session.save();

    await createAuditLog(req, {
      userId: user.id,
      action: 'TOKEN_ROTATION',
      entity: 'Session',
      entityId: session.sessionId,
      metadata: { sessionId: session.sessionId }
    });

    res.cookie('jwt', newAccessToken, {
      expires: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
      httpOnly: true,
      ...authCookieOptions(),
    });

    res.cookie('refreshToken', newRefreshToken, {
      expires: session.expiresAt,
      httpOnly: true,
      ...authCookieOptions(),
    });

    res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      onboarding: getOnboardingStatus(user)
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/social
exports.socialLogin = async (req, res, next) => {
  try {
    const { provider, token: providerToken, tokenType } = req.body;
    let verifiedEmail = null;
    let verifiedName = null;
    let verifiedAvatar = null;
    let googleSubId = null;

    if (provider === 'google') {
      if (!providerToken) {
        return res.status(401).json({ success: false, message: 'Google token is required' });
      }
      if (tokenType === 'access_token') {
        try {
          const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${providerToken}` },
          });

          if (!data.sub || !data.email || data.email_verified !== true) {
            return res.status(401).json({ success: false, message: 'Invalid or unverified Google account identity' });
          }

          verifiedEmail = data.email.toLowerCase().trim();
          verifiedName = data.name;
          verifiedAvatar = data.picture;
          googleSubId = data.sub;
        } catch (err) {
          return res.status(401).json({ success: false, message: 'Invalid Google access token verification failed' });
        }
      } else {
        try {
          const ticket = await googleClient.verifyIdToken({
            idToken: providerToken,
            audience: process.env.GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();

          if (!payload.sub || !payload.email || payload.email_verified !== true) {
            return res.status(401).json({ success: false, message: 'Invalid or unverified Google account identity' });
          }

          verifiedEmail = payload.email.toLowerCase().trim();
          verifiedName = payload.name;
          verifiedAvatar = payload.picture;
          googleSubId = payload.sub;
        } catch (err) {
          return res.status(401).json({ success: false, message: 'Invalid Google ID token verification failed' });
        }
      }
    } else if (provider === 'facebook' && providerToken) {
      try {
        const { data } = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${providerToken}`);
        if (!data.email) {
          return res.status(400).json({ success: false, message: 'Facebook account must have an email attached' });
        }
        verifiedEmail = data.email.toLowerCase().trim();
        verifiedName = data.name;
        verifiedAvatar = data.picture?.data?.url;
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid Facebook token' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid social provider or token' });
    }

    if (!verifiedEmail) return res.status(400).json({ success: false, message: 'Email required' });

    let user = await User.findOne({ email: verifiedEmail });
    if (!user) {
      const randomPwd = Math.random().toString(36);
      const username = await generateUniqueUsername(verifiedEmail.split('@')[0]);
      user = await User.create({
        name: verifiedName || verifiedEmail.split('@')[0],
        email: verifiedEmail,
        username,
        password: randomPwd,
        hasPassword: false,
        isEmailVerified: true,
        googleId: provider === 'google' ? googleSubId : null,
        avatar: verifiedAvatar,
        // Deliberately no role — schema defaults to 'CLIENT', which would
        // silently skip the OnboardingOverlay role-selection screen for
        // every new social-login user. Null signals "new user" so
        // getOnboardingStatus().roleSelected is false until they choose.
        role: null,
      });
      await Earnings.create({ userId: user._id }).catch(() => {});
      const Wallet = require('../models/Wallet');
      await Wallet.create({ user: user._id, userId: user._id }).catch(() => {});
    } else {
      if (provider === 'google') {
        if (!user.googleId) {
          user.googleId = googleSubId;
          await user.save();
        } else if (user.googleId !== googleSubId) {
          return res.status(400).json({ 
            success: false, 
            message: 'This email is already associated with a different Google account.' 
          });
        }
      }
    }

    await sendTokenResponse(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

// PUT /auth/user/assign-role
exports.assignRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['CLIENT', 'FREELANCER'].includes(role?.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Role must be CLIENT or FREELANCER' });
    }
    const user = await User.findByIdAndUpdate(req.user.id, { role: role.toUpperCase() }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await createAuditLog(req, {
      userId: user.id,
      action: 'ASSIGN_ROLE',
      entity: 'User',
      entityId: user.id,
      metadata: { role: role.toUpperCase() }
    });

    const userObj = user.toObject ? user.toObject() : user;
    userObj.password = undefined;
    res.status(200).json({ success: true, message: 'Role assigned', data: userObj, onboarding: getOnboardingStatus(user) });
  } catch (error) {
    next(error);
  }
};

// POST /auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry (Module 4)

    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = expires;
    await user.save();

    await createAuditLog(req, {
      userId: user.id,
      action: 'FORGOT_PASSWORD_REQUEST',
      entity: 'User',
      entityId: user.id
    });

    try {
      await sendEmail({
        email: user.email,
        subject: 'Reset your WorkQuora Password 🔑',
        message: `Hi ${user.name},\n\nYour password reset OTP is: ${otp}\n\nIt expires in 5 minutes.\n\nWorkQuora Team`,
        otp,
      });
    } catch (err) {
      console.error('❌ Forgot Password Email sending failed:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset password email. Please try again later.'
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'OTP sent to email. Please verify.',
      ...((process.env.NODE_ENV === 'development' || process.env.ENABLE_DEV_BYPASS === 'true') && { otp })
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower }).select('+password +resetPasswordOtp +resetPasswordExpires +passwordHistory');

    const isDevBypass = process.env.NODE_ENV === 'development' && otp === '123456';
    if (!user || (!isDevBypass && (user.resetPasswordOtp !== otp || new Date() > user.resetPasswordExpires))) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Verify Password History constraints (Module 4)
    if (user.passwordHistory && user.passwordHistory.length > 0) {
      for (const oldHash of user.passwordHistory) {
        const isMatch = await bcrypt.compare(newPassword, oldHash);
        if (isMatch) {
          return res.status(400).json({ success: false, message: 'Cannot reuse any of your last 5 passwords.' });
        }
      }
    }

    // Check if new password matches current password
    if (user.password) {
      const isCurrentMatch = await bcrypt.compare(newPassword, user.password);
      if (isCurrentMatch) {
        return res.status(400).json({ success: false, message: 'Cannot reuse your current password.' });
      }
    }

    // Rotate Password History
    const history = user.passwordHistory || [];
    if (user.password) {
      history.unshift(user.password);
    }
    user.passwordHistory = history.slice(0, 5);

    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    user.passwordChangedAt = new Date();
    await user.save();

    // Revoke all sessions (Force logout)
    await Session.updateMany({ userId: user.id }, { isRevoked: true });

    await createAuditLog(req, {
      userId: user.id,
      action: 'PASSWORD_CHANGE',
      entity: 'User',
      entityId: user.id
    });

    const { createNotification } = require('../utils/notification');
    await createNotification({
      recipient: user.id,
      type: 'security_alert',
      message: 'Your password was changed.',
      io: req.app.get('io'),
    }).catch(() => {});

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

// PUT /auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user.id).select('+password +passwordHistory');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Verify Password History constraints (same rule enforced in resetPassword)
    if (user.passwordHistory && user.passwordHistory.length > 0) {
      for (const oldHash of user.passwordHistory) {
        const reused = await bcrypt.compare(newPassword, oldHash);
        if (reused) {
          return res.status(400).json({ success: false, message: 'Cannot reuse any of your last 5 passwords.' });
        }
      }
    }

    const isSameAsCurrent = await bcrypt.compare(newPassword, user.password);
    if (isSameAsCurrent) {
      return res.status(400).json({ success: false, message: 'New password must be different from your current password.' });
    }

    const history = user.passwordHistory || [];
    history.unshift(user.password);
    user.passwordHistory = history.slice(0, 5);

    user.password = newPassword; // pre-save hook hashes it
    user.passwordChangedAt = new Date();
    await user.save();

    // Revoke all other sessions (Force re-login everywhere except this request)
    await Session.updateMany({ userId: user.id }, { isRevoked: true });

    await createAuditLog(req, {
      userId: user.id,
      action: 'PASSWORD_CHANGE',
      entity: 'User',
      entityId: user.id
    });

    const { createNotification } = require('../utils/notification');
    await createNotification({
      recipient: user.id,
      type: 'security_alert',
      message: 'Your password was changed.',
      io: req.app.get('io'),
    }).catch(() => {});

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /auth/request-password-otp — logged-in "Set/Change Password via OTP"
// flow (Settings). Used both to set a first real password (social-login
// users, Case A) and to change an existing one (Case B) — same OTP-gated
// flow either way, no currentPassword required.
exports.requestPasswordOtp = async (req, res, next) => {
  try {
    const { method } = req.body;
    if (!['email', 'phone'].includes(method)) {
      return res.status(400).json({ success: false, message: 'method must be "email" or "phone"' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (method === 'phone' && !user.mobileNumber) {
      return res.status(400).json({ success: false, message: 'No phone number on file for this account' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordOtp = otp;
    user.passwordOtpExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    user.passwordOtpMethod = method;
    user.passwordOtpVerified = false;
    await user.save();

    if (method === 'phone') {
      try {
        await smsService.sendOtp(user.mobileNumber, otp, `Your WorkQuora password OTP is ${otp}. It is valid for 2 minutes.`);
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to send OTP via SMS. Please try again later.' });
      }
    } else {
      try {
        await sendEmail({
          email: user.email,
          subject: 'Your WorkQuora Password OTP',
          message: `Hi ${user.name},\n\nYour OTP to set/change your WorkQuora password is: ${otp}\n\nIt expires in 2 minutes.\n\nWorkQuora Team`,
          otp,
        });
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to send OTP via email. Please try again later.' });
      }
    }

    await createAuditLog(req, {
      userId: user.id,
      action: 'PASSWORD_OTP_REQUESTED',
      entity: 'User',
      entityId: user.id,
      metadata: { method }
    });

    res.status(200).json({
      success: true,
      message: `OTP sent to your ${method}`,
      expiresInSeconds: 120,
      ...((process.env.NODE_ENV === 'development' || process.env.ENABLE_DEV_BYPASS === 'true') && { otp })
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/verify-password-otp
exports.verifyPasswordOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

    const user = await User.findById(req.user.id).select('+passwordOtp +passwordOtpExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isDevBypass = process.env.NODE_ENV === 'development' && otp === '123456';
    if (!isDevBypass && (!user.passwordOtp || user.passwordOtp !== otp || !user.passwordOtpExpires || new Date() > user.passwordOtpExpires)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.passwordOtpVerified = true;
    await user.save();

    await createAuditLog(req, {
      userId: user.id,
      action: 'PASSWORD_OTP_VERIFIED',
      entity: 'User',
      entityId: user.id
    });

    res.status(200).json({ success: true, message: 'OTP verified. You can now set a new password.' });
  } catch (error) {
    next(error);
  }
};

// POST /auth/set-password — consumes a verified passwordOtp to set the
// password without needing the current one. Covers both "Set Password"
// (user.hasPassword === false) and "Change Password" (true) from the client.
exports.setPassword = async (req, res, next) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirmation are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user.id).select('+password +passwordHistory +passwordOtp +passwordOtpExpires +passwordOtpVerified');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.passwordOtpVerified) {
      return res.status(400).json({ success: false, message: 'Please verify the OTP before setting a new password' });
    }

    if (user.passwordHistory && user.passwordHistory.length > 0) {
      for (const oldHash of user.passwordHistory) {
        const reused = await bcrypt.compare(newPassword, oldHash);
        if (reused) {
          return res.status(400).json({ success: false, message: 'Cannot reuse any of your last 5 passwords.' });
        }
      }
    }

    if (user.password) {
      const isSameAsCurrent = await bcrypt.compare(newPassword, user.password);
      if (isSameAsCurrent) {
        return res.status(400).json({ success: false, message: 'New password must be different from your current password.' });
      }
    }

    const history = user.passwordHistory || [];
    if (user.password) history.unshift(user.password);
    user.passwordHistory = history.slice(0, 5);

    user.password = newPassword; // pre-save hook hashes it
    user.hasPassword = true;
    user.passwordChangedAt = new Date();
    user.passwordOtp = null;
    user.passwordOtpExpires = null;
    user.passwordOtpMethod = null;
    user.passwordOtpVerified = false;
    await user.save();

    // Revoke all sessions (force re-login everywhere, including here)
    await Session.updateMany({ userId: user.id }, { isRevoked: true });

    await createAuditLog(req, {
      userId: user.id,
      action: 'PASSWORD_CHANGE',
      entity: 'User',
      entityId: user.id
    });

    const { createNotification } = require('../utils/notification');
    await createNotification({
      recipient: user.id,
      type: 'security_alert',
      message: 'Your password was changed.',
      io: req.app.get('io'),
    }).catch(() => {});

    res.status(200).json({ success: true, message: 'Password set successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /auth/request-email-change-otp — OTP is sent to the NEW email to
// prove the user actually controls it before the account email moves.
exports.requestEmailChangeOtp = async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ success: false, message: 'A valid new email is required' });
    }
    const emailLower = newEmail.toLowerCase().trim();

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (emailLower === user.email) {
      return res.status(400).json({ success: false, message: 'This is already your current email' });
    }

    const existing = await User.findOne({ email: emailLower, _id: { $ne: req.user.id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This email is already registered' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailChangeOtp = otp;
    user.emailChangeOtpExpires = new Date(Date.now() + 2 * 60 * 1000);
    user.pendingEmail = emailLower;
    await user.save();

    try {
      await sendEmail({
        email: emailLower,
        subject: 'Verify your new WorkQuora email',
        message: `Hi ${user.name},\n\nYour OTP to confirm this as your new WorkQuora email is: ${otp}\n\nIt expires in 2 minutes.\n\nIf you didn't request this, you can safely ignore this email.\n\nWorkQuora Team`,
        otp,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again later.' });
    }

    await createAuditLog(req, {
      userId: user.id,
      action: 'EMAIL_CHANGE_OTP_REQUESTED',
      entity: 'User',
      entityId: user.id,
      metadata: { newEmail: emailLower }
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your new email',
      expiresInSeconds: 120,
      ...((process.env.NODE_ENV === 'development' || process.env.ENABLE_DEV_BYPASS === 'true') && { otp })
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/verify-email-change
exports.verifyEmailChange = async (req, res, next) => {
  try {
    const { otp, newEmail } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

    const user = await User.findById(req.user.id).select('+emailChangeOtp +emailChangeOtpExpires +pendingEmail');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.pendingEmail) {
      return res.status(400).json({ success: false, message: 'No pending email change found. Please request a new OTP.' });
    }
    if (newEmail && newEmail.toLowerCase().trim() !== user.pendingEmail) {
      return res.status(400).json({ success: false, message: 'Email mismatch. Please request a new OTP.' });
    }

    const isDevBypass = process.env.NODE_ENV === 'development' && otp === '123456';
    if (!isDevBypass && (!user.emailChangeOtp || user.emailChangeOtp !== otp || !user.emailChangeOtpExpires || new Date() > user.emailChangeOtpExpires)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Final uniqueness re-check right before committing (race-condition guard
    // in case someone else registered this email while the OTP was pending).
    const existing = await User.findOne({ email: user.pendingEmail, _id: { $ne: user.id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This email is already registered' });
    }

    const oldEmail = user.email;
    user.email = user.pendingEmail;
    user.isEmailVerified = true;
    user.emailChangeOtp = null;
    user.emailChangeOtpExpires = null;
    user.pendingEmail = null;
    await user.save();

    await createAuditLog(req, {
      userId: user.id,
      action: 'EMAIL_CHANGED',
      entity: 'User',
      entityId: user.id,
      metadata: { oldEmail, newEmail: user.email }
    });

    const io = req.app.get('io');
    const { createNotification } = require('../utils/notification');
    await createNotification({
      recipient: user.id,
      type: 'account_activity',
      message: 'Your email was updated.',
      io,
    }).catch(() => {});

    // Security alert to the OLD email — lets the original owner know if this
    // wasn't them, since they can no longer see it reflected in the app.
    sendEmail({
      email: oldEmail,
      subject: 'Your WorkQuora email was changed',
      message: `Hi ${user.name},\n\nYour WorkQuora account email was changed to ${user.email}.\n\nIf you made this change, no action is needed. If you did not request this, please contact support@workquora.com immediately.\n\nWorkQuora Team`,
    }).catch(() => {});

    res.status(200).json({ success: true, message: 'Email updated successfully', email: user.email });
  } catch (error) {
    next(error);
  }
};

// POST /auth/request-mobile-change-otp
exports.requestMobileChangeOtp = async (req, res, next) => {
  try {
    const { newMobile } = req.body;
    if (!newMobile || !/^[6-9]\d{9}$/.test(newMobile)) {
      return res.status(400).json({ success: false, message: 'A valid 10-digit mobile number is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (newMobile === user.mobileNumber) {
      return res.status(400).json({ success: false, message: 'This is already your current mobile number' });
    }

    const existing = await User.findOne({ mobileNumber: newMobile, _id: { $ne: req.user.id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This mobile number is already registered' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.mobileChangeOtp = otp;
    user.mobileChangeOtpExpires = new Date(Date.now() + 2 * 60 * 1000);
    user.pendingMobile = newMobile;
    await user.save();

    try {
      await smsService.sendOtp(newMobile, otp, `Your WorkQuora OTP to confirm this new mobile number is ${otp}. It is valid for 2 minutes.`);
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP via SMS. Please try again later.' });
    }

    await createAuditLog(req, {
      userId: user.id,
      action: 'MOBILE_CHANGE_OTP_REQUESTED',
      entity: 'User',
      entityId: user.id,
      metadata: { newMobile }
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your new mobile number',
      expiresInSeconds: 120,
      ...((process.env.NODE_ENV === 'development' || process.env.ENABLE_DEV_BYPASS === 'true') && { otp })
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/verify-mobile-change
exports.verifyMobileChange = async (req, res, next) => {
  try {
    const { otp, newMobile } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

    const user = await User.findById(req.user.id).select('+mobileChangeOtp +mobileChangeOtpExpires +pendingMobile');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.pendingMobile) {
      return res.status(400).json({ success: false, message: 'No pending mobile number change found. Please request a new OTP.' });
    }
    if (newMobile && newMobile !== user.pendingMobile) {
      return res.status(400).json({ success: false, message: 'Mobile number mismatch. Please request a new OTP.' });
    }

    const isDevBypass = process.env.NODE_ENV === 'development' && otp === '123456';
    if (!isDevBypass && (!user.mobileChangeOtp || user.mobileChangeOtp !== otp || !user.mobileChangeOtpExpires || new Date() > user.mobileChangeOtpExpires)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const existing = await User.findOne({ mobileNumber: user.pendingMobile, _id: { $ne: user.id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This mobile number is already registered' });
    }

    user.mobileNumber = user.pendingMobile;
    user.isMobileVerified = true;
    user.mobileChangeOtp = null;
    user.mobileChangeOtpExpires = null;
    user.pendingMobile = null;
    await user.save();

    // Keep the Kyc record's mobile in sync (same as profileController.js's updateProfile)
    await Kyc.findOneAndUpdate({ userId: user.id }, { mobileNumber: user.mobileNumber });

    await createAuditLog(req, {
      userId: user.id,
      action: 'MOBILE_CHANGED',
      entity: 'User',
      entityId: user.id
    });

    const { createNotification } = require('../utils/notification');
    await createNotification({
      recipient: user.id,
      type: 'account_activity',
      message: 'Your mobile number was updated.',
      io: req.app.get('io'),
    }).catch(() => {});

    res.status(200).json({ success: true, message: 'Mobile number updated successfully', mobileNumber: user.mobileNumber });
  } catch (error) {
    next(error);
  }
};

// GET /auth/sessions
exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({
      userId: req.user.id,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastUsedAt: -1 })
      .select('deviceName browser operatingSystem ipAddress city country lastUsedAt createdAt sessionId')
      .lean();

    const data = sessions.map((s) => ({ ...s, isCurrent: s.sessionId === req.sessionId }));
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// DELETE /auth/sessions/:id — log out a single device (revokes that session's
// refresh token; its access token, if still valid, naturally expires within
// the hour like any other revoked session).
exports.revokeSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id, userId: req.user.id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.isRevoked = true;
    await session.save();

    await createAuditLog(req, {
      userId: req.user.id,
      action: 'SESSION_REVOKED',
      entity: 'Session',
      entityId: session.sessionId,
      metadata: { sessionId: session.sessionId }
    });

    res.status(200).json({ success: true, message: 'Session logged out' });
  } catch (error) {
    next(error);
  }
};

// GET /auth/check-username
exports.checkUsername = async (req, res, next) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    const cleanUsername = username.toLowerCase().trim();
    if (!/^[a-zA-Z0-9_]{3,}$/.test(cleanUsername)) {
      return res.status(200).json({ success: true, available: false, message: 'Invalid username format' });
    }
    const user = await User.findOne({ username: cleanUsername });
    if (user && user.isEmailVerified) {
      return res.status(200).json({ success: true, available: false, message: 'Username is already taken' });
    }
    res.status(200).json({ success: true, available: true, message: 'Username is available' });
  } catch (error) {
    next(error);
  }
};

// DELETE /auth/account
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Prevent deletion if user has active jobs/escrow
    const activeJobs = await Job.countDocuments({
      $or: [{ client: userId }, { assignedTo: userId }],
      status: { $in: ['open', 'in-progress'] }
    });

    if (activeJobs > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete account with ${activeJobs} active job(s). Complete or cancel them first.`
      });
    }

    // Soft delete — mark as deleted, anonymize PII. Do NOT hard delete —
    // preserves review/transaction history integrity for the other party.
    await User.findByIdAndUpdate(userId, {
      isDeleted: true,
      deletedAt: new Date(),
      email: `deleted_${userId}@workquora.com`,
      name: 'Deleted User',
      mobileNumber: null,
      profilePic: null,
      bio: null,
      skills: []
    });

    await createAuditLog(req, {
      userId,
      action: 'ACCOUNT_DELETED',
      entity: 'User',
      entityId: userId
    });

    res.cookie('jwt', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true, ...authCookieOptions() });
    res.cookie('refreshToken', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true, ...authCookieOptions() });

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};