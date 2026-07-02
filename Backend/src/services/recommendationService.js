const Job = require('../models/Job');
const User = require('../models/User');

class RecommendationService {
  /**
   * Generates scored recommended freelancers for a job
   */
  async getRecommendedFreelancersForJob(jobId, limit = 5) {
    const job = await Job.findById(jobId).lean();
    if (!job) return [];

    // Find all freelancers in system
    const freelancers = await User.find({ role: 'FREELANCER' }).lean();
    const scoredList = [];

    for (const f of freelancers) {
      let score = 0;

      // 1. Skill Match Score (up to 30 points)
      const matchingSkills = f.skills.filter(s => job.skillsRequired?.includes(s));
      const skillRatio = job.skillsRequired?.length ? (matchingSkills.length / job.skillsRequired.length) : 0.5;
      score += skillRatio * 30;

      // 2. Rating Score (up to 20 points)
      const rating = f.averageRating || 0;
      score += (rating / 5) * 20;

      // 3. Proximity Location distance score (up to 15 points)
      if (job.location?.coordinates && f.location?.coordinates) {
        const dist = this._calculateDistance(
          job.location.coordinates[1], job.location.coordinates[0],
          f.location.coordinates[1], f.location.coordinates[0]
        );
        // Score decays as distance grows, max distance 100km
        const distanceScore = Math.max(0, 15 * (1 - dist / 100));
        score += distanceScore;
      } else {
        score += 7.5; // mid-value fallback
      }

      // 4. Job Completion Rate (up to 15 points)
      const completionRate = f.jobCompletionRate !== undefined ? f.jobCompletionRate : 90; // Default to 90% completion
      score += (completionRate / 100) * 15;

      // 5. Response Time score (up to 10 points)
      const responseTimeHours = f.averageResponseTimeHours !== undefined ? f.averageResponseTimeHours : 2;
      const responseScore = Math.max(0, 10 * (1 - responseTimeHours / 24)); // scale 1-24 hours
      score += responseScore;

      // 6. Availability Status (up to 5 points)
      if (f.availabilityStatus === 'available') {
        score += 5;
      }

      // 7. Verified Badge (up to 5 points)
      if (f.isKycVerified) {
        score += 5;
      }

      scoredList.push({
        freelancer: f,
        score: Math.round(score),
      });
    }

    // Sort by recommendation score descending
    return scoredList
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Generates scored recommended jobs for a freelancer
   */
  async getRecommendedJobsForFreelancer(freelancerId, limit = 5) {
    const freelancer = await User.findById(freelancerId).lean();
    if (!freelancer) return [];

    // Find all open jobs
    const jobs = await Job.find({ status: 'open' }).lean();
    const scoredList = [];

    for (const job of jobs) {
      let score = 0;

      // 1. Skill Overlap (up to 35 points)
      const matchingSkills = freelancer.skills.filter(s => job.skillsRequired?.includes(s));
      const skillRatio = job.skillsRequired?.length ? (matchingSkills.length / job.skillsRequired.length) : 0.5;
      score += skillRatio * 35;

      // 2. Proximity Distance (up to 25 points)
      if (job.location?.coordinates && freelancer.location?.coordinates) {
        const dist = this._calculateDistance(
          job.location.coordinates[1], job.location.coordinates[0],
          freelancer.location.coordinates[1], freelancer.location.coordinates[0]
        );
        const distanceScore = Math.max(0, 25 * (1 - dist / 50)); // smaller 50km radius scope
        score += distanceScore;
      } else {
        score += 12.5;
      }

      // 3. Budget compatibility (up to 20 points)
      if (job.budget) {
        const hourlyRate = freelancer.hourlyRate || 500;
        const ratio = Math.min(1, job.budget / (hourlyRate * 8)); // compare job budget against 8 hours rate
        score += ratio * 20;
      } else {
        score += 10;
      }

      // 4. Freshness Score (up to 20 points)
      const hoursSincePosted = (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60);
      const freshnessScore = Math.max(0, 20 * (1 - hoursSincePosted / 168)); // decay over 1 week (168 hours)
      score += freshnessScore;

      scoredList.push({
        job,
        score: Math.round(score),
      });
    }

    return scoredList
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Helper: Calculates Great-Circle distance in km using Haversine formula
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

module.exports = new RecommendationService();
