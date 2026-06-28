const smartMatchingService = require('../services/smartMatchingService');

// @desc    Smart Match Freelancers based on Natural Language Description & Location
// @route   POST /api/v1/jobs/smart-match
// @access  Private (Client Only)
exports.smartMatchFreelancers = async (req, res, next) => {
  try {
    const { description, coordinates, latitude, longitude, radius } = req.body; 

    // Validation
    if (!description) {
      return res.status(400).json({ success: false, message: 'Please provide a job description text' });
    }

    // Support both coordinates array [lng, lat] and separate latitude & longitude params
    let lat = latitude;
    let lng = longitude;

    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      lng = coordinates[0];
      lat = coordinates[1];
    }

    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide valid location coordinates (either coordinates [longitude, latitude] or separate latitude and longitude)' 
      });
    }

    // Construct mock job details to pass to candidate matching service
    const mockJob = {
      description,
      category: req.body.category || 'General',
      location: {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)]
      }
    };

    // Query ranked matched candidates
    const matchedFreelancers = await smartMatchingService.findAndRankCandidates(mockJob, {
      clientLatitude: Number(lat),
      clientLongitude: Number(lng),
      clientRadiusOverride: Number(radius) || null
    });

    res.status(200).json({
      success: true,
      count: matchedFreelancers.length,
      data: matchedFreelancers
    });

  } catch (error) {
    next(error);
  }
};