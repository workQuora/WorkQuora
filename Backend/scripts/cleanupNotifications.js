// Runs the notification retention cleanup (7-day-old notifications, oldest
// 40% of that subset deleted) once and exits. Invoke manually or wire up as
// a Render Cron Job: `node scripts/cleanupNotifications.js`.
require('dotenv').config();
const mongoose = require('mongoose');
const { cleanupOldNotifications } = require('../src/utils/notificationCleanup');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'workquora' });
    const result = await cleanupOldNotifications();
    console.log(`Notification cleanup done: ${result.totalDeleted} deleted across ${result.recipientsProcessed} users.`);
    process.exit(0);
  } catch (err) {
    console.error('Notification cleanup failed:', err.message);
    process.exit(1);
  }
})();
