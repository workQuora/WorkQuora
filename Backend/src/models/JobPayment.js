const mongoose = require('mongoose');

const jobPaymentSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number, // In paise
      required: true
    },
    platformCommission: {
      type: Number, // In paise
      required: true
    },
    workerPayout: {
      type: Number, // In paise (amount - commission)
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'held_in_escrow', 'pending_client_confirmation', 'disputed', 'released', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'wallet', 'cash'],
      required: true
    },
    razorpayOrderId: {
      type: String,
      default: null
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    heldAt: {
      type: Date,
      default: null
    },
    releasedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobPayment', jobPaymentSchema);
