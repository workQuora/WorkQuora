const Dispute = require('../../../models/Dispute');
const disputeService = require('../../../services/disputeService');

exports.getAllDisputes = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status.toUpperCase();

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Dispute.countDocuments(filter);

    const disputes = await Dispute.find(filter)
      .populate('openedBy', 'name email role')
      .populate('againstUser', 'name email role')
      .populate({
        path: 'escrowId',
        select: 'totalAmount currency jobId clientId freelancerId',
        populate: [
          { path: 'jobId', select: 'title' },
          { path: 'clientId', select: 'name' },
          { path: 'freelancerId', select: 'name' },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: disputes.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: disputes,
    });
  } catch (err) {
    next(err);
  }
};

exports.getDisputeById = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.disputeId)
      .populate('openedBy', 'name email role')
      .populate('againstUser', 'name email role')
      .populate({
        path: 'escrowId',
        select: 'totalAmount currency jobId clientId freelancerId milestones',
        populate: [
          { path: 'jobId', select: 'title' },
          { path: 'clientId', select: 'name email' },
          { path: 'freelancerId', select: 'name email' },
        ],
      });

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    res.status(200).json({ success: true, data: dispute });
  } catch (err) {
    next(err);
  }
};

// Delegates to disputeService.resolveDispute — it resolves client/freelancer
// identity from the Escrow (not dispute.openedBy/againstUser, since either
// party can be the one who filed the dispute) and wraps the wallet credits +
// escrow milestone update in one transaction, validated against the actual
// disputed amount.
exports.adminResolveDispute = async (req, res, next) => {
  try {
    const { clientRefund, freelancerPayout, note } = req.body;

    if (clientRefund === undefined && freelancerPayout === undefined) {
      return res.status(400).json({ success: false, message: 'Provide clientRefund or freelancerPayout amount' });
    }

    const dispute = await disputeService.resolveDispute(
      req.params.disputeId,
      Number(clientRefund) || 0,
      Number(freelancerPayout) || 0,
      req.admin.id,
      note
    );

    res.status(200).json({ success: true, data: dispute });
  } catch (err) {
    if (err.message === 'Dispute not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.message === 'Dispute already resolved' || err.message.includes('must match disputed')) {
      return res.status(409).json({ success: false, message: err.message });
    }
    next(err);
  }
};
