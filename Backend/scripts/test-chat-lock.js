const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Job = require('../src/models/Job');
const Proposal = require('../src/models/Proposal');
const Message = require('../src/models/Message');

async function testChatLock() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database.');

    // 1. Get Client (Prashant Jha) & Worker (Niket Jha) tokens
    console.log('Logging in Client & Worker...');
    const clientLogin = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'prashantjha1632@gmail.com',
      password: 'password123'
    });
    const clientToken = clientLogin.data?.token || clientLogin.data?.data?.token;

    const workerLogin = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'niketjha1632@gmail.com',
      password: 'password123'
    });
    const workerToken = workerLogin.data?.token || workerLogin.data?.data?.token;

    const clientUserId = 'a2234e59-2239-4114-980d-7863114783cd';
    const workerUserId = '00dc369b-007f-4a90-9122-8178f860e4de';

    // 2. Client posts a test job
    console.log('Client posting a job...');
    const jobRes = await axios.post('http://localhost:3000/api/v1/jobs', {
      title: 'Chat Lock Testing Job',
      description: 'Testing if chat lock logic works correctly before bid acceptance.',
      budget: 1500,
      category: 'Electrician',
      location: { type: 'Point', address: 'Bhopal', coordinates: [77.4126, 23.2599] }
    }, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    const job = jobRes.data.data;
    console.log(`Job posted successfully. ID: ${job._id}`);

    // 3. Worker submits a bid
    console.log('Worker placing a bid...');
    const bidRes = await axios.post(`http://localhost:3000/api/v1/proposals/${job._id}`, {
      coverLetter: 'I can do this wiring job easily.',
      bidAmount: 1400,
      estimatedDays: 2
    }, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    const proposal = bidRes.data.data;
    console.log(`Bid placed successfully. Proposal ID: ${proposal._id}`);

    // 4. Worker tries to send a message to Client (Should fail with 403)
    console.log('Worker trying to send initial message before client accepts or initiates...');
    try {
      await axios.post('http://localhost:3000/api/v1/messages', {
        receiverId: clientUserId,
        jobId: job._id,
        text: 'Hi client, please accept my bid!'
      }, {
        headers: { Authorization: `Bearer ${workerToken}` }
      });
      console.error('ERROR: Worker successfully sent message! Chat lock did NOT work.');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('SUCCESS: Worker message was blocked with 403. Message:', err.response.data.message);
      } else {
        console.error('ERROR: Worker message failed with unexpected error:', err.message);
      }
    }

    // 5. Client sends initial message to Worker (Should succeed)
    console.log('Client sending message to worker...');
    const clientMsgRes = await axios.post('http://localhost:3000/api/v1/messages', {
      receiverId: workerUserId,
      jobId: job._id,
      text: 'Hello, can you do this by tomorrow?'
    }, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    console.log('SUCCESS: Client message sent. Status:', clientMsgRes.status);

    // 6. Worker replies to Client (Should succeed now since client initiated)
    console.log('Worker trying to reply to client...');
    const workerReplyRes = await axios.post('http://localhost:3000/api/v1/messages', {
      receiverId: clientUserId,
      jobId: job._id,
      text: 'Yes, I can finish it by tomorrow morning.'
    }, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    console.log('SUCCESS: Worker reply sent. Status:', workerReplyRes.status);

    // 7. Client accepts the proposal (initializes contract)
    console.log('Client accepting the proposal...');
    
    // First, verify client has enough funds in wallet to cover the bidAmount (1400)
    const Earnings = require('../src/models/Earnings');
    await Earnings.findOneAndUpdate(
      { userId: clientUserId },
      { $set: { walletBalance: 10000 } },
      { upsert: true }
    );
    console.log('Client wallet loaded with ₹10000.');

    const acceptRes = await axios.put(`http://localhost:3000/api/v1/proposals/${proposal._id}/accept`, {}, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    console.log('SUCCESS: Proposal accepted. Res:', acceptRes.data.message);

    // 8. Clean up test records
    console.log('Cleaning up database test records...');
    await Job.findByIdAndDelete(job._id);
    await Proposal.deleteOne({ _id: proposal._id });
    await Message.deleteMany({ job: job._id });
    const Task = require('../src/models/Task');
    await Task.deleteMany({ job: job._id });
    console.log('Cleaned up successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Test Failed:');
    if (error.response) {
      console.error(`Status code: ${error.response.status}`);
      console.error('Response body:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testChatLock();
