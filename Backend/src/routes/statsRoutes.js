const express = require('express');
const router = express.Router();
const { getPublicStats, getServiceStats } = require('../controllers/statsController');

router.get('/public', getPublicStats);
router.get('/services', getServiceStats);

module.exports = router;
