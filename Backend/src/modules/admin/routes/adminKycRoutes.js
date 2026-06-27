const express = require('express');
const router = express.Router();
const { getPendingKycs, reviewKycStep } = require('../controllers/adminKycController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');

router.use(protectAdmin);

router.get('/pending', getPendingKycs);
router.patch('/:userId/review', reviewKycStep);

module.exports = router;
