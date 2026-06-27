const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    category: {
      type: String,
      required: [true, 'Job category is required'],
    },
    skillsRequired: [String],
    budgetRange: {
      min: Number,
      max: Number,
    },
    budget: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed', 'cancelled'],
      default: 'open',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'held_in_escrow', 'released'],
      default: 'pending',
    },
    client: {
      type: String, // Prisma/MySQL user id (UUID)
      required: true,
    },
    hiredFreelancer: {
      type: String,
      default: null,
    },
    assignedTo: {
      type: String,
      default: null,
    },
    completionRequestedByFreelancer: {
      type: Boolean,
      default: false,
    },
    completionRequestedByClient: {
      type: Boolean,
      default: false,
    },
    cancellationRequestedByFreelancer: {
      type: Boolean,
      default: false,
    },
    cancellationRequestedByClient: {
      type: Boolean,
      default: false,
    },
    
    // 🌍 GEO-LOCATION LOGIC
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: String,
    },
    pictures: {
      type: [String],
      default: [],
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for geo-spatial queries
jobSchema.index({ location: '2dsphere' });

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;