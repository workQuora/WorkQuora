const User = require('../models/User');
const Session = require('../models/Session');
const featureFlags = require('../config/featureFlags');

class CronService {
  constructor() {
    this.jobs = [];
  }

  /**
   * Initialize and start all scheduled jobs
   */
  startScheduledJobs() {
    if (!featureFlags.ENABLE_CRON) {
      console.log('⏰ CronService: Cron jobs are disabled by feature flags.');
      return;
    }

    console.log('⏰ CronService: Initializing scheduled background cleanups...');

    // Job 1: Cleanup Expired Sessions (Runs every hour)
    const cleanupSessionsInterval = setInterval(async () => {
      try {
        const deleted = await Session.deleteMany({ expiresAt: { $lt: new Date() } });
        if (deleted.deletedCount > 0) {
          console.log(`⏰ Cron Job: Cleaned up ${deleted.deletedCount} expired sessions.`);
        }
      } catch (err) {
        console.error('❌ Cron cleanupSessions error:', err.message);
      }
    }, 60 * 60 * 1000); // 1 Hour

    // Job 2: Expire OTP locks (Runs every 5 minutes)
    const expireOtpsInterval = setInterval(async () => {
      try {
        const result = await User.updateMany(
          { otpLockedUntil: { $lt: new Date() } },
          { $set: { otpLockedUntil: null, otpAttempts: 0 } }
        );
        if (result.modifiedCount > 0) {
          console.log(`⏰ Cron Job: Unlocked ${result.modifiedCount} account OTP locks.`);
        }
      } catch (err) {
        console.error('❌ Cron expireOtps error:', err.message);
      }
    }, 5 * 60 * 1000); // 5 Minutes

    this.jobs.push(cleanupSessionsInterval, expireOtpsInterval);
  }

  /**
   * Stop all scheduled jobs (Clean up timers for server shutdown / Vol 20)
   */
  stopAllJobs() {
    for (const job of this.jobs) {
      clearInterval(job);
    }
    this.jobs = [];
    console.log('⏰ CronService: Stopped all cron timers.');
  }
}

module.exports = new CronService();
