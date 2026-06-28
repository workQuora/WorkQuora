const Job = require('../models/Job');
const User = require('../models/User');
const redisClient = require('../config/redis');
const { extractSkillsFromText } = require('../utils/geminiAI');
const { createNotification } = require('../utils/notification');
const eventBus = require('../events/eventBus');
const crypto = require('crypto');

// Default search radius definitions by service category (Engineering Bible Vol 7)
const CATEGORY_DEFAULT_RADIUS = {
  'Home Services': 10,
  'Plumbing': 10,
  'Local Services': 12,
  'Development': 50, // Development/Designers can support wider ranges
  'Designers': 50,
  'Marketing': 30,
};

// Haversine distance calculator in kilometers
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

class SmartMatchingService {
  constructor() {
    // Register asynchronous background listener for new job postings
    eventBus.on('JobCreated', async (jobId, io) => {
      console.log(`📡 Event received: JobCreated for Job ID: ${jobId}`);
      try {
        await this.processJobMatching(jobId, io);
      } catch (error) {
        console.error(`❌ Background smart matching failed for job ${jobId}:`, error.message);
      }
    });
  }

  /**
   * Background matching processor triggered asynchronously by event bus
   */
  async processJobMatching(jobId, io) {
    // 1. Retrieve job details from MongoDB
    const job = await Job.findById(jobId);
    if (!job) {
      console.warn(`Job ${jobId} not found. Aborting matching.`);
      return;
    }

    // 2. Fetch and rank candidates matching the criteria
    const rankedCandidates = await this.findAndRankCandidates(job, {
      clientLatitude: job.location.coordinates[1],
      clientLongitude: job.location.coordinates[0],
    });

    console.log(`🤖 Smart Match Engine: Found ${rankedCandidates.length} matching candidates for job: "${job.title}"`);

    // 3. Dispatch persistent database and real-time Socket.io notifications
    for (const candidate of rankedCandidates) {
      // Build premium notification text containing match percentage
      const alertMsg = `New job match! "${job.title}" posted near you (${candidate.distance} km) with a ${candidate.matchScore}% Match Score.`;
      
      await createNotification({
        recipient: candidate._id.toString(),
        sender: job.client.toString(),
        type: 'system_alert',
        message: alertMsg,
        relatedId: job._id,
        onModel: 'Job',
        io,
      });
    }
  }

