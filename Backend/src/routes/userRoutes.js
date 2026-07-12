const express = require('express');
const router = express.Router();
const { checkUsernameAvailability } = require('../controllers/profileController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/check-username', protect, checkUsernameAvailability);

module.exports = router;
