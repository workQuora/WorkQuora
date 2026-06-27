const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Kyc = require('../src/models/Kyc');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find();
    console.log(`Checking ${users.length} users:`);
    for (const u of users) {
      const kyc = await Kyc.findOne({ userId: u._id });
      const kycOk = kyc && kyc.aadharVerified && kyc.panVerified && kyc.status === 'verified';
      const mobOk = u.mobileNumber && u.mobileNumber.trim().length > 0;
      console.log(`- User: ${u.name} (${u.email}) [Role: ${u.role}] | Mobile: "${u.mobileNumber}" | KYC Verified: ${kycOk} (Aadhar: ${kyc?.aadharVerified}, PAN: ${kyc?.panVerified}, Status: ${kyc?.status})`);
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
