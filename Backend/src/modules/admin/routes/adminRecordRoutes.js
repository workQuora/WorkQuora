const express = require('express');
const router = express.Router();
const { getAllRecords, getUserRecords } = require('../controllers/adminRecordController');
const { protectAdmin, requirePermission } = require('../middleware/adminAuthMiddleware');

router.use(protectAdmin);

router.get('/',                requirePermission('view_audit_logs'), getAllRecords);
router.get('/user/:userId',    requirePermission('view_audit_logs'), getUserRecords);

module.exports = router;
