const redisClient = require('../config/redis');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Helper to create a notification, save to MongoDB, and broadcast via Socket.io
 */
const createNotification = async ({ recipient, sender, type, message, relatedId, onModel, io }) => {
  try {
    if (!recipient) return null;

    // 1. Deduplication Protection (Engineering Bible Vol 11 & 14)
    if (relatedId) {
      const dedupKey = `notif:dedup:${recipient}:${relatedId}`;
      if (redisClient.isOpen) {
        const isDuplicate = await redisClient.get(dedupKey).catch(() => null);
        if (isDuplicate) {
          console.log(`⚠️ Duplicate notification prevented (Redis cache hit) for recipient: ${recipient}, Job/Task: ${relatedId}`);
          return null;
        }
        // Set deduplication lock for 24 hours
        await redisClient.setEx(dedupKey, 3600 * 24, '1').catch(() => {});
      } else {
        // Resilient Database Fallback if Redis cache is offline
        const existing = await Notification.findOne({ recipient, relatedId, type });
        if (existing) {
          console.log(`⚠️ Duplicate notification prevented (MongoDB fallback hit) for recipient: ${recipient}, Job/Task: ${relatedId}`);
          return null;
        }
      }
    }

    // Save notification to Database
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      message,
      relatedId,
      onModel,
    });

    // Retention cap — max 99 per user, FIFO. Runs best-effort; a failure
    // here must never break the notification that was just created.
    Notification.countDocuments({ recipient })
      .then(async (count) => {
        const excess = count - 99;
        if (excess <= 0) return;
        const oldest = await Notification.find({ recipient }).sort({ createdAt: 1 }).limit(excess).select('_id');
        await Notification.deleteMany({ _id: { $in: oldest.map((n) => n._id) } });
      })
      .catch((err) => console.error('Notification retention cap error:', err.message));

    const notificationData = notification.toObject();

    // Populate sender details if available
    if (sender) {
      const senderUser = await User.findById(sender).select('name profilePic avatar').lean();
      if (senderUser) {
        notificationData.senderInfo = {
          name: senderUser.name,
          profilePic: senderUser.profilePic || senderUser.avatar,
        };
      }
    }

    // Broadcast in real-time if io instance is provided
    if (io) {
      io.to(recipient).emit('receive_notification', notificationData);
      console.log(`🔔 Socket notification sent to user ${recipient}`);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
};

module.exports = { createNotification };
