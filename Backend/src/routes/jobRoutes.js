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

// 🚨 WARNING: Specific routes jaise '/search' hamesha '/:id' ke upar hone chahiye!
router.get('/stats', getLandingStats);
router.get('/search', searchJobs);
router.get('/my-jobs', protect, authorize('client'), getMyJobs);
router.post('/upload-photo', protect, authorize('client'), requireKyc, upload.single('photo'), uploadJobPhoto);

// Standard Routes
router.route('/')
  .get(getJobs)
  .post(protect, authorize('client'), createJob); // Sirf client job post kar sakta hai

router.route('/:id')
  .get(optionalProtect, getJobById)
  .put(protect, authorize('client'), requireKyc, updateJob)
  .delete(protect, authorize('client'), deleteJob);

router.put('/:id/complete', protect, requireKyc, completeJob);
router.put('/:id/cancel', protect, requireKyc, cancelJob);

// Convenience: Apply to job (proxies to proposals)
const { submitProposal } = require('../controllers/proposalController');
router.post('/:id/apply', protect, authorize('freelancer'), requireKyc, (req, res, next) => {
  req.params.jobId = req.params.id;
  next();
}, submitProposal);

module.exports = router;