const express = require('express');
const router  = express.Router();
const { getNearbyJobs, getNearbyFreelancers, updateLocation, setRadius, searchLocation } = require('../controllers/geoController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/nearby-jobs',          getNearbyJobs);
router.get('/nearby-freelancers',   getNearbyFreelancers);
router.get('/search',               searchLocation);
router.put('/update-location',      protect, updateLocation);
router.put('/set-radius',           protect, setRadius);

module.exports = router;