const express = require('express');
const router = express.Router();

const { 
  createJob, 
  getJobs, 
  getJobById, 
  searchJobs, 
  updateJob, 
  deleteJob,
  getMyJobs,
  getLandingStats,
  completeJob,
  cancelJob,
  uploadJobPhoto,
} = require('../controllers/jobController');

const { protect, authorize, optionalProtect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { requireKyc } = require('../middlewares/requireKyc');

// Phase A: client-side KYC requirement removed — freelancer KYC stays
// mandatory. `/:id/complete` and `/:id/cancel` below are hit by BOTH roles,
// so the gate is skipped only for clients rather than removed outright.
const requireKycUnlessClient = (req, res, next) => {
  if (req.user?.role?.toLowerCase() === 'client') return next();
  return requireKyc(req, res, next);
};

// 🚨 WARNING: Specific routes jaise '/search' hamesha '/:id' ke upar hone chahiye!
router.get('/stats', getLandingStats);
router.get('/search', searchJobs);
router.get('/my-jobs', protect, authorize('client'), getMyJobs);
// DEPRECATED (Phase A): client KYC requirement removed from photo upload.
// router.post('/upload-photo', protect, authorize('client'), requireKyc, upload.single('photo'), uploadJobPhoto);
router.post('/upload-photo', protect, authorize('client'), upload.single('photo'), uploadJobPhoto);

// Standard Routes
router.route('/')
  .get(getJobs)
  .post(protect, authorize('client'), createJob); // Sirf client job post kar sakta hai

router.route('/:id')
  .get(optionalProtect, getJobById)
  // DEPRECATED (Phase A): client KYC requirement removed from job edits.
  // .put(protect, authorize('client'), requireKyc, updateJob)
  .put(protect, authorize('client'), updateJob)
  .delete(protect, authorize('client'), deleteJob);

router.put('/:id/complete', protect, requireKycUnlessClient, completeJob);
router.put('/:id/cancel', protect, requireKycUnlessClient, cancelJob);

// Convenience: Apply to job (proxies to proposals)
const { submitProposal } = require('../controllers/proposalController');
router.post('/:id/apply', protect, authorize('freelancer'), requireKyc, (req, res, next) => {
  req.params.jobId = req.params.id;
  next();
}, submitProposal);

module.exports = router;