const mongoose = require('mongoose');
require('dotenv').config();

async function checkAadesh() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('../src/models/User');
    const u = await User.findOne({ email: /aadesh/i });
    if (u) {
      console.log('Found Aadesh user:');
      console.log('Name:', u.name);
      console.log('Email:', u.email);
      console.log('Role:', u.role);
      console.log('Location:', JSON.stringify(u.location));
    } else {
      console.log('No user found matching Aadesh.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkAadesh();
