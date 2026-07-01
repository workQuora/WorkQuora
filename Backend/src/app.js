const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const errorHandler = require('./middlewares/errorHandler');
const authRoutes        = require('./routes/authRoutes');
const profileRoutes     = require('./routes/profileRoutes');
const geoRoutes         = require('./routes/geoRoutes');
const messageRoutes     = require('./routes/messageRoutes');
const jobRoutes         = require('./routes/jobRoutes');
const proposalRoutes    = require('./routes/proposalRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const kycRoutes         = require('./routes/kycRoutes');
const taskRoutes        = require('./routes/taskRoutes');
const notificationRoutes= require('./routes/notificationRoutes');
const reviewRoutes      = require('./routes/reviewRoutes');
const smartMatchRoutes  = require('./routes/smartMatchRoutes');
const walletRoutes      = require('./routes/walletRoutes');
const paymentRoutes     = require('./routes/paymentRoutes');
const analyticsRoutes   = require('./routes/analyticsroutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');
const adRoutes          = require('./routes/adRoutes');
const monitoringRoutes  = require('./routes/monitoringRoutes');

// Admin module routes
const adminAuthRoutes      = require('./modules/admin/routes/adminAuthRoutes');
const adminUserRoutes      = require('./modules/admin/routes/adminUserRoutes');
const adminTaskRoutes      = require('./modules/admin/routes/adminTaskRoutes');
const adminPaymentRoutes   = require('./modules/admin/routes/adminPaymentRoutes');
const adminAnalyticsRoutes = require('./modules/admin/routes/adminAnalyticsRoutes');
const adminAuditRoutes     = require('./modules/admin/routes/adminAuditRoutes');
const adminKycRoutes       = require('./modules/admin/routes/adminKycRoutes');
const superAdminRoutes     = require('./modules/admin/routes/superAdminRoutes');
const adminAdRoutes        = require('./modules/admin/routes/adminAdRoutes');

const { mongoSanitize } = require('./middlewares/securityMiddleware');

const app = express();

const compression = require('compression');
app.use(compression());

// Distributed Tracing & API Versioning headers (Phase 5)
const traceService = require('./services/traceService');
const versionManager = require('./services/versionManager');
app.use(traceService.traceMiddleware());
app.use(versionManager.versionHeadersMiddleware());

// Hardened Helmet Configuration (Module 7)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.tile.openstreetmap.org"],
      connectSrc: ["'self'", "http://localhost:3000", "ws://localhost:3000", "wss://localhost:3000", "https://api.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com"],
    }
  },
  // API is consumed cross-origin by the Flutter web/mobile clients (different
  // origin than this server). Helmet's defaults — Cross-Origin-Resource-Policy:
  // same-origin and Cross-Origin-Opener-Policy: same-origin — make the browser
  // silently block reading the response even when CORS headers are correct.
  // That surfaced as generic "Failed to fetch" / DioExceptionType.unknown
  // errors on every screen in the client app. Relax both for this API server.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true
}));

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

// Body Size Limit Hardening (Module 7)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Malformed JSON Protection
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Malformed JSON payload' });
  }
  next(err);
});

app.use(mongoSanitize);

// Idempotency Middleware for financial transactions (Module 6)
const idempotencyMiddleware = require('./middlewares/idempotency');
app.use(idempotencyMiddleware);

// Advanced Route Specific Rate Limiters (Module 2)
const {
  loginLimiter, registerLimiter, emailOtpLimiter, mobileOtpLimiter,
  forgotPasswordLimiter, passwordResetLimiter, walletLimiter, paymentLimiter,
  proposalLimiter, kycLimiter, adminLimiter
} = require('./middlewares/rateLimiters');

app.use('/api/v1/auth/login', loginLimiter);
app.use('/api/v1/auth/register', registerLimiter);
app.use('/api/v1/auth/verify-registration', emailOtpLimiter);
app.use('/api/v1/auth/verify-mobile', mobileOtpLimiter);
app.use('/api/v1/auth/send-mobile-otp', mobileOtpLimiter);
app.use('/api/v1/auth/forgot-password', forgotPasswordLimiter);
app.use('/api/v1/auth/reset-password', passwordResetLimiter);

app.use('/api/v1/wallet', walletLimiter);
app.use('/api/v1/payments', paymentLimiter);
app.use('/api/v1/proposals', proposalLimiter);
app.use('/api/v1/kyc', kycLimiter);

const { traceRequest, morganLogger } = require('./middlewares/requestLogger');
app.use(traceRequest);
app.use(morganLogger);

app.get('/api/v1/docs', (req, res) => {
  const spec = require('./config/swaggerSpec');
  res.status(200).json(spec);
});

app.use('/api/v1/health',        monitoringRoutes);

// ── Platform Routes ─────────────────────────────────
app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/profile',       profileRoutes);
app.use('/api/v1/geo',           geoRoutes);
app.use('/api/v1/messages',      messageRoutes);
app.use('/api/v1/jobs',          jobRoutes);
app.use('/api/v1/jobs',          smartMatchRoutes);
app.use('/api/v1/proposals',     proposalRoutes);
app.use('/api/v1/transactions',  transactionRoutes);
app.use('/api/v1/kyc',           kycRoutes);
app.use('/api/v1/tasks',         taskRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/reviews',       reviewRoutes);
app.use('/api/v1/wallet',        walletRoutes);
app.use('/api/v1/payments',      paymentRoutes);
app.use('/api/v1/analytics',     analyticsRoutes);
app.use('/api/v1/dashboard',     dashboardRoutes);
app.use('/api/v1/ads',           adRoutes);

// ── Phase 4 Business Engine Routes ─────────────────────────
app.use('/api/v1/disputes',      require('./routes/disputeRoutes'));
app.use('/api/v1/coupons',       require('./routes/couponRoutes'));
app.use('/api/v1/invoices',      require('./routes/invoiceRoutes'));
app.use('/api/v1/referrals',     require('./routes/referralRoutes'));
app.use('/api/v1/settings',      require('./routes/settingsRoutes'));

// ── Admin Module Routes (separate auth, stricter rate limit) ──
app.use('/api/admin/auth',       adminLimiter, adminAuthRoutes);
app.use('/api/admin/users',      adminLimiter, adminUserRoutes);
app.use('/api/admin/tasks',      adminLimiter, adminTaskRoutes);
app.use('/api/admin/payments',   adminLimiter, adminPaymentRoutes);
app.use('/api/admin/analytics',  adminLimiter, adminAnalyticsRoutes);
app.use('/api/admin/audit',      adminLimiter, adminAuditRoutes);
app.use('/api/admin/kyc',        adminLimiter, adminKycRoutes);
app.use('/api/admin/super',      adminLimiter, superAdminRoutes);
app.use('/api/admin/ads',        adminLimiter, adminAdRoutes);

app.use(errorHandler);
module.exports = app;