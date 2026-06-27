const mongoose = require('mongoose');
require('dotenv').config();

const Notification = require('../src/models/Notification');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const latest = await Notification.findOne().sort({ createdAt: -1 });
    if (latest) {
      console.log('Latest Notification:');
      console.log(JSON.stringify(latest, null, 2));
    } else {
      console.log('No notifications found.');
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
