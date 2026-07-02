const Job = require('../models/Job');
const User = require('../models/User');
const featureFlags = require('../config/featureFlags');

class SearchService {
  /**
   * Search jobs with structured filtering and ranking
   */
  async searchJobs(filters = {}) {
    const query = {};

    // 1. Keyword search (MongoDB Text Index)
    if (filters.keyword) {
      query.$text = { $search: filters.keyword };
    }

    // 2. Category
    if (filters.category) {
      query.category = filters.category;
    }

    // 3. Required Skills (matching any or all)
    if (filters.skills && Array.isArray(filters.skills) && filters.skills.length > 0) {
      query.skillsRequired = { $in: filters.skills };
    }

    // 4. Budget limits
    if (filters.budgetMin !== undefined || filters.budgetMax !== undefined) {
      query.budget = {};
      if (filters.budgetMin !== undefined) query.budget.$gte = Number(filters.budgetMin);
      if (filters.budgetMax !== undefined) query.budget.$lte = Number(filters.budgetMax);
    }

    // 5. Job Status
    if (filters.status) {
      query.status = filters.status;
    } else {
      query.status = 'open'; // Default to search only active postings
    }

    // 6. Experience requirement
    if (filters.experienceLevel) {
      query.experienceLevel = filters.experienceLevel;
    }

    // 7. Remote vs Onsite
    if (filters.remote !== undefined) {
      query.isRemote = filters.remote === 'true' || filters.remote === true;
    }

    // 8. Date ranges (today vs this week)
    if (filters.dateRange) {
      const now = new Date();
      if (filters.dateRange === 'today') {
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        query.createdAt = { $gte: startOfToday };
      } else if (filters.dateRange === 'week') {
        const startOfWeek = new Date(now.setDate(now.getDate() - 7));
        query.createdAt = { $gte: startOfWeek };
      }
    }

    // 9. Location & Distance Radius
    if (filters.latitude && filters.longitude && filters.radiusKm) {
      const radiusInMeters = Number(filters.radiusKm) * 1000;
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(filters.longitude), Number(filters.latitude)],
          },
          $maxDistance: radiusInMeters,
        },
      };
    }

    // Projections and text scoring
    const projection = {};
    let sort = { createdAt: -1 };

    if (filters.keyword) {
      projection.score = { $meta: 'textScore' };
      sort = { score: { $meta: 'textScore' } };
    }

    // Execute query using performance lean options (Vol 14)
    return Job.find(query, projection)
      .select('title description category budget location budgetRange isUrgent client status createdAt skillsRequired')
      .sort(sort)
      .lean();
  }

  /**
   * Search freelancers (Users with FREELANCER role) with structured filters
   */
  async searchFreelancers(filters = {}) {
    const query = { role: 'FREELANCER' };

    // 1. Keyword search (MongoDB Text Index)
    if (filters.keyword) {
      query.$text = { $search: filters.keyword };
    }

    // 2. Skills matching
    if (filters.skills && Array.isArray(filters.skills) && filters.skills.length > 0) {
      query.skills = { $in: filters.skills };
    }

    // 3. Min Rating
    if (filters.minRating !== undefined) {
      query.averageRating = { $gte: Number(filters.minRating) };
    }

    // 4. Hourly Rate ranges
    if (filters.rateMin !== undefined || filters.rateMax !== undefined) {
      query.hourlyRate = {};
      if (filters.rateMin !== undefined) query.hourlyRate.$gte = Number(filters.rateMin);
      if (filters.rateMax !== undefined) query.hourlyRate.$lte = Number(filters.rateMax);
    }

    // 5. Availability Status
    if (filters.availability) {
      query.availabilityStatus = filters.availability;
    }

    // 6. Verified Badge
    if (filters.verified !== undefined) {
      query.isEmailVerified = filters.verified === 'true' || filters.verified === true;
    }

    // 7. KYC Status verified
    if (filters.kycVerified !== undefined) {
      query.isKycVerified = filters.kycVerified === 'true' || filters.kycVerified === true;
    }

    // 8. Experience Years
    if (filters.experienceYears !== undefined) {
      query.experienceYears = { $gte: Number(filters.experienceYears) };
    }

    // 9. Location & Distance Radius
    if (filters.latitude && filters.longitude && filters.radiusKm) {
      const radiusInMeters = Number(filters.radiusKm) * 1000;
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(filters.longitude), Number(filters.latitude)],
          },
          $maxDistance: radiusInMeters,
        },
      };
    }

    const projection = {};
    let sort = { averageRating: -1 };

    if (filters.keyword) {
      projection.score = { $meta: 'textScore' };
      sort = { score: { $meta: 'textScore' } };
    }

    return User.find(query, projection)
      .select('name username email role skills averageRating hourlyRate availabilityStatus isEmailVerified isKycVerified location experienceYears profilePicture bio')
      .sort(sort)
      .lean();
  }

  /**
   * Auto suggestion completions
   */
  async getSuggestions(searchStr, limit = 5) {
    if (!featureFlags.ENABLE_SEARCH_SUGGESTIONS || !searchStr) return [];
    
    // Find active categories matching text prefix
    const jobs = await Job.find({ category: { $regex: '^' + searchStr, $options: 'i' } })
      .distinct('category')
      .lean();

    return jobs.slice(0, limit);
  }
}

module.exports = new SearchService();
