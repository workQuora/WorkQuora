const Job = require('../models/Job');
const User = require('../models/User');

// GET /api/v1/stats/public
exports.getPublicStats = async (req, res, next) => {
  try {
    const [liveJobs, totalWorkers, totalClients] = await Promise.all([
      Job.countDocuments({ status: 'open' }),
      User.countDocuments({ role: 'FREELANCER' }),
      User.countDocuments({ role: 'CLIENT' }),
    ]);

    res.status(200).json({
      success: true,
      data: { liveJobs, totalWorkers, totalClients },
    });
  } catch (error) {
    next(error);
  }
};