  /**
   * High performance matching & Multi-Factor Score Calculator
   */
  async findAndRankCandidates(job, options = {}) {
    const { clientLatitude, clientLongitude, clientRadiusOverride } = options;
    const description = job.description;

    // A. Extract skill tags with Redis AI caching
    let aiSkills = [];
    const descHash = crypto.createHash('md5').update(description).digest('hex');
    const aiCacheKey = `ai:skills:${descHash}`;

    if (redisClient.isOpen) {
      const cached = await redisClient.get(aiCacheKey).catch(() => null);
      if (cached) {
        aiSkills = JSON.parse(cached);
        console.log(`⚡ AI skills loaded from cache for job description hash: ${descHash}`);
      }
    }

    if (!aiSkills || aiSkills.length === 0) {
      aiSkills = await extractSkillsFromText(description);
      if (redisClient.isOpen && aiSkills.length > 0) {
        // Cache skills extraction for 7 days
        await redisClient.setEx(aiCacheKey, 3600 * 24 * 7, JSON.stringify(aiSkills)).catch(() => {});
      }
    }

    // Ensure all extracted skills are normalized (lowercase & trimmed)
    const normalizedAiSkills = aiSkills.map(s => s.toLowerCase().trim());
    if (normalizedAiSkills.length === 0) {
      return [];
    }

    // B. Create regex fallback lists
    const escapedRegexList = normalizedAiSkills.map(
      skill => new RegExp(skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i')
    );

    // C. Query matching available & online freelancers
    // Exclude: BUSY, ON_JOB, VACATION, OFFLINE
    const candidateQuery = {
      role: 'FREELANCER',
      isAvailable: true,
      availabilityStatus: { $in: ['AVAILABLE', 'ONLINE'] },
      $or: [
        { normalizedSkills: { $in: normalizedAiSkills } },
        { skills: { $in: escapedRegexList } } // regex fallback
      ]
    };

    // Geospatial search within dynamic maximum search boundary
    // Determine category default radius
    const categoryRadius = CATEGORY_DEFAULT_RADIUS[job.category] || 25; // default 25 km
    const maxRadius = clientRadiusOverride || categoryRadius; // Client override takes priority

    if (clientLatitude && clientLongitude) {
      candidateQuery.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [clientLongitude, clientLatitude] },
          $maxDistance: maxRadius * 1000, // MongoDB expects meters
        },
      };
    }

    const candidates = await User.find(candidateQuery).select('-password');
    const rankedList = [];

    // D. Compute Multi-Factor Match Score & Marketplace Balancer for each candidate
    for (const user of candidates) {
      const uLng = user.location?.coordinates?.[0];
      const uLat = user.location?.coordinates?.[1];

      // 1. Calculate road distance proxy (mock velocity/proximity metrics)
      let distance = 0;
      if (clientLatitude && clientLongitude && uLat && uLng) {
        distance = calculateDistance(clientLatitude, clientLongitude, uLat, uLng);
      }

      // Check if distance satisfies worker's service radius preference (Bible Vol 7)
      const allowedRadius = user.serviceRadius || 25;
      if (distance > allowedRadius) {
        continue; // skip worker if job is outside their preferred service range
      }

      // 2. Skill matches ratio
      const userNormSkills = (user.normalizedSkills || []).map(s => s.toLowerCase().trim());
      const matchedCount = normalizedAiSkills.filter(
        skill => userNormSkills.includes(skill) || user.skills.some(s => new RegExp(skill, 'i').test(s))
      ).length;
      const skillMatchRatio = matchedCount / normalizedAiSkills.length;

      // 3. Normalized Factor Calculations (Scale 0-1)
      const distanceScore = Math.max(0, (maxRadius - distance) / maxRadius);
      const trustScoreScore = (user.trustScore || 50) / 100;
      const ratingScore = (user.averageRating || 0) / 5;
      const successRateScore = (user.jobSuccessRate || 95) / 100;
      const availabilityScore = user.availabilityStatus === 'ONLINE' ? 1.0 : 0.8;
      const responseTimeScore = Math.max(0, (120 - (user.responseTimeMinutes || 30)) / 120); // 120+ mins is worst
      const experienceScore = Math.min(1.0, (user.experienceYears || 2) / 10); // 10+ years maxed
      const cancellationScore = Math.max(0, (100 - (user.cancellationRate || 2)) / 100);

      // 4. Weight assignments (Vol 8)
      // Distance (25%), Skill Match (20%), Trust Score (15%), Rating (10%), Success Rate (10%), Availability (5%), Response Time (5%), Experience (5%), Cancellation Rate (5%)
      let score = 
        (0.25 * distanceScore) +
        (0.20 * skillMatchRatio) +
        (0.15 * trustScoreScore) +
        (0.10 * ratingScore) +
        (0.10 * successRateScore) +
        (0.05 * availabilityScore) +
        (0.05 * responseTimeScore) +
        (0.05 * experienceScore) +
        (0.05 * cancellationScore);

      // 5. Apply Marketplace Balancer & Load Fairness
      // utilization penalty: subtract points if freelancer is overloaded to balance recommendations
      let utilizationPenalty = 0;
      if (user.pendingJobsCount && user.pendingJobsCount > 0) {
        utilizationPenalty += user.pendingJobsCount * 0.10; // -10% score per pending task
      }
      if (user.recentJobsReceivedCount && user.recentJobsReceivedCount > 0) {
        utilizationPenalty += user.recentJobsReceivedCount * 0.05; // -5% score per recent job assigned
      }
      score = Math.max(0.1, score - utilizationPenalty);

      // Convert to clean percentage integer
      const finalPercentage = Math.round(score * 100);

      // 6. Build Explainable Match Markdown Explanation (Engineering Bible Vol 8)
      const matchedSkillTags = normalizedAiSkills.filter(
        skill => userNormSkills.includes(skill) || user.skills.some(s => new RegExp(skill, 'i').test(s))
      );
      const explanation = `• Nearby (${Math.round(distance * 10) / 10} km)
• ${user.trustScore ? `Trust Score: ${user.trustScore}` : 'Verified Worker'}
• ${user.jobSuccessRate || 95}% Job Success Rate
• ${user.experienceYears || 2} Years Experience
• Matching Skills: ${matchedSkillTags.join(', ') || 'General'}`;

      rankedList.push({
        ...user.toObject(),
        distance: Math.round(distance * 10) / 10,
        matchScore: finalPercentage,
        matchExplanation: explanation,
      });
    }

    // E. Sort descending by match score
    rankedList.sort((a, b) => b.matchScore - a.matchScore);

    return rankedList;
  }
}

// Single instance to export
const smartMatchingService = new SmartMatchingService();

module.exports = smartMatchingService;
