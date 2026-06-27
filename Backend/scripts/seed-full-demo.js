const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const Task = require('../src/models/Task');
const Earnings = require('../src/models/Earnings');
const User = require('../src/models/User');
const Proposal = require('../src/models/Proposal');
require('dotenv').config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for demo seeding...');

    // Clear existing tasks, proposals, and earnings to start fresh
    await Task.deleteMany({});
    await Proposal.deleteMany({});
    await Earnings.deleteMany({});
    console.log('Cleared existing Tasks, Proposals, and Earnings.');

    // 1. Fetch our key Client & Freelancer users from the DB
    const clientManoj = await User.findById('11548d5b-7600-4ebc-a2ae-549ad87bfa84');
    const clientPrashant = await User.findById('5c94bd96-fad7-4214-9b0f-9102d2003086');
    const freelancerPrashant = await User.findById('074bf107-e7c0-435e-a7df-46edfb131837');
    const freelancerSweta = await User.findById('2631db97-3fe4-44ab-b358-adcc1445b086');

    if (!clientManoj || !clientPrashant || !freelancerPrashant || !freelancerSweta) {
      console.error('Missing required demo users in database. Please register them first.');
      process.exit(1);
    }

    // 2. Create Active and Completed Jobs for clientManoj (Manoj Jha)
    // Clear custom jobs for clientManoj first
    await Job.deleteMany({ client: { $in: [clientManoj._id, clientPrashant._id] }, status: { $ne: 'open' } });

    console.log('Seeding jobs, tasks, and proposals...');

    // Manoj's active job
    const jobManojActive = await Job.create({
      title: 'Frontend Development - React Specialist',
      description: 'Need an expert React developer to lead frontend and build bento style dashboards.',
      category: 'development',
      skillsRequired: ['React', 'Figma', 'TypeScript'],
      budget: 18500,
      client: clientManoj._id,
      assignedTo: freelancerPrashant._id,
      status: 'in-progress',
      location: { type: 'Point', coordinates: [77.4126, 23.2599], address: 'New Delhi' }
    });

    // Manoj's completed job
    const jobManojCompleted = await Job.create({
      title: 'Brand Identity Redesign',
      description: 'Redesign brand logo, vectors, guidelines, and styling theme.',
      category: 'design',
      skillsRequired: ['Branding', 'UI Design', 'Illustrator'],
      budget: 142800,
      client: clientManoj._id,
      assignedTo: freelancerPrashant._id,
      hiredFreelancer: freelancerPrashant._id,
      status: 'completed',
      location: { type: 'Point', coordinates: [77.4126, 23.2599], address: 'New Delhi' }
    });

    // Prashant's active job
    const jobPrashantActive = await Job.create({
      title: 'React Native Developer Needed for iOS/Android App',
      description: 'Build a mobile app matching Google Stitch design mocks pixel-for-pixel.',
      category: 'development',
      skillsRequired: ['React Native', 'Expo', 'TypeScript'],
      budget: 45000,
      client: clientPrashant._id,
      assignedTo: freelancerSweta._id,
      status: 'in-progress',
      location: { type: 'Point', coordinates: [77.4126, 23.2599], address: 'Bhopal' }
    });

    // Prashant's completed job
    const jobPrashantCompleted = await Job.create({
      title: 'Modern UI/UX Designer for Web & Mobile App Design',
      description: 'Create high-fidelity wireframes and Figma prototypes.',
      category: 'design',
      skillsRequired: ['Figma', 'UI Design', 'Wireframing'],
      budget: 30000,
      client: clientPrashant._id,
      assignedTo: freelancerSweta._id,
      hiredFreelancer: freelancerSweta._id,
      status: 'completed',
      location: { type: 'Point', coordinates: [77.4126, 23.2599], address: 'Bhopal' }
    });

    // 3. Seed corresponding Task records (Contracts)
    // Manoj's active task
    await Task.create({
      job: jobManojActive._id,
      client: clientManoj._id,
      freelancer: freelancerPrashant._id,
      status: 'working',
      assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });

    // Manoj's completed task
    await Task.create({
      job: jobManojCompleted._id,
      client: clientManoj._id,
      freelancer: freelancerPrashant._id,
      status: 'completed',
      assignedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    });

    // Prashant's active task
    await Task.create({
      job: jobPrashantActive._id,
      client: clientPrashant._id,
      freelancer: freelancerSweta._id,
      status: 'working',
      assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    // Prashant's completed task
    await Task.create({
      job: jobPrashantCompleted._id,
      client: clientPrashant._id,
      freelancer: freelancerSweta._id,
      status: 'completed',
      assignedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    });

    // 4. Seed Proposals for open jobs to show "Pending Proposals"
    // Fetch some open jobs
    const openJobs = await Job.find({ status: 'open' });
    for (const job of openJobs) {
      // Create proposal from freelancerPrashant
      await Proposal.create({
        job: job._id,
        freelancer: freelancerPrashant._id,
        bidAmount: job.budget || 5000,
        estimatedDays: 3,
        coverLetter: 'I am highly experienced in this field and can deliver perfect results.',
        status: 'pending'
      });
      // Create proposal from freelancerSweta
      await Proposal.create({
        job: job._id,
        freelancer: freelancerSweta._id,
        bidAmount: (job.budget || 5000) * 0.9,
        estimatedDays: 4,
        coverLetter: 'I can start working on this project immediately. Let us chat.',
        status: 'pending'
      });
    }

    // 5. Seed Earnings records
    // clientManoj has 18500 in Escrow for the active task
    await Earnings.create({
      userId: clientManoj._id,
      walletBalance: 0,
      escrowBalance: 18500,
      completedJobs: 0
    });

    // clientPrashant has 45000 in Escrow for the active task
    await Earnings.create({
      userId: clientPrashant._id,
      walletBalance: 0,
      escrowBalance: 45000,
      completedJobs: 0
    });

    // freelancerPrashant (Alex) earned 142800 from the completed redesign task
    await Earnings.create({
      userId: freelancerPrashant._id,
      walletBalance: 142800,
      escrowBalance: 0,
      allTimeIncome: 142800,
      completedJobs: 1
    });

    // freelancerSweta earned 30000 from the completed design task
    await Earnings.create({
      userId: freelancerSweta._id,
      walletBalance: 30000,
      escrowBalance: 0,
      allTimeIncome: 30000,
      completedJobs: 1
    });

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
