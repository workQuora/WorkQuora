const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/', authorize('ADMIN'), settingsController.updateSettings);
router.get('/', authorize('ADMIN'), settingsController.getSettings);

router.get('/privacy', settingsController.getPrivacySettings);
router.put('/privacy', settingsController.updatePrivacySettings);

router.get('/notifications', settingsController.getNotificationPrefs);
router.put('/notifications', settingsController.updateNotificationPrefs);

module.exports = router;
