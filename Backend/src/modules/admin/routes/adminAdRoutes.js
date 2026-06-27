const express = require('express');
const router = express.Router();
const adController = require('../../../controllers/adController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const upload = require('../../../middlewares/uploadMiddleware');
const { secureFileValidator } = require('../../../middlewares/fileSecurityMiddleware');

// All ad routes protected by admin middleware
router.use(protectAdmin);

router.get('/', adController.getAllAds);

// Using single 'media' field for file uploads
router.post('/', upload.single('media'), secureFileValidator, adController.createAd);

router.put('/:id', upload.single('media'), secureFileValidator, adController.updateAd);

router.delete('/:id', adController.deleteAd);

module.exports = router;
