const mongoose = require('mongoose');
require('dotenv').config();

async function findUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('../src/models/User');
    const u = await User.findById('D69c413d-c6ed-4d1f-84d4-a946b15a611f');
    if (u) {
      console.log('Found User on Atlas:', u.name, u.email);
    } else {
      console.log('User NOT found on Atlas by ID.');
    }
    
    const count = await User.countDocuments();
    console.log('Total Atlas users count:', count);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

findUser();
