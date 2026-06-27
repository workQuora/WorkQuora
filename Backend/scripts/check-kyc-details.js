const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const User = require('../src/models/User');
const Kyc = require('../src/models/Kyc');
const Job = require('../src/models/Job');
const Proposal = require('../src/models/Proposal');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.');

    const freelancers = await User.find({ role: 'FREELANCER' });
    console.log(`\nFound ${freelancers.length} freelancers:`);

    for (const f of freelancers) {
      console.log(`\n========================================`);
      console.log(`FREELANCER: ${f.name} (${f.email})`);
      console.log(`ID: ${f._id}`);
      console.log(`Mobile Number: "${f.mobileNumber}"`);

      const kyc = await Kyc.findOne({ userId: f._id });
      if (kyc) {
        console.log(`KYC Record found:`);
        console.log(`- aadharVerified: ${kyc.aadharVerified}`);
        console.log(`- panVerified: ${kyc.panVerified}`);
        console.log(`- full document:`, JSON.stringify(kyc, null, 2));
      } else {
        console.log(`KYC Record NOT found!`);
      }

      // Check active jobs
      const activeJobs = await Job.find({ assignedTo: f._id, status: 'in-progress' });
      console.log(`Active Jobs: ${activeJobs.length}`);
      activeJobs.forEach(job => {
        console.log(`- Job: "${job.title}" (ID: ${job._id})`);
      });

      // Check proposals
      const proposals = await Proposal.find({ freelancer: f._id });
      console.log(`Proposals submitted: ${proposals.length}`);
      proposals.forEach(prop => {
        console.log(`- Job ID: ${prop.job} | Bid: ${prop.bidAmount} | Status: ${prop.status}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Inspection failed:', error);
    process.exit(1);
  }
}

inspect();
