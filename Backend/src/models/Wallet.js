const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      ref: 'User',
      required: true,
      unique: true
    },
    userId: { // Adding duplicate for easier querying pattern consistency
      type: String,
      ref: 'User',
      required: true,
      unique: true
    },
    balance: {
      type: Number,
      default: 0 // In paise (0 by default now, will seed testing funds differently)
    },
    bankAccounts: [{
      bankName: String,
      accountNumber: String, // Encrypted
      ifscCode: String,
      isPrimary: { type: Boolean, default: false }
    }],
    withdrawalPin: {
      type: String,
      select: false // Only for local check if needed
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wallet', walletSchema);