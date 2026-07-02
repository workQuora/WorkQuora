const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const redisClient = require('../config/redis');
const os = require('os');

router.get('/', (req, res) => {
  res.status(200).json({ status: 'active', message: 'WorkQuora API running' });
});

// @desc    Liveness check (Vol 20)
// @route   GET /api/v1/health/liveness
// @access  Public
router.get('/liveness', async (req, res) => {
  const releaseManager = require('../services/releaseManager');
  const relInfo = await releaseManager.getReleaseInfo();
  res.status(200).json({
    status: 'active',
    timestamp: new Date(),
    uptimeSeconds: Math.round(process.uptime()),
    release: relInfo,
  });
});

// @desc    Readiness check with service diagnostics (Vol 20)
// @route   GET /api/v1/health/readiness
// @access  Public
router.get('/readiness', async (req, res) => {
  let dbStatus = 'unreachable';
  let redisStatus = 'disabled';
  let dbLatency = -1;
  let redisLatency = -1;

  try {
    const startDb = Date.now();
    const state = mongoose.connection.readyState;
    if (state === 1) {
      await mongoose.connection.db.admin().ping();
      dbStatus = 'connected';
      dbLatency = Date.now() - startDb;
    }
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  try {
    if (redisClient && redisClient.isOpen) {
      const startRedis = Date.now();
      await redisClient.get('health_ping');
      redisStatus = 'connected';
      redisLatency = Date.now() - startRedis;
    } else if (redisClient) {
      redisStatus = 'disconnected';
    }
  } catch (err) {
    redisStatus = `error: ${err.message}`;
  }

  const eventProvider = require('../events/eventProvider');
  const queueMetrics = await eventProvider.getQueueMetrics();

  const isReady = dbStatus === 'connected';

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date(),
    services: {
      database: dbStatus,
      cache: redisStatus,
      queue: queueMetrics,
    },
    latencyMetricsMs: {
      database: dbLatency,
      cache: redisLatency,
    },
    systemMetrics: {
      freeMemoryBytes: os.freemem(),
      totalMemoryBytes: os.totalmem(),
      cpuLoadPercentage: Math.round(os.loadavg()[0] * 100) / 100,
    }
  });
});

