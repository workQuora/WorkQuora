const express = require('express');
const router = express.Router();
const adController = require('../controllers/adController');

// Public Routes
router.get('/active', adController.getActiveAd);
router.post('/track', adController.trackAdMetrics);

module.exports = router;
