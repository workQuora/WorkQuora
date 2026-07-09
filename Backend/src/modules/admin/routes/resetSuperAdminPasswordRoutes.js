const express = require('express');
const router = express.Router();
const AdminUser = require('../models/AdminUser');

// POST /api/admin/reset-superadmin-password
// One-time password-reset route — same guard pattern as bootstrapRoutes.js.
// Remove this route manually after use.
router.post('/', async (req, res, next) => {
  try {
    const secret = req.headers['x-bootstrap-secret'];
    if (!secret || secret !== process.env.BOOTSTRAP_SECRET) {
      return res.status(401).json({ success: false, message: 'Invalid or missing bootstrap secret' });
    }

    if (!process.env.SUPER_ADMIN_PASSWORD) {
      return res.status(500).json({ success: false, message: 'SUPER_ADMIN_PASSWORD not set in environment' });
    }

    const admin = await AdminUser.findOne({ isSuperAdmin: true });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'No super admin exists' });
    }

    admin.password = process.env.SUPER_ADMIN_PASSWORD;
    await admin.save(); // triggers pre('save') re-hash

    res.status(200).json({
      success: true,
      message: 'Super admin password reset successfully',
      data: { id: admin._id, email: admin.email },
    });
  } catch (error) { next(error); }
});

module.exports = router;
