const Notification = require('../models/Notification');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Retention cleanup: among each user's notifications older than 7 days,
// delete the oldest 40% of that subset (not 40% of everything they have).
// Separate from the 99-per-user FIFO cap in utils/notification.js, which
// runs on every create instead of on a schedule.
const cleanupOldNotifications = async () => {
  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
  const recipients = await Notification.distinct('recipient', { createdAt: { $lt: cutoff } });

  let totalDeleted = 0;
  for (const recipient of recipients) {
    const oldOnes = await Notification.find({ recipient, createdAt: { $lt: cutoff } })
      .sort({ createdAt: 1 })
      .select('_id');
    const deleteCount = Math.floor(oldOnes.length * 0.4);
    if (deleteCount <= 0) continue;

    const idsToDelete = oldOnes.slice(0, deleteCount).map((n) => n._id);
    await Notification.deleteMany({ _id: { $in: idsToDelete } });
    totalDeleted += idsToDelete.length;
  }

  return { recipientsProcessed: recipients.length, totalDeleted };
};

module.exports = { cleanupOldNotifications };