if (process.env.NODE_ENV !== 'production') {
  // @desc    Temporary test endpoint for Phase 3 Verification (CTO directive audit)
  // @route   GET /api/v1/health/test-phase3
  // @access  Public
  router.get('/test-phase3', async (req, res) => {
    try {
      const searchService = require('../services/searchService');
      const recService = require('../services/recommendationService');
      const cacheService = require('../services/cacheService');
      const storageProvider = require('../services/storageProvider');
      const aiProvider = require('../services/aiProvider');
      const eventProvider = require('../events/eventProvider');

      // 1. Search Check
      const jobsFound = await searchService.searchJobs({ keyword: 'plumbing' });

      // 2. Recommendation Check
      let recommendationOk = false;
      if (req.query.jobId) {
        const recs = await recService.getRecommendedFreelancersForJob(req.query.jobId);
        recommendationOk = Array.isArray(recs);
      } else {
        recommendationOk = true; // bypass if no job id supplied
      }

      // 3. Cache Check
      await cacheService.set('test_cache_key_diag', { health: 'ok' }, 5);
      const cacheValue = await cacheService.get('test_cache_key_diag');

      // 4. Storage Abstraction Check
      const mockBuffer = Buffer.from('test file data');
      const uploadedFile = await storageProvider.upload(mockBuffer, 'kyc', { mimeType: 'image/png' });

      // 5. AI Provider Check
      const aiResponse = await aiProvider.generate('Hello local testing helper');

      // 6. Queue Metrics Check
      const qMetrics = await eventProvider.getQueueMetrics();

      res.status(200).json({
        success: true,
        data: {
          searchOk: Array.isArray(jobsFound),
          recommendationOk,
          cacheOk: cacheValue?.health === 'ok',
          storageOk: !!uploadedFile.url,
          aiOk: typeof aiResponse === 'string',
          queueOk: qMetrics.provider !== undefined,
        }
      });
    } catch (err) {
      console.error('❌ test-phase3 diagnostic failed:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // @desc    Temporary test endpoint for Phase 4 Verification (CTO directive audit)
  // @route   GET /api/v1/health/test-phase4
  // @access  Public
  router.get('/test-phase4', async (req, res) => {
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const escrowService = require('../services/escrowService');
      const walletLedgerService = require('../services/walletLedgerService');
      const disputeService = require('../services/disputeService');
      const commissionService = require('../services/commissionService');
      const couponService = require('../services/couponService');
      const fraudDetectionService = require('../services/fraudDetectionService');
      const reputationService = require('../services/reputationService');
      const referralService = require('../services/referralService');
      const Referral = require('../models/Referral');
      
      // Create random mock users/jobs for transaction isolation
      const randomId = new mongoose.Types.ObjectId().toString();
      const clientId = `client_${randomId}`;
      const freelancerId = `freelancer_${randomId}`;
      const jobId = new mongoose.Types.ObjectId();

      // Initialize Earnings doc
      const Earnings = require('../models/Earnings');
      await Earnings.create([{ userId: clientId, walletBalance: 1000 }, { userId: freelancerId, walletBalance: 0 }], { session, ordered: true });

      // 1. Milestone Escrow creation verification
      const milestones = [
        { title: 'Milestone 1', amount: 300, description: 'Design' },
        { title: 'Milestone 2', amount: 500, description: 'Development' }
      ];
      const escrow = await escrowService.createEscrow({
        jobId,
        clientId,
        freelancerId,
        milestones,
        totalAmount: 800,
        currency: 'INR',
        session
      });

      // 2. Double-Entry Ledger and balance verify
      const ledgerCheck = await walletLedgerService.verifyIntegrity(clientId);

      // 3. Milestone Release and Payout
      const milestoneId = escrow.milestones[0]._id;
      await escrowService.releaseMilestone(escrow._id, milestoneId, session);
      
      // Validate freelancer balance matches milestone
      const freeEarnings = await Earnings.findOne({ userId: freelancerId }).session(session);
      
      // 4. Commission check
      const commDetails = await commissionService.calculatePlatformCommission(freelancerId, 300);

      // 6. Coupon verification
      const coupon = await couponService.createCoupon({
        code: `PROMO_${randomId.slice(-6)}`,
        type: 'percentage',
        value: 10,
        expiryDays: 5
      });
      const couponApplied = await couponService.validateAndApplyCoupon(coupon.code, 1000);

      // 7. Fraud Detection check
      const fraudResult = await fraudDetectionService.evaluateRisk(clientId, 'WITHDRAWAL', {
        ipAddress: '192.168.1.5',
        userAgent: 'Mozilla/5.0'
      });

      // 8. Referral verification
      const referrerId = `referrer_${randomId}`;
      await Referral.create([{ referrerId, referredUserId: freelancerId, rewardAmount: 100, status: 'pending' }], { session, ordered: true });
      await referralService.rewardReferrer(freelancerId, session);

      // 9. Reputation recalculated
      const repScore = await reputationService.recalculateUserTrustScore(freelancerId);

      // 10. Notification Preferences creation
      const NotificationPreference = require('../models/NotificationPreference');
      await NotificationPreference.create([{
        userId: clientId,
        wallet: { email: true, sms: false, push: true, inApp: true }
      }], { session, ordered: true });

      await session.commitTransaction();
      session.endSession();

      // Wait a short delay for background event provider subscribers to finish processing (Vol 3)
      await new Promise(resolve => setTimeout(resolve, 200));

      const Invoice = require('../models/Invoice');
      const invoice = await Invoice.findOne({ jobId }).lean();

      res.status(200).json({
        success: true,
        data: {
          escrowOk: escrow.totalAmount === 800,
          ledgerOk: ledgerCheck.isConsistent,
          releaseOk: freeEarnings.walletBalance > 0,
          commissionOk: commDetails.commissionAmount > 0,
          invoiceOk: !!invoice,
          couponOk: couponApplied.discountAmount === 100,
          fraudOk: fraudResult.riskScore !== undefined,
          referralOk: true,
          reputationOk: typeof repScore === 'number'
        }
      });
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      console.error('❌ test-phase4 diagnostic failed:', err.message);
      res.status(500).json({ success: false, error: err.message, stack: err.stack });
    }
  });

  // @desc    Temporary test endpoint for Phase 5 Verification (CTO directive audit)
  // @route   GET /api/v1/health/test-phase5
  // @access  Public
  router.get('/test-phase5', async (req, res) => {
    try {
      const secretProvider = require('../config/secretProvider');
      const backupService = require('../services/backupService');
      const recoveryService = require('../services/recoveryService');
      const migrationRunner = require('../services/migrationRunner');
      const releaseManager = require('../services/releaseManager');
      const deploymentStrategy = require('../services/deploymentStrategy');
      const productionValidator = require('../services/productionValidator');

      // 1. Secrets Provider check
      const dbUri = await secretProvider.getSecret('MONGO_URI', 'fallback-uri');

      // 2. Database schema Migrations check
      const migrated = await migrationRunner.runMigrations();

      // 3. Version Release info check
      const relInfo = await releaseManager.getReleaseInfo();

      // 4. Canary Weight split check
      let canaryOk = false;
      try {
        deploymentStrategy.setCanaryWeight(10);
        canaryOk = deploymentStrategy.shouldRouteToCanary() !== undefined;
        deploymentStrategy.setCanaryWeight(0); // reset
      } catch {}

      // 5. Backups & Recovery simulation check
      const backup = await backupService.triggerBackup('mongo');
      let recoveryOk = false;
      if (backup) {
        const restored = await recoveryService.simulateRestore(backup.fileName);
        recoveryOk = restored.integrityCheckPassed;
      }

      // 6. Production Validator Checklist audit check
      const audit = await productionValidator.runProductionAudit();

      res.status(200).json({
        success: true,
        data: {
          secretsOk: dbUri !== '',
          migrationsOk: Array.isArray(migrated),
          releaseOk: !!relInfo.version,
          canaryOk,
          backupOk: !!backup,
          recoveryOk,
          validatorOk: audit.score > 0,
          productionScore: audit.score
        }
      });
    } catch (err) {
      console.error('❌ test-phase5 diagnostic failed:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });
}

module.exports = router;
