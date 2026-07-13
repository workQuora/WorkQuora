const mongoose = require('mongoose');
const crypto = require('crypto');

// Admin-only history/audit trail of account changes — never exposed to the
// user it's about. Distinct from AuditLog (action-label log, no value diffs)
// and AdminAuditLog (admin-on-user actions only) — this one captures a
// user's own self-service edits with the actual before/after values, for
// company evidence/dispute resolution.
const recordSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => crypto.randomUUID(),
    },
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      enum: ['EMAIL_CHANGE', 'MOBILE_CHANGE', 'USERNAME_CHANGE', 'PROFILE_UPDATE', 'JOB_POSTED'],
      required: true,
    },
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String, default: 'Unknown' },
    device: { type: String, default: 'Unknown' },
  },
  { timestamps: false }
);

recordSchema.index({ userId: 1, action: 1, timestamp: -1 });

module.exports = mongoose.model('Record', recordSchema);
