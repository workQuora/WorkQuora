const User = require('../models/User');
const Earnings = require('../models/Earnings');
const Kyc = require('../models/Kyc');
const BankDetails = require('../models/BankDetails');
const Session = require('../models/Session');
const Job = require('../models/Job');
const Review = require('../models/Review');
const { parseUserAgent } = require('../utils/uaParser');
const { createAuditLog } = require('../utils/auditLogger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const sendEmail = require('../utils/sendEmail');
const smsService = require('../services/smsService');
const crypto = require('crypto');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Session based token response generation (Module 1)
const sendTokenResponse = async (user, statusCode, req, res) => {
  const ua = parseUserAgent(req.headers['user-agent']);
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const country = req.headers['x-country'] || 'Unknown';
  const city = req.headers['x-city'] || 'Unknown';

  // Generate Access Token (1 hour expiry)
  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '1h',
  });

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
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.cookie('refreshToken', refreshToken, {
    expires: expiresAt,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  const userObj = user.toObject ? user.toObject() : user;
  userObj.password = undefined;

  res.status(statusCode).json({
    success: true,
    token: accessToken,
    refreshToken,
    user: userObj,
    data: userObj,
  });
};

// POST /auth/register
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, mobileNumber, role, username, gender } = req.body;
    const emailLower = email.toLowerCase().trim();

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
        resetPasswordExpires: otpExpires
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

    // Trigger email in background so slow or blocked SMTP ports do not delay/timeout the API response
    sendEmail({
      email: user.email,
      subject: 'Verify your WorkQuora Account 🚀',
      message: `Hi ${user.name},\n\nYour registration OTP is: ${otp}\n\nIt expires in 10 minutes.\n\nWorkQuora Team`,
      otp,
    }).catch((err) => {
      console.error('❌ Registration Email sending failed in background:', err.message);
    });

    // Always return success — user can request resend if email didn't arrive.
    return res.status(200).json({
      success: true,
      message: 'Account created. Verification OTP has been dispatched to your email.',
      emailSent: true,
      // Include the OTP directly if dev bypass is enabled or in development mode so user can verify easily
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

    // Send email in background
    sendEmail({
      email: user.email,
      subject: 'WorkQuora — Resend OTP',
      message: `Your new OTP is: ${otp}. Valid for 10 minutes.`,
      otp,
    }).catch((err) => {
      console.error('Resend email failed in background:', err.message);
    });

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
    res.status(200).json({ success: true, data: user });
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

    res.cookie('jwt', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
    res.cookie('refreshToken', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
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

    res.cookie('jwt', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
    res.cookie('refreshToken', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
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
    const newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret123', {
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.cookie('refreshToken', newRefreshToken, {
      expires: session.expiresAt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/social
exports.socialLogin = async (req, res, next) => {
  try {
    const { provider, token: providerToken, email, name, avatar } = req.body;
    let verifiedEmail = email;
    let verifiedName = name;

    if (provider === 'google' && providerToken) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: providerToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        verifiedEmail = payload.email;
        verifiedName = payload.name;
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid Google token' });
      }
    } else if (provider === 'facebook' && providerToken) {
      try {
        const { data } = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${providerToken}`);
        if (!data.email) {
          return res.status(400).json({ success: false, message: 'Facebook account must have an email attached' });
        }
        verifiedEmail = data.email;
        verifiedName = data.name;
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid Facebook token' });
      }
    }

    if (!verifiedEmail) return res.status(400).json({ success: false, message: 'Email required' });

    let user = await User.findOne({ email: verifiedEmail });
    if (!user) {
      const randomPwd = Math.random().toString(36);
      user = await User.create({
        name: verifiedName || verifiedEmail.split('@')[0],
        email: verifiedEmail,
        password: randomPwd,
        isEmailVerified: true
      });
      await Earnings.create({ userId: user._id }).catch(() => {});
      const Wallet = require('../models/Wallet');
      await Wallet.create({ user: user._id, userId: user._id }).catch(() => {});
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
    res.status(200).json({ success: true, message: 'Role assigned', data: userObj });
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

    // Send email in background
    sendEmail({
      email: user.email,
      subject: 'Reset your WorkQuora Password 🔑',
      message: `Hi ${user.name},\n\nYour password reset OTP is: ${otp}\n\nIt expires in 5 minutes.\n\nWorkQuora Team`,
      otp,
    }).catch((err) => {
      console.error('❌ Forgot Password Email sending failed in background:', err.message);
    });

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

    res.status(200).json({ success: true, message: 'Password reset successful' });
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

    res.cookie('jwt', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
    res.cookie('refreshToken', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};