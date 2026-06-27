const express = require('express');
const router = express.Router();
const { 
  sendOtp, 
  verifyOtp, 
  submitPan, 
  submitAadhaar,
  aadhaarInit, 
  aadhaarCallback, 
  submitBank, 
  submitSelfie, 
  getStatus,
  resetKyc // Keep reset for dev/testing
} = require('../controllers/kycController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(protect);

router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);
router.post('/pan/submit', upload.single('file'), submitPan);
router.post('/aadhaar/submit', upload.single('file'), submitAadhaar);
router.get('/aadhaar/init', aadhaarInit);
router.post('/aadhaar/callback', aadhaarCallback);
router.post('/bank/submit', upload.single('file'), submitBank);
router.post('/selfie/submit', upload.single('file'), submitSelfie);
router.get('/status', getStatus);
router.post('/reset', resetKyc);

module.exports = router;