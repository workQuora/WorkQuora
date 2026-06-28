const mongoose = require('mongoose');
const User = require('../src/models/User');
const Job = require('../src/models/Job');
const Proposal = require('../src/models/Proposal');
const Kyc = require('../src/models/Kyc');
const BankDetails = require('../src/models/BankDetails');
const Task = require('../src/models/Task');
const Earnings = require('../src/models/Earnings');
const Transaction = require('../src/models/Transaction');
require('dotenv').config();

const clientData = [
  {
    _id: '11548d5b-7600-4ebc-a2ae-549ad87bfa84',
    name: 'Manoj Jha',
    email: 'manoj@example.com',
    username: 'manoj_jha',
    mobileNumber: '9876543210',
    password: 'password123',
    role: 'CLIENT',
    gender: 'MALE',
    isVerified: true,
    kycVerified: true,
    location: { type: 'Point', coordinates: [77.4126, 23.2599], address: 'MP Nagar, Bhopal' }
  },
  {
    _id: '122ee7f1-fe71-4ccf-8412-1c237899998a',
    name: 'Aadesh Jha',
    email: 'aadesh@example.com',
    username: 'aadesh_jha',
    mobileNumber: '9876543211',
    password: 'password123',
    role: 'CLIENT',
    gender: 'MALE',
    isVerified: true,
    kycVerified: false,
    location: { type: 'Point', coordinates: [77.4180, 23.2620], address: 'Arera Colony, Bhopal' }
  },
  {
    _id: 'aditi-id-3333-3333-333333333333',
    name: 'Aditi Rao',
    email: 'aditi@example.com',
    username: 'aditi_rao',
    mobileNumber: '9876543212',
    password: 'password123',
    role: 'CLIENT',
    gender: 'FEMALE',
    isVerified: true,
    kycVerified: false,
    location: { type: 'Point', coordinates: [77.4080, 23.2510], address: 'Indrapuri, Bhopal' }
  },
  {
    _id: 'sanjay-id-4444-4444-444444444444',
    name: 'Sanjay Gupta',
    email: 'sanjay@example.com',
    username: 'sanjay_gupta',
    mobileNumber: '9876543213',
    password: 'password123',
    role: 'CLIENT',
    gender: 'MALE',
    isVerified: true,
    kycVerified: true,
    location: { type: 'Point', coordinates: [77.4250, 23.2680], address: 'Kolar Road, Bhopal' }
  },
  {
    _id: 'rohan-id-5555-5555-555555555555',
    name: 'Rohan Dev',
    email: 'rohan@example.com',
    username: 'rohan_dev',
    mobileNumber: '9876543214',
    password: 'password123',
    role: 'CLIENT',
    gender: 'MALE',
    isVerified: true,
    kycVerified: false,
    location: { type: 'Point', coordinates: [77.4100, 23.2450], address: 'Ayodhya Bypass, Bhopal' }
  }
];

