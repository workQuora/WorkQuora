const Review = require('../models/Review');
const User = require('../models/User');

// @desc    Add a review and update average rating
// @route   POST /api/v1/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
  try {
    const { jobId, revieweeId, rating, comment } = req.body;

    // 1. Create the review
    const review = await Review.create({
      job: jobId,
      reviewer: req.user._id, // Client logged in hai
      reviewee: revieweeId,   // Freelancer jisko rating mil rahi hai
      rating,
      comment
    });

    // 2. Calculate New Average Rating
    const allReviews = await Review.find({ reviewee: revieweeId });
    
    const totalRating = allReviews.reduce((sum, item) => sum + item.rating, 0);
    const averageRating = (totalRating / allReviews.length).toFixed(1);

    // 3. Update User Profile
    await User.findByIdAndUpdate(revieweeId, { 
      averageRating: parseFloat(averageRating),
      $inc: { totalJobsCompleted: 1 } // Job done counter bhi badha diya
    });

    res.status(201).json({ 
      success: true, 
      message: 'Review submitted successfully', 
      data: review 
    });
  } catch (error) {
    // Agar duplicate review ka error (code 11000) aaye
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this job' });
    }
    next(error);
  }
};

// Turns "Prashant Jha" into "Prashant J." for public display — first name in
// full, last name reduced to an initial.
function maskReviewerName(fullName) {
  if (!fullName) return 'WorkQuora User';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

// @desc    Recent site-wide reviews for the public landing page — only for
//          jobs that reached "completed" (i.e. paid out through escrow).
// @route   GET /api/v1/reviews/public?limit=9
// @access  Public
exports.getPublicReviews = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 9, 20);

    const reviews = await Review.aggregate([
      { $lookup: { from: 'jobs', localField: 'job', foreignField: '_id', as: 'jobDoc' } },
      { $unwind: '$jobDoc' },
      { $match: { 'jobDoc.status': 'completed' } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      { $lookup: { from: 'users', localField: 'reviewer', foreignField: '_id', as: 'reviewerDoc' } },
      { $unwind: '$reviewerDoc' },
      {
        $project: {
          rating: 1,
          comment: 1,
          reviewerName: '$reviewerDoc.name',
          reviewerCity: '$reviewerDoc.location.city',
          reviewerAvatar: '$reviewerDoc.avatar',
        },
      },
    ]);

    const data = reviews.map((r) => ({
      id: String(r._id),
      name: maskReviewerName(r.reviewerName),
      location: r.reviewerCity || null,
      rating: r.rating,
      text: r.comment,
      avatarUrl: r.reviewerAvatar || null,
    }));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews of a user (Freelancer profile par dikhane ke liye)
// @route   GET /api/v1/reviews/:userId
// @access  Public
exports.getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar') // Review dene wale ka naam aur photo
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews a user has given to others
// @route   GET /api/v1/reviews/given/:userId
// @access  Private
exports.getReviewsGiven = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewer: req.params.userId })
      .populate('reviewee', 'name avatar role')
      .populate('job', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    next(error);
  }
};