const express = require('express');
const router = express.Router();
const { seedCategories, updateCategoryImage } = require('../controllers/categoryController');
// Real admin auth (AdminUser + its own JWT secret), not User.role — the
// User schema's 'ADMIN' role enum value has no self-service assignment
// path (registerUser/assignRole only ever allow CLIENT/FREELANCER) and
// protect()'s onboarding gate only recognizes CLIENT/FREELANCER as
// "onboarded", so it isn't a usable admin auth path in practice. This
// mounts under /api/v1/admin (matching the requested route paths) but
// authenticates via the same protectAdmin the rest of the real admin
// panel (Backend/src/modules/admin) already uses.
const { protectAdmin } = require('../modules/admin/middleware/adminAuthMiddleware');

router.post('/seed', protectAdmin, seedCategories);
router.patch('/:slug/image', protectAdmin, updateCategoryImage);

module.exports = router;
