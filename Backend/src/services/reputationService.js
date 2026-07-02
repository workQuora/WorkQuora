const User = require('../models/User');
const Review = require('../models/Review');
const Task = require('../models/Task');
const featureFlags = require('../config/featureFlags');

class ReputationService {
  /**
   * Recalculates and updates the unified WorkQuora Trust Score for a user
   */
  async recalculateUserTrustScore(userId) {
    if (!featureFlags.ENABLE_REPUTATION) {
      return 100;
    }

    try {
      const user = await User.findById(userId);
      if (!user) return 0;

      let score = 50; // Base baseline score

      // 1. Review Ratings contribution (up to 25 points)
      const reviews = await Review.find({ reviewee: userId }).lean();
      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        score += (avgRating / 5) * 25;
      } else {
        score += 15; // default rating points for new users
      }

      // 2. Job Completion vs Cancellation rates (up to 20 points)
      const totalJobs = await Task.countDocuments({ freelancer: userId });
      if (totalJobs > 0) {
        const completedJobs = await Task.countDocuments({ freelancer: userId, status: 'completed' });
        const completionRate = completedJobs / totalJobs;
        score += completionRate * 20;
      } else {
        score += 10;
      }

      // 3. KYC Verification Status (up to 15 points)
      const Kyc = require('../models/NotificationPreference').db.model('Kyc'); // avoid direct import if not compiled
      const kyc = await Kyc.findOne({ userId }).lean();
      if (kyc && kyc.globalStatus === 'verified') {
        score += 15;
      }

      // 4. Verified Badge (up to 10 points)
      if (user.isKycVerified) {
        score += 10;
      }

      // 5. Active Status (up to 10 points)
      if (user.availabilityStatus === 'available') {
        score += 10;
      }

      // 6. Caps bounds checking
      const finalScore = Math.min(100, Math.max(0, Math.round(score)));

      // Save back to user profile (schemaless Mongoose parameter)
      user.reputationScore = finalScore;
      await user.save();

      console.log(`⭐ Reputation Engine: Computed Trust Score ${finalScore}/100 for user ${userId}`);
      return finalScore;
    } catch (err) {
      console.error('⚠️ ReputationService recalculation failure:', err.message);
      return 80; // safe default fallback
    }
  }
}

module.exports = new ReputationService();
