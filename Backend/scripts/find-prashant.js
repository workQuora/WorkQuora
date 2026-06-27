const mongoose = require('mongoose');
require('dotenv').config();

async function searchPrashant() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('../src/models/User');
    const u = await User.findOne({ name: /Prashant/i });
    if (u) {
      console.log('Found Prashant on Atlas:', u.name, u.email, u._id);
    } else {
      console.log('No user named Prashant found on Atlas.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

searchPrashant();
