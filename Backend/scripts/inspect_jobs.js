const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGO_URI;
console.log('Connecting to:', mongoUri ? mongoUri.replace(/:[^@]+@/, ':***@') : 'undefined');

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to Database successfully!');

    // Fetch jobs
    const jobs = await mongoose.connection.db.collection('jobs').find({}).toArray();
    console.log(`\n--- JOBS IN DATABASE (Total: ${jobs.length}) ---`);
    jobs.slice(0, 5).forEach((j) => {
      console.log(`- ID: ${j._id}, Title: "${j.title}", Status: "${j.status}", Category: "${j.category}", Budget: ${JSON.stringify(j.budgetRange)}`);
    });

    // Fetch ads
    const ads = await mongoose.connection.db.collection('ads').find({}).toArray();
    console.log(`\n--- ADS IN DATABASE (Total: ${ads.length}) ---`);
    ads.slice(0, 5).forEach((ad) => {
      console.log(`- ID: ${ad._id}, Title: "${ad.title}", Active: ${ad.isActive}, DailyLimit: ${ad.dailyFrequency}, Target: "${ad.targetLink}"`);
    });

    await mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Connection failed:', err);
    process.exit(1);
  });
