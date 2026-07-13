const Record = require('../../../models/Record');

// GET /api/admin/records — full account-history trail, paginated & filterable.
// Admin-only by design (see Record model comment) — never exposed to users.
exports.getAllRecords = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) filter.timestamp.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.timestamp.$lte = new Date(req.query.endDate);
    }

    const [records, total] = await Promise.all([
      Record.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      Record.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true, data: records,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
};

// GET /api/admin/records/user/:userId — a specific user's full history,
// plus a per-action count summary (e.g. "email changed 3 times").
exports.getUserRecords = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const [records, counts] = await Promise.all([
      Record.find({ userId }).sort({ timestamp: -1 }).lean(),
      Record.aggregate([
        { $match: { userId } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
      ]),
    ]);

    const changeCounts = counts.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {});

    res.status(200).json({ success: true, data: records, changeCounts });
  } catch (error) { next(error); }
};
