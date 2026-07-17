const express = require('express');
const router = express.Router();
const { addReview, getUserReviews, getReviewsGiven, getPublicReviews } = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/given/:userId', protect, getReviewsGiven); // specific route before the param route below
router.get('/public', getPublicReviews); // specific route before the param route below
router.get('/:userId', getUserReviews); // Public route
router.post('/', protect, addReview); // Protected route

module.exports = router;