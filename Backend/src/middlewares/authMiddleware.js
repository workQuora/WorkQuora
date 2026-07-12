const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Protect Route: Checks if user is logged in
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'The user belonging to this token no longer exists.' });
    }

    req.user = currentUser;
    req.sessionId = decoded.sessionId || null;

    const whitelist = [
      '/api/v1/auth/me',
      '/api/v1/auth/logout',
      '/api/v1/auth/logout-all',
      '/api/v1/auth/refresh',
      '/api/v1/auth/user/assign-role',
      '/api/v1/terms/current',
      '/api/v1/terms/accept'
    ];

    const isWhitelisted = whitelist.some(route => req.originalUrl.split('?')[0] === route);
    if (!isWhitelisted) {
      try {
        const fs = require('fs');
        const path = require('path');
        const termsPath = path.join(__dirname, '../config/terms.json');
        
        if (!fs.existsSync(termsPath)) {
          throw new Error('Terms configuration file is missing');
        }
        const terms = JSON.parse(fs.readFileSync(termsPath, 'utf8'));
        if (!terms || typeof terms.name !== 'string' || !terms.name.trim() ||
            typeof terms.version !== 'string' || !terms.version.trim() ||
            !Array.isArray(terms.content)) {
          throw new Error('Invalid terms configuration format');
        }

        const roleSelected = !!(currentUser.role && ['CLIENT', 'FREELANCER'].includes(currentUser.role.toUpperCase()));
        const currentTermsAccepted = currentUser.termsAcceptedVersion === terms.version && !!currentUser.termsAcceptedAt;

        if (!roleSelected || !currentTermsAccepted) {
          return res.status(403).json({
            success: false,
            message: 'Onboarding incomplete. Please assign a role and accept the current Terms & Conditions.',
            onboarding: {
              roleSelected,
              termsAccepted: currentTermsAccepted,
              currentTermsVersion: terms.version,
              acceptedTermsVersion: currentUser.termsAcceptedVersion || null,
              onboardingComplete: false
            }
          });
        }
      } catch (err) {
        console.error('❌ Onboarding middleware terms load error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Unable to validate current platform terms. Please try again later.'
        });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// Optional Protect Route: Populates req.user if logged in, but allows guest access
exports.optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    const currentUser = await User.findById(decoded.id);
    if (currentUser) {
      req.user = currentUser;
    }
    next();
  } catch (error) {
    // If token is invalid/expired, still allow access as guest
    next();
  }
};

// 2. Authorize Route: Checks if user has the right role (Client or Freelancer)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Prisma mein role 'CLIENT' (uppercase) save hota hai, aur routes mein hum 'client' bhejte hain
    // Isliye dono ko lowercase karke match karte hain taaki case-sensitivity ka issue na aaye
    const userRole = req.user.role.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role '${req.user.role}' is not authorized to access this route` 
      });
    }
    next();
  };
};