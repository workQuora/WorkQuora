const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const User = require('../src/models/User');
const Kyc = require('../src/models/Kyc');

async function verifyAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.');

    const users = await User.find();
    console.log(`Processing ${users.length} users...`);

    let verifiedCount = 0;
    for (const user of users) {
      // Ensure user has mobile number
      if (!user.mobileNumber || user.mobileNumber.trim().length === 0) {
        user.mobileNumber = '9669668224';
        await user.save();
        console.log(`Updated mobile number for user: ${user.name}`);
      }

      // Check if kyc exists
      let kyc = await Kyc.findOne({ userId: user._id });
      if (!kyc) {
        // Generate unique dummy aadhar and pan numbers based on UUID suffix
        const suffix = crypto.randomBytes(3).toString('hex'); // 6 chars
        const aadhar = `11112222${suffix.slice(0, 4)}`;
        const pan = `ABCDE${suffix.toUpperCase()}F`.slice(0, 10);
        
        kyc = await Kyc.create({
          userId: user._id,
          aadharNumber: aadhar,
          panCard: pan,
          status: 'verified',
          aadhaarVerified: true,
          panVerified: true,
        });
        console.log(`Created verified KYC record for: ${user.name} (Aadhar: ${aadhar}, PAN: ${pan})`);
        verifiedCount++;
      } else if (!kyc.aadhaarVerified || !kyc.panVerified || kyc.status !== 'verified') {
        kyc.status = 'verified';
        kyc.aadhaarVerified = true;
        kyc.panVerified = true;
        await kyc.save();
        console.log(`Updated KYC record to verified for: ${user.name}`);
        verifiedCount++;
      }
    }

    console.log(`\nVerification complete. Verified/Created ${verifiedCount} records.`);
    process.exit(0);
  } catch (error) {
    console.error('Verification script failed:', error);
    process.exit(1);
  }
}

verifyAll();
