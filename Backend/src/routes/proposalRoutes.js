const express = require('express');
const router = express.Router();
const { submitProposal, getJobProposals, acceptProposal, rejectProposal, getMyProposals } = require('../controllers/proposalController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { requireKyc } = require('../middlewares/requireKyc');

// Freelancer views their own submitted proposals — specific route, must come
// before the param routes below.
router.get('/my-proposals', protect, authorize('freelancer'), getMyProposals);

// Freelancer applies to a job
router.post('/:jobId', protect, authorize('freelancer'), requireKyc, submitProposal);

// Client views proposals for their job
router.get('/job/:jobId', protect, authorize('client'), getJobProposals);

// Client accepts/rejects a proposal
router.put('/:proposalId/accept', protect, authorize('client'), requireKyc, acceptProposal);
router.put('/:proposalId/reject', protect, authorize('client'), requireKyc, rejectProposal);

module.exports = router;