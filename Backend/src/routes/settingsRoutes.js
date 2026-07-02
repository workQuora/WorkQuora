const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/', authorize('ADMIN'), settingsController.updateSettings);
router.get('/', authorize('ADMIN'), settingsController.getSettings);

module.exports = router;
