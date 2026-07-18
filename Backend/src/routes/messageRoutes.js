const express = require('express');
const router  = express.Router();
const { sendMessage, getMessages, getConversations, uploadChatFile } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');
const chatUpload = require('../middlewares/chatUploadMiddleware');
const { requireKyc } = require('../middlewares/requireKyc');

router.use(protect);
router.get('/conversations',        getConversations);
// DEPRECATED (Phase A): client KYC requirement removed from messaging —
// this gate predates Phase A and was missed in that audit (which covered
// job/proposal/payment/wallet routes only). Left requireKyc unused above
// rather than removing the import, matching the deprecation pattern used
// elsewhere (jobRoutes.js, proposalRoutes.js).
// router.post('/',                 requireKyc, sendMessage);
// router.post('/upload',           requireKyc, chatUpload.single('file'), uploadChatFile);
router.post('/',                    sendMessage);
router.post('/upload',              chatUpload.single('file'), uploadChatFile);
router.get('/:jobId/:otherUserId',  getMessages);

module.exports = router;