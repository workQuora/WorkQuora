const express = require('express');
const router  = express.Router();
const { registerUser, verifyRegistration, verifyMobile, sendMobileOtp, loginUser, logoutUser, getMe, socialLogin, assignRole, forgotPassword, resetPassword, checkUsername } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const { enforceStringParams } = require('../middlewares/securityMiddleware');

router.post('/register',          enforceStringParams(['name', 'email', 'username', 'mobileNumber', 'password', 'gender', 'role']), registerUser);
router.post('/verify-registration', enforceStringParams(['email', 'otp']), verifyRegistration);
router.post('/verify-mobile',       enforceStringParams(['email', 'otp']), verifyMobile);
router.post('/send-mobile-otp',     sendMobileOtp); // optional auth middleware checks handled in controller
router.post('/login',             enforceStringParams(['email', 'password']), loginUser);
router.post('/logout',            logoutUser);
router.post('/social',            socialLogin);          // Google + Facebook
router.post('/forgot-password',   forgotPassword);
router.post('/reset-password',    resetPassword);
router.get('/check-username',     checkUsername);
router.get('/me',       protect,  getMe);
router.put('/user/assign-role', protect, assignRole);   // SelectRole.jsx calls this

module.exports = router;