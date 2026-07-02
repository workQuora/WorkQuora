const Ad = require('../models/Ad');
const storageService = require('../services/storageService');

// @desc    Get an active ad for the client
// @route   GET /api/v1/ads/active
// @access  Public (or protected if user tracking needed)
exports.getActiveAd = async (req, res, next) => {
  try {
    const { platform = 'WEB' } = req.query;
    
    // Find active ads for this platform where endDate > now
    const now = new Date();
    const activeAds = await Ad.find({
      status: 'ACTIVE',
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [{ platform: 'BOTH' }, { platform }]
    });

    if (activeAds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    res.status(200).json({ success: true, data: activeAds });
  } catch (error) {
    next(error);
  }
};

// @desc    Track ad metrics (impressions, clicks, watchTime)
// @route   POST /api/v1/ads/track
// @access  Public
exports.trackAdMetrics = async (req, res, next) => {
  try {
    const { adId, event, watchTimeSeconds } = req.body;
    
    if (!adId || !event) {
      return res.status(400).json({ success: false, message: 'adId and event are required' });
    }

    const update = {};
    if (event === 'impression') {
      update.$inc = { impressions: 1 };
    } else if (event === 'click') {
      update.$inc = { clicks: 1 };
    } else if (event === 'watch' && watchTimeSeconds) {
      update.$inc = { totalWatchTimeSeconds: watchTimeSeconds };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid event type' });
    }

    await Ad.findByIdAndUpdate(adId, update);
    res.status(200).json({ success: true, message: 'Metrics updated' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN ROUTES
// ==========================================

// @desc    Create a new Ad
// @route   POST /api/v1/admin/ads
// @access  Private (Admin)
exports.createAd = async (req, res, next) => {
  try {
    const { 
      title, brandName, description, targetLink, 
      mediaType, startDate, endDate, status, 
      platform, dailyFrequency, durationSeconds 
    } = req.body;

    if (!brandName || /[^a-zA-Z0-9\s\-_]/.test(brandName)) {
      return res.status(400).json({ success: false, message: 'Invalid brand name characters' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Ad media (image/video) is required' });
    }

    // Upload media using storageService
    const mediaData = await storageService.uploadFile(req.file.buffer, `ads/${brandName.replace(/\s+/g, '_')}`, {
      resource_type: mediaType === 'VIDEO' ? 'video' : 'image',
    });

    const ad = await Ad.create({
      title,
      brandName,
      description,
      targetLink,
      mediaType,
      mediaUrl: mediaData.secureUrl,
      mediaPublicId: mediaData.publicId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status || 'ACTIVE',
      platform: platform || 'BOTH',
      dailyFrequency: Number(dailyFrequency) || 3,
      durationSeconds: Number(durationSeconds) || 5
    });

    res.status(201).json({ success: true, data: ad });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all ads (Admin)
// @route   GET /api/v1/admin/ads
// @access  Private (Admin)
exports.getAllAds = async (req, res, next) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: ads });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an Ad
// @route   PUT /api/v1/admin/ads/:id
// @access  Private (Admin)
exports.updateAd = async (req, res, next) => {
  try {
    const adId = req.params.id;
    const updateData = { ...req.body };

    const ad = await Ad.findById(adId);
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

    if (req.body.brandName && /[^a-zA-Z0-9\s\-_]/.test(req.body.brandName)) {
      return res.status(400).json({ success: false, message: 'Invalid brand name characters' });
    }

    // Handle new media upload if provided
    if (req.file) {
      // Delete old media
      if (ad.mediaPublicId) {
        await storageService.deleteFile(ad.mediaPublicId).catch(console.error);
      }
      
      const mediaData = await storageService.uploadFile(req.file.buffer, `ads/${ad.brandName.replace(/\s+/g, '_')}`, {
        resource_type: updateData.mediaType === 'VIDEO' ? 'video' : 'image',
      });
      updateData.mediaUrl = mediaData.secureUrl;
      updateData.mediaPublicId = mediaData.publicId;
    }

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const updatedAd = await Ad.findByIdAndUpdate(adId, updateData, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: updatedAd });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an Ad
// @route   DELETE /api/v1/admin/ads/:id
// @access  Private (Admin)
exports.deleteAd = async (req, res, next) => {
  try {
    const adId = req.params.id;
    const ad = await Ad.findById(adId);
    
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

    // Delete media from Cloudinary
    if (ad.mediaPublicId) {
      await storageService.deleteFile(ad.mediaPublicId).catch(console.error);
    }

    await ad.deleteOne();
    res.status(200).json({ success: true, message: 'Ad deleted successfully' });
  } catch (error) {
    next(error);
  }
};
