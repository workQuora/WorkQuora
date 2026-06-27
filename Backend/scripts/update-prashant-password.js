const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');

async function updatePassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const user = await User.findOne({ email: 'prashantjha1632@gmail.com' });
    if (!user) {
      console.log('User Prashant Jha not found!');
      process.exit(1);
    }

    user.password = 'password123';
    await user.save();

    console.log('Successfully updated Prashant Jha password to password123.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to update password:', error);
    process.exit(1);
  }
}

updatePassword();
