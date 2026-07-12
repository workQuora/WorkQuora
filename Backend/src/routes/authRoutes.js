const express = require('express');
const router  = express.Router();
const { registerUser, resendOtp, verifyRegistration, verifyMobile, sendMobileOtp, loginUser, logoutUser, getMe, socialLogin, assignRole, forgotPassword, resetPassword, changePassword, getSessions, revokeSession, checkUsername, refreshSession, logoutAllDevices, deleteAccount, requestPasswordOtp, verifyPasswordOtp, setPassword } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const { enforceStringParams } = require('../middlewares/securityMiddleware');

router.post('/register',          enforceStringParams(['name', 'email', 'username', 'mobileNumber', 'password', 'gender', 'role']), registerUser);
router.post('/resend-otp',        enforceStringParams(['email']), resendOtp);
router.post('/verify-registration', enforceStringParams(['email', 'otp']), verifyRegistration);
router.post('/verify-mobile',       enforceStringParams(['email', 'otp']), verifyMobile);
router.post('/send-mobile-otp',     sendMobileOtp); // optional auth middleware checks handled in controller
router.post('/login',             enforceStringParams(['email', 'password']), loginUser);
router.post('/logout',            logoutUser);
router.post('/logout-all',        protect, logoutAllDevices);
router.post('/refresh',           refreshSession);
router.post('/social',            socialLogin);          // Google + Facebook
router.post('/forgot-password',   forgotPassword);
router.post('/reset-password',    resetPassword);
router.get('/check-username',     checkUsername);
router.get('/me',       protect,  getMe);
router.put('/user/assign-role', protect, assignRole);   // SelectRole.jsx calls this
router.put('/change-password',  protect, changePassword);
router.post('/request-password-otp', protect, enforceStringParams(['method']), requestPasswordOtp);
router.post('/verify-password-otp',  protect, enforceStringParams(['otp']), verifyPasswordOtp);
router.post('/set-password',         protect, enforceStringParams(['newPassword', 'confirmPassword']), setPassword);
router.get('/sessions',         protect, getSessions);
router.delete('/sessions/:id',  protect, revokeSession);
router.delete('/sessions',      protect, logoutAllDevices);
router.delete('/account',       protect, deleteAccount);

module.exports = router;