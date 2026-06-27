const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

async function checkAllFreelancers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const freelancers = await User.find({ role: 'FREELANCER' });
    console.log(`Found ${freelancers.length} freelancers in total:`);
    freelancers.forEach(f => {
      console.log(`- Name: ${f.name} | Email: ${f.email} | isAvailable: ${f.isAvailable} | Location:`, JSON.stringify(f.location));
    });

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

checkAllFreelancers();
