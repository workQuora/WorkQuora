const Job = require('../models/Job');
const User = require('../models/User');
const JobPayment = require('../models/JobPayment');

// GET /api/v1/stats/public
exports.getPublicStats = async (req, res, next) => {
  try {
    const [liveJobs, totalWorkers, totalClients, completedJobs, totalJobs, escrowAgg] = await Promise.all([
      Job.countDocuments({ status: 'open' }),
      User.countDocuments({ role: 'FREELANCER' }),
      User.countDocuments({ role: 'CLIENT' }),
      Job.countDocuments({ status: 'completed' }),
      Job.countDocuments({}),
      // JobPayment.amount is already stored in paise (see model comment) —
      // sum every payment that actually entered escrow (excludes 'pending',
      // which hasn't been captured yet) for a lifetime "escrow protected" figure.
      JobPayment.aggregate([
        { $match: { status: { $ne: 'pending' } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const successRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : null;
    const escrowProtectedPaise = escrowAgg[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: { liveJobs, totalWorkers, totalClients, completedJobs, successRate, escrowProtectedPaise },
    });
  } catch (error) {
    next(error);
  }
};

// Freelancers tag freeform skill strings (User.normalizedSkills, lowercased).
// There's no dedicated service-slug field yet, so each slug below is matched
// against a keyword list. Refine these as real skill data accumulates.
const SERVICE_KEYWORDS = {
  plumber: ['plumb'],
  electrician: ['electric'],
  'ac-repair': ['ac repair', 'air condition', 'hvac', 'ac technician', 'ac service', 'ac installation', 'ac maintenance'],
  maid: ['maid', 'house help', 'housekeeping', 'domestic help', 'house clean'],
  carpenter: ['carpen', 'furniture', 'woodwork'],
  painter: ['paint'],
  cook: ['cook', 'chef', 'tiffin'],
  mechanic: ['mechanic', 'auto repair', 'bike repair', 'car repair'],
  'vehicle-wash': ['vehicle wash', 'car wash', 'bike wash'],
};

// GET /api/v1/stats/services
exports.getServiceStats = async (req, res, next) => {
  try {
    // Only KYC-verified freelancers count towards a public "verified
    // professionals" figure.
    const workers = await User.find(
      { role: 'FREELANCER', isKycVerified: true },
      { normalizedSkills: 1 }
    ).lean();

    const counts = Object.fromEntries(Object.keys(SERVICE_KEYWORDS).map((slug) => [slug, 0]));

    for (const worker of workers) {
      const skills = worker.normalizedSkills || [];
      for (const [slug, keywords] of Object.entries(SERVICE_KEYWORDS)) {
        if (skills.some((skill) => keywords.some((kw) => skill.includes(kw)))) {
          counts[slug] += 1;
        }
      }
    }

    res.status(200).json(counts);
  } catch (error) {
    next(error);
  }
};
