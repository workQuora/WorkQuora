const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Kyc = require('../src/models/Kyc');
const Notification = require('../src/models/Notification');

async function testKycFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Database.');

    // 1. Create a fresh test client user
    const testEmail = `test_kyc_${Date.now()}@example.com`;
    const user = await User.create({
      name: 'Test KYC Client',
      email: testEmail,
      password: 'password123',
      role: 'CLIENT',
      mobileNumber: '9999999999',
    });
    console.log(`Created test client: ${user.name} (${user.email}) | ID: ${user._id}`);

    // 2. Perform Login to get token
    const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: testEmail,
      password: 'password123'
    });
    const token = loginRes.data?.token || loginRes.data?.data?.token;
    console.log('Logged in. Token retrieved.');

    // 3. Send Aadhaar OTP
    console.log('Sending Aadhaar OTP...');
    const randAadhar = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const aadharRes = await axios.post('http://localhost:3000/api/v1/kyc/send-otp', {
      aadharNumber: randAadhar
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Aadhaar OTP Res:', aadharRes.data);

    // Fetch the OTP from database to simulate verification
    const kycRecord = await Kyc.findOne({ userId: user._id }).select('+aadharOtp');
    const otp = kycRecord.aadharOtp;
    console.log(`Retrieved OTP from DB: ${otp}`);

    // 4. Verify Aadhaar OTP
    console.log('Verifying Aadhaar OTP...');
    const verifyAadharRes = await axios.post('http://localhost:3000/api/v1/kyc/verify-otp', {
      otp
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Verify Aadhaar Res:', verifyAadharRes.data);

    // 5. Link PAN Card (Should trigger completion & notification)
    console.log('Linking PAN Card...');
    const randPan = `ABCDE${Math.floor(1000 + Math.random() * 9000)}F`;
    const panRes = await axios.post('http://localhost:3000/api/v1/kyc/pan', {
      panCard: randPan
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('PAN Res:', panRes.data);

    // 6. Verify User model update
    const updatedUser = await User.findById(user._id);
    console.log(`Updated User isVerified: ${updatedUser.isVerified} | kycVerified: ${updatedUser.kycVerified}`);

    // 7. Verify Notification creation
    const latestNotif = await Notification.findOne({ recipient: user._id }).sort({ createdAt: -1 });
    if (latestNotif) {
      console.log('Generated Notification:', latestNotif.message);
    } else {
      console.log('ERROR: No notification found for user!');
    }

    // Clean up test records
    await User.findByIdAndDelete(user._id);
    await Kyc.deleteOne({ userId: user._id });
    await Notification.deleteMany({ recipient: user._id });
    console.log('Cleaned up test data.');

    process.exit(0);
  } catch (error) {
    console.error('KYC Flow Test Failed:');
    if (error.response) {
      console.error(`Status code: ${error.response.status}`);
      console.error('Response body:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testKycFlow();