const freelancerData = [
  {
    _id: '074bf107-e7c0-435e-a7df-46edfb131837',
    name: 'Elena Rodriguez',
    email: 'elena@example.com',
    username: 'elena_design',
    mobileNumber: '9876543220',
    password: 'password123',
    role: 'FREELANCER',
    gender: 'FEMALE',
    title: 'Senior Product Designer',
    bio: 'Experienced product designer specializing in creating clean, user-centered digital experiences. Over 6 years of expertise leading design teams and establishing robust design systems for scale.',
    skills: ['UI/UX', 'Figma', 'Design Systems', 'Designers'],
    hourlyRate: 85,
    isVerified: true,
    kycVerified: true,
    location: { type: 'Point', coordinates: [77.4130, 23.2590], address: 'BHEL, Bhopal' }
  },
  {
    _id: 'marcus-id-2222-2222-222222222222',
    name: 'Marcus Chen',
    email: 'marcus@example.com',
    username: 'marcus_dev',
    mobileNumber: '9876543221',
    password: 'password123',
    role: 'FREELANCER',
    gender: 'MALE',
    title: 'Full Stack Developer',
    bio: 'Passionate full-stack developer with 5+ years of experience building secure, scalable cloud applications. Expert in React, Node.js, and Amazon Web Services (AWS) deployment pipelines.',
    skills: ['React', 'Node.js', 'AWS', 'Developers'],
    hourlyRate: 110,
    isVerified: true,
    kycVerified: true,
    location: { type: 'Point', coordinates: [77.4220, 23.2650], address: 'MP Nagar, Bhopal' }
  },
  {
    _id: 'sarah-id-3333-3333-333333333333',
    name: 'Sarah Jenkins',
    email: 'sarah@example.com',
    username: 'sarah_mkt',
    mobileNumber: '9876543222',
    password: 'password123',
    role: 'FREELANCER',
    gender: 'FEMALE',
    title: 'Growth Marketing Lead',
    bio: 'Results-driven growth marketer helping tech startups scale their user base. Proven track record in search engine optimization (SEO), performance marketing, and branding.',
    skills: ['SEO', 'Google Ads', 'Content Strategy', 'Marketing'],
    hourlyRate: 95,
    isVerified: true,
    kycVerified: false,
    location: { type: 'Point', coordinates: [77.4050, 23.2500], address: 'Arera Hills, Bhopal' }
  },
  {
    _id: 'alex-id-4444-4444-444444444444',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    username: 'alex_design',
    mobileNumber: '9876543223',
    password: 'password123',
    role: 'FREELANCER',
    gender: 'MALE',
    title: 'Mobile UI Designer',
    bio: 'Mobile designer focused on designing pixel-perfect iOS and Android applications. Expert in high-fidelity prototyping, transitions, and native gesture-based layouts.',
    skills: ['Figma', 'iOS Design', 'Prototyping', 'Designers'],
    hourlyRate: 75,
    isVerified: true,
    kycVerified: true,
    location: { type: 'Point', coordinates: [77.4110, 23.2420], address: 'Indrapuri, Bhopal' }
  },
  {
    _id: 'priya-id-5555-5555-555555555555',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    username: 'priya_dev',
    mobileNumber: '9876543224',
    password: 'password123',
    role: 'FREELANCER',
    gender: 'FEMALE',
    title: 'Frontend Engineer',
    bio: 'Specialist React Native mobile developer. Enthusiastic about creating highly responsive user interfaces, clean TypeScript codebases, and robust cross-platform applications.',
    skills: ['React Native', 'TypeScript', 'Redux', 'Developers'],
    hourlyRate: 90,
    isVerified: true,
    kycVerified: false,
    location: { type: 'Point', coordinates: [77.4350, 23.2700], address: 'Kolar Road, Bhopal' }
  }
];

