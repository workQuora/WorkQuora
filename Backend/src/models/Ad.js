const mongoose = require('mongoose');
const crypto = require('crypto');

const adSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => crypto.randomUUID(),
    },
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    brandName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      default: '' 
    },
    targetLink: { 
      type: String, 
      required: true 
    },
    
    // Media details
    mediaType: { 
      type: String, 
      enum: ['IMAGE', 'VIDEO'], 
      required: true 
    },
    mediaUrl: { 
      type: String, 
      required: true 
    },
    mediaPublicId: { 
      type: String, 
      required: true 
    },
    
    // Campaign Rules
    startDate: { 
      type: Date, 
      required: true 
    },
    endDate: { 
      type: Date, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'PAUSED', 'COMPLETED'], 
      default: 'ACTIVE' 
    },
    platform: { 
      type: String, 
      enum: ['WEB', 'MOBILE', 'BOTH'], 
      default: 'BOTH' 
    },
    
    // Delivery Configuration
    dailyFrequency: { 
      type: Number, 
      default: 3 // Max times shown to a single user in 24 hours
    },
    durationSeconds: { 
      type: Number, 
      default: 5 // How long the ad must be watched/stay on screen
    },
    
    // Analytics Metrics
    impressions: { 
      type: Number, 
      default: 0 
    },
    clicks: { 
      type: Number, 
      default: 0 
    },
    totalWatchTimeSeconds: { 
      type: Number, 
      default: 0 
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for compatibility with id
adSchema.virtual('id').get(function () {
  return this._id;
});

const Ad = mongoose.model('Ad', adSchema);
module.exports = Ad;