const jobsData = [
  // 10 Open Jobs (Clients posting)
  {
    title: 'Urgent Plumber for Bathroom Fitting Repair',
    description: 'A bathroom tap is leaking and we need complete pipeline check and replacement of bathroom fittings.',
    category: 'plumbing',
    skillsRequired: ['Plumbing', 'Pipe Repair'],
    budget: 1200,
    status: 'open',
    clientIndex: 0, // Manoj
    location: { type: 'Point', coordinates: [77.4126, 23.2599], address: 'MP Nagar, Bhopal' }
  },
  {
    title: 'Need Certified Electrician for Living Room Rewiring',
    description: 'Living room switch board is damaged. Need safety wiring check and board replacement.',
    category: 'electrical',
    skillsRequired: ['Electrical Wiring', 'Home Repairs'],
    budget: 2500,
    status: 'open',
    clientIndex: 1, // Aadesh
    location: { type: 'Point', coordinates: [77.4180, 23.2620], address: 'Arera Colony, Bhopal' }
  },
  {
    title: 'Figma Designer for Landing Page Wireframes',
    description: 'Need a beautiful and responsive landing page design in Figma. Deliver high-fidelity prototypes.',
    category: 'design',
    skillsRequired: ['Figma', 'UI/UX Design', 'Designers'],
    budget: 8500,
    status: 'open',
    clientIndex: 2, // Aditi
    location: { type: 'Point', coordinates: [77.4080, 23.2510], address: 'Indrapuri, Bhopal' }
  },
  {
    title: 'React Native Developer for Stripe Integration',
    description: 'Integrate Stripe payment checkout SDK into our existing React Native Expo codebase.',
    category: 'development',
    skillsRequired: ['React Native', 'API Integration', 'Developers'],
    budget: 15000,
    status: 'open',
    clientIndex: 3, // Sanjay
    location: { type: 'Point', coordinates: [77.4250, 23.2680], address: 'Kolar Road, Bhopal' }
  },
  {
    title: 'SEO Audit and Technical Optimization',
    description: 'Audit our tech blog and articles, fix crawling index errors, and map high-intent keywords.',
    category: 'marketing',
    skillsRequired: ['SEO', 'Google Analytics', 'Marketing'],
    budget: 9500,
    status: 'open',
    clientIndex: 4, // Rohan
    location: { type: 'Point', coordinates: [77.4100, 23.2450], address: 'Ayodhya Bypass, Bhopal' }
  },
  {
    title: 'Custom Wooden Table & Bookshelf Carpentry',
    description: 'Construct a custom bookshelf in study room. Wood materials provided. Bring tools.',
    category: 'carpentry',
    skillsRequired: ['Carpentry', 'Woodworking'],
    budget: 6500,
    status: 'open',
    clientIndex: 0, // Manoj
    location: { type: 'Point', coordinates: [77.4126, 23.2599], address: 'MP Nagar, Bhopal' }
  },
  {
    title: 'Content Writer for Technical AI Articles',
    description: 'Write 4 SEO-friendly blog articles on generative AI, prompt engineering, and LLMs.',
    category: 'writing',
    skillsRequired: ['Content Writing', 'SEO', 'Technical Writing'],
    budget: 4000,
    status: 'open',
    clientIndex: 1, // Aadesh
    location: { type: 'Point', coordinates: [77.4180, 23.2620], address: 'Arera Colony, Bhopal' }
  },
  {
    title: 'AC Service and Gas Refill',
    description: 'Voltas split AC service and R32 gas refilling needed before summer season.',
    category: 'AC Repair',
    skillsRequired: ['AC Service', 'Gas Refill'],
    budget: 2000,
    status: 'open',
    clientIndex: 2, // Aditi
    location: { type: 'Point', coordinates: [77.4080, 23.2510], address: 'Indrapuri, Bhopal' }
  },
  {
    title: 'Professional House Painting (2 BHK)',
    description: 'Need interior wall painting for 2 BHK flat. Asian Paints Royale emulsion will be used.',
    category: 'Painter',
    skillsRequired: ['Painting', 'Wall Putty'],
    budget: 18000,
    status: 'open',
    clientIndex: 3, // Sanjay
    location: { type: 'Point', coordinates: [77.4250, 23.2680], address: 'Kolar Road, Bhopal' }
  },
  {
    title: 'Deep Cleaning of Kitchen and Bathroom',
    description: 'Kitchen chimneys, exhaust fans, and bathroom tiles need professional deep cleaning.',
    category: 'Cleaner',
    skillsRequired: ['Deep Cleaning', 'Sanitization'],
    budget: 3500,
    status: 'open',
    clientIndex: 4, // Rohan
    location: { type: 'Point', coordinates: [77.4100, 23.2450], address: 'Ayodhya Bypass, Bhopal' }
  },

  // 5 In-Progress Jobs (Gigs active)
  {
    title: 'Bento Style Admin Dashboard - React/TS',
    description: 'Build premium glassmorphism bento layout dashboard with interactive charts.',
    category: 'development',
    skillsRequired: ['React', 'TypeScript', 'Figma', 'Developers'],
    budget: 24000,
    status: 'in-progress',
    clientIndex: 0, // Manoj
    freelancerIndex: 0, // Elena
    location: { type: 'Point', coordinates: [77.4126, 23.2599], address: 'MP Nagar, Bhopal' }
  },
  {
    title: 'Mobile App Wireframes & Interactive Prototypes',
    description: 'Figma UI/UX mockups for an on-demand service marketplace app matching stitch guidelines.',
    category: 'design',
    skillsRequired: ['Figma', 'UI/UX Design', 'Designers'],
    budget: 16000,
    status: 'in-progress',
    clientIndex: 1, // Aadesh
    freelancerIndex: 1, // Marcus
    location: { type: 'Point', coordinates: [77.4180, 23.2620], address: 'Arera Colony, Bhopal' }
  },
  {
    title: 'Google Ads Setup & Campaign Optimization',
    description: 'Set up high-intent search campaigns, keyword exclusions, and landing page trackings.',
    category: 'marketing',
    skillsRequired: ['Google Ads', 'Digital Marketing', 'Marketing'],
    budget: 12000,
    status: 'in-progress',
    clientIndex: 2, // Aditi
    freelancerIndex: 2, // Sarah
    location: { type: 'Point', coordinates: [77.4080, 23.2510], address: 'Indrapuri, Bhopal' }
  },
  {
    title: 'iOS App Icon and Asset Design',
    description: 'Design app icon set, splash screen loaders, and navigation banners in Figma.',
    category: 'design',
    skillsRequired: ['Figma', 'iOS Design', 'Designers'],
    budget: 8000,
    status: 'in-progress',
    clientIndex: 3, // Sanjay
    freelancerIndex: 3, // Alex
    location: { type: 'Point', coordinates: [77.4250, 23.2680], address: 'Kolar Road, Bhopal' }
  },
  {
    title: 'Redux State Refactoring & Optimization',
    description: 'Refactor client storage slices, caching mechanisms, and reduce boilerplate actions.',
    category: 'development',
    skillsRequired: ['React Native', 'Redux', 'Developers'],
    budget: 18000,
    status: 'in-progress',
    clientIndex: 4, // Rohan
    freelancerIndex: 4, // Priya
    location: { type: 'Point', coordinates: [77.4100, 23.2450], address: 'Ayodhya Bypass, Bhopal' }
  },

  // 5 Completed Jobs (Gigs completed)
  {
    title: 'Custom Brand Guidelines & Logo Design',
    description: 'Create scalable vector brand assets, custom typography palette, and style guides.',
    category: 'design',
    skillsRequired: ['Branding', 'UI Design', 'Designers'],
    budget: 15000,
    status: 'completed',
    clientIndex: 0, // Manoj
    freelancerIndex: 3, // Alex
    location: { type: 'Point', coordinates: [77.4126, 23.2599], address: 'MP Nagar, Bhopal' }
  },
  {
    title: 'Node.js JWT Auth REST API Setup',
    description: 'Build auth controllers, token checks, salt rounds, and email verification routines.',
    category: 'development',
    skillsRequired: ['Node.js', 'Express', 'Developers'],
    budget: 35000,
    status: 'completed',
    clientIndex: 1, // Aadesh
    freelancerIndex: 1, // Marcus
    location: { type: 'Point', coordinates: [77.4180, 23.2620], address: 'Arera Colony, Bhopal' }
  },
  {
    title: 'B2B SEO Blog Launch Strategy',
    description: 'Map out 30-day blog outlines, keyword matrices, and backlink targets.',
    category: 'marketing',
    skillsRequired: ['SEO', 'Content Strategy', 'Marketing'],
    budget: 20000,
    status: 'completed',
    clientIndex: 2, // Aditi
    freelancerIndex: 2, // Sarah
    location: { type: 'Point', coordinates: [77.4080, 23.2510], address: 'Indrapuri, Bhopal' }
  },
  {
    title: 'Responsive Portfolio Website Coding',
    description: 'Convert custom Figma vector layouts into clean HTML, CSS, and vanilla JS.',
    category: 'development',
    skillsRequired: ['React', 'TypeScript', 'Developers'],
    budget: 30000,
    status: 'completed',
    clientIndex: 3, // Sanjay
    freelancerIndex: 0, // Elena
    location: { type: 'Point', coordinates: [77.4250, 23.2680], address: 'Kolar Road, Bhopal' }
  },
  {
    title: 'Custom Coffee Shop Menu Boards',
    description: 'Design clean layout panels and chalk boards for a local coffee shop brand.',
    category: 'design',
    skillsRequired: ['Illustrator', 'Branding', 'Designers'],
    budget: 5000,
    status: 'completed',
    clientIndex: 4, // Rohan
    freelancerIndex: 3, // Alex
    location: { type: 'Point', coordinates: [77.4100, 23.2450], address: 'Ayodhya Bypass, Bhopal' }
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB. Wiping database collections...');

    // Wipe all collections
    await User.deleteMany({});
    await Job.deleteMany({});
    await Proposal.deleteMany({});
    await Kyc.deleteMany({});
    await BankDetails.deleteMany({});
    await Task.deleteMany({});
    await Earnings.deleteMany({});
    await Transaction.deleteMany({});
    console.log('Cleared all collections.');

    // 1. Seed Clients
    console.log('Seeding client users...');
    const seededClients = [];
    for (const c of clientData) {
      const client = await User.create(c);
      seededClients.push(client);
    }

    // 2. Seed Freelancers
    console.log('Seeding freelancer users...');
    const seededFreelancers = [];
    for (const f of freelancerData) {
      const freelancer = await User.create(f);
      seededFreelancers.push(freelancer);
    }

    // 3. Seed KYC Records
    console.log('Seeding KYC records...');
    const allSeededUsers = [...seededClients, ...seededFreelancers];
    for (let i = 0; i < allSeededUsers.length; i++) {
      const u = allSeededUsers[i];
      const isVerified = u.kycVerified;
      await Kyc.create({
        userId: u._id,
        aadharNumber: `11112222333${i}`.substring(0, 12),
        panCard: `ABCDE1234${i}`.substring(0, 10).toUpperCase(),
        status: isVerified ? 'verified' : 'pending',
        aadhaarVerified: isVerified,
        panVerified: isVerified
      });
    }

    // 4. Seed BankDetails
    console.log('Seeding Bank Details...');
    for (let i = 0; i < allSeededUsers.length; i++) {
      const u = allSeededUsers[i];
      await BankDetails.create({
        userId: u._id,
        accountNo: `45678901234${i}`.substring(0, 12),
        ifscCode: `HDFC000123${i}`.substring(0, 11).toUpperCase(),
        bankName: i % 2 === 0 ? 'HDFC Bank' : 'State Bank of India'
      });
    }

    // 5. Seed Wallets & Earnings
    console.log('Seeding Wallets & Earnings ledger...');
    for (const u of seededClients) {
      await Earnings.create({
        userId: u._id,
        walletBalance: 150000,
        escrowBalance: 0,
        completedJobs: 0
      });
    }

    for (const u of seededFreelancers) {
      await Earnings.create({
        userId: u._id,
        walletBalance: 5000,
        escrowBalance: 0,
        allTimeIncome: 15000,
        completedJobs: 2
      });
    }

    // 6. Seed Gigs/Jobs and Proposals/Tasks/Transactions
    console.log('Seeding jobs, proposals, and tasks...');
    for (const jobItem of jobsData) {
      const clientUser = seededClients[jobItem.clientIndex];
      const jobObject = {
        title: jobItem.title,
        description: jobItem.description,
        category: jobItem.category,
        skillsRequired: jobItem.skillsRequired,
        budget: jobItem.budget,
        status: jobItem.status,
        client: clientUser._id,
        location: jobItem.location
      };

      if (jobItem.freelancerIndex !== undefined) {
        const freelancerUser = seededFreelancers[jobItem.freelancerIndex];
        jobObject.hiredFreelancer = freelancerUser._id;
        jobObject.assignedTo = freelancerUser._id;
      }

      const createdJob = await Job.create(jobObject);

      // Seed proposals for open/assigned jobs
      if (jobItem.status === 'open') {
        const fl1 = seededFreelancers[0];
        const fl2 = seededFreelancers[1];
        await Proposal.create({
          job: createdJob._id,
          freelancer: fl1._id,
          coverLetter: `I can complete "${jobItem.title}" with high quality. Please consider me!`,
          bidAmount: jobItem.budget,
          estimatedDays: 4,
          status: 'pending'
        });
        await Proposal.create({
          job: createdJob._id,
          freelancer: fl2._id,
          coverLetter: `I have great experience in ${jobItem.skillsRequired.join(', ')}. Happy to work on this.`,
          bidAmount: Math.round(jobItem.budget * 0.95),
          estimatedDays: 3,
          status: 'pending'
        });
      }

      // Seed Proposals & Tasks & Transactions for in-progress and completed jobs
      if (jobItem.status === 'in-progress' || jobItem.status === 'completed') {
        const freelancerUser = seededFreelancers[jobItem.freelancerIndex];
        
        await Proposal.create({
          job: createdJob._id,
          freelancer: freelancerUser._id,
          coverLetter: `Acceptance proposal for ${jobItem.title}`,
          bidAmount: jobItem.budget,
          estimatedDays: 5,
          status: 'accepted'
        });

        const createdTask = await Task.create({
          job: createdJob._id,
          client: clientUser._id,
          freelancer: freelancerUser._id,
          status: jobItem.status === 'in-progress' ? 'working' : 'completed',
          assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          ...(jobItem.status === 'completed' && { completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) })
        });

        if (jobItem.status === 'in-progress') {
          await Transaction.create({
            sender: clientUser._id,
            receiver: freelancerUser._id,
            job: createdJob._id,
            amount: jobItem.budget,
            type: 'escrow_deposit',
            status: 'completed'
          });

          await Earnings.findOneAndUpdate(
            { userId: clientUser._id },
            { $inc: { walletBalance: -jobItem.budget, escrowBalance: jobItem.budget } }
          );
        }

        if (jobItem.status === 'completed') {
          await Transaction.create({
            sender: clientUser._id,
            receiver: freelancerUser._id,
            job: createdJob._id,
            amount: jobItem.budget,
            type: 'escrow_release',
            status: 'completed'
          });

          await Earnings.findOneAndUpdate(
            { userId: clientUser._id },
            { $inc: { walletBalance: -jobItem.budget } }
          );
          await Earnings.findOneAndUpdate(
            { userId: freelancerUser._id },
            { $inc: { walletBalance: jobItem.budget, allTimeIncome: jobItem.budget, completedJobs: 1 } }
          );
        }
      }
    }

    console.log('\n======================================================');
    console.log('🎉 Seeding successfully completed! Seeding summary:');
    console.log('- Clients: 5');
    console.log('- Freelancers: 5');
    console.log('- KYC Records: 10 (Manoj, Elena, Marcus, Alex pre-verified)');
    console.log('- Bank Accounts: 10');
    console.log('- Total Gigs/Jobs: 20 (10 open, 5 in-progress, 5 completed)');
    console.log('======================================================\n');
    console.log('💡 DUMMY USER CREDENTIALS FOR TESTING:');
    console.log('1. Manoj Jha (CLIENT):   manoj@example.com   | password123');
    console.log('2. Aadesh Jha (CLIENT):  aadesh@example.com  | password123');
    console.log('3. Elena Rodriguez (FL): elena@example.com   | password123');
    console.log('4. Marcus Chen (FL):     marcus@example.com  | password123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
