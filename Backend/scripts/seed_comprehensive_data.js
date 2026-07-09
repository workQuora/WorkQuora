const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGO_URI;
console.log('Connecting to:', mongoUri ? mongoUri.replace(/:[^@]+@/, ':***@') : 'undefined');

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to Database successfully!');

    // 1. Get user id for prashant jha
    const prashantUser = await mongoose.connection.db.collection('users').findOne({ name: /prashant/i });
    let userId;
    if (prashantUser) {
      userId = prashantUser._id;
      console.log(`Found target user: ${prashantUser.name} (${userId})`);
    } else {
      userId = '51185ebc-2673-4089-91c1-c0275bc4085f';
      console.log(`User "prashant" not found, default to ID: ${userId}`);
    }

    // 2. Clear and Seed Wallet
    await mongoose.connection.db.collection('wallets').deleteOne({ userId });
    await mongoose.connection.db.collection('wallets').insertOne({
      _id: crypto.randomUUID(),
      user: userId,
      userId: userId,
      balance: 4850000, // ₹48,500 in paise
      bankAccounts: [{
        bankName: 'State Bank of India',
        accountNumber: '******5432',
        ifscCode: 'SBIN0001234',
        isPrimary: true
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Seeded Wallet balance of ₹48,500 (in paise) successfully!');

    // 3. Clear and Seed Wallet Transactions
    await mongoose.connection.db.collection('wallettransactions').deleteMany({ userId });
    const demoTransactions = [
      {
        _id: crypto.randomUUID(),
        userId,
        type: 'credit',
        source: 'job_payment',
        amount: 2200000, // ₹22,000
        status: 'completed',
        description: 'Payout from Fintech App Milestones',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        _id: crypto.randomUUID(),
        userId,
        type: 'credit',
        source: 'job_payment',
        amount: 650000, // ₹6,500
        status: 'completed',
        description: 'Payout from Logo Design Project',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        _id: crypto.randomUUID(),
        userId,
        type: 'credit',
        source: 'add_money',
        amount: 2000000, // ₹20,000
        status: 'completed',
        description: 'Added funds via Razorpay',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await mongoose.connection.db.collection('wallettransactions').insertMany(demoTransactions);
    console.log('Seeded 3 Wallet transactions successfully!');

    // 4. Seed 10 distinct Jobs
    // Delete existing jobs to avoid duplication
    await mongoose.connection.db.collection('jobs').deleteMany({});

    const jobs = [
      {
        _id: crypto.randomUUID(),
        title: 'Enterprise Node.js Backend API Development',
        description: 'Develop a highly scalable RESTful API with Express, Mongoose, Redis caching, and full unit test coverage.',
        category: 'Development',
        skillsRequired: ['Node.js', 'MongoDB', 'Redis'],
        budgetRange: { min: 85000, max: 120000 },
        budget: 85000,
        status: 'open',
        paymentStatus: 'pending',
        client: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: crypto.randomUUID(),
        title: 'High-Converting SaaS Copywriter',
        description: 'Write engaging copy for our landing pages, sales sequences, and promotional newsletters targeting SaaS developers.',
        category: 'Writing',
        skillsRequired: ['Copywriting', 'SaaS', 'SEO'],
        budgetRange: { min: 12500, max: 18000 },
        budget: 12500,
        status: 'open',
        paymentStatus: 'pending',
        client: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: crypto.randomUUID(),
        title: 'UI/UX Redesign for WorkQuora Platform',
        description: 'Overhaul our existing dashboard mockup into a production-ready, interactive dark/light theme interface design.',
        category: 'Design',
        skillsRequired: ['Figma', 'UI/UX Design'],
        budgetRange: { min: 120000, max: 150000 },
        budget: 120000,
        status: 'open',
        paymentStatus: 'pending',
        client: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: crypto.randomUUID(),
        title: 'React Native Mobile App Development',
        description: 'Build a cross-platform mobile app using React Native. Integrate push notifications and real-time chat APIs.',
        category: 'Development',
        skillsRequired: ['React Native', 'iOS', 'Android'],
        budgetRange: { min: 75000, max: 95000 },
        budget: 75000,
        status: 'open',
        paymentStatus: 'pending',
        client: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: crypto.randomUUID(),
        title: 'SEO Content Writer for SaaS Blog',
        description: 'Write 5 high-quality, research-driven blog posts targeting developers and DevOps engineers on Kubernetes benefits.',
        category: 'Writing',
        skillsRequired: ['SEO', 'Copywriting'],
        budgetRange: { min: 3500, max: 5000 },
        budget: 3500,
        status: 'open',
        paymentStatus: 'pending',
        client: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: crypto.randomUUID(),
        title: 'Social Media Marketing Manager',
        description: 'Manage Instagram & Facebook ads campaigns. Curate weekly engaging post designs and optimize conversion rates.',
        category: 'Marketing',
        skillsRequired: ['Instagram', 'Ads'],
        budgetRange: { min: 8500, max: 12000 },
        budget: 8500,
        status: 'open',
        paymentStatus: 'pending',
        client: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: crypto.randomUUID(),
        title: 'Emergency Plumbing and Drain Cleaning',
        description: 'Leakage repair in the main supply pipeline. Clear root blockage in commercial sewer line.',
        category: 'Plumbing',
        skillsRequired: ['Plumbing', 'Repair'],
        budgetRange: { min: 1800, max: 2500 },
        budget: 1800,
        status: 'open',
        paymentStatus: 'pending',
        client: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: crypto.randomUUID(),
        title: 'Commercial Electrical Wiring Repair',
        description: 'Diagnose and repair warehouse lighting circuits and safety breaker panels. Ensure building compliance.',
        category: 'Electrical',
        skillsRequired: ['Wiring', 'Safety'],
        budgetRange: { min: 5500, max: 7000 },
        budget: 5500,
        status: 'open',
        paymentStatus: 'pending',
        client: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: crypto.randomUUID(),
        title: 'Graphic Designer for Logo & Branding',
        description: 'Develop full identity packages for a new organic coffee chain. Provide logo variations, vector assets, and typography guidelines.',
        category: 'Design',
        skillsRequired: ['Illustrator', 'Branding'],
        budgetRange: { min: 5000, max: 8000 },
        budget: 5000,
        status: 'open',
        paymentStatus: 'pending',
        client: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: crypto.randomUUID(),
        title: 'Python Web Scraper & Automation Script',
        description: 'Build robust Python scripts to extract catalog pricing data daily from target ecommerce portals and upload to Google Sheets.',
        category: 'Development',
        skillsRequired: ['Python', 'Scraping'],
        budgetRange: { min: 4000, max: 5500 },
        budget: 4000,
        status: 'open',
        paymentStatus: 'pending',
        client: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await mongoose.connection.db.collection('jobs').insertMany(jobs);
    console.log('Seeded 10 distinct Jobs successfully!');

    // 5. Seed 3 Active Ads
    await mongoose.connection.db.collection('ads').deleteMany({});
    const now = new Date();
    const ads = [
      {
        _id: crypto.randomUUID(),
        title: 'AWS Cloud Migration Workshop',
        brandName: 'Amazon Web Services',
        description: 'Migrate your legacy servers to AWS cloud with zero downtime. Get $300 free credits to start your cloud journey today.',
        targetLink: 'https://aws.amazon.com',
        mediaType: 'IMAGE',
        mediaUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
        mediaPublicId: 'ad1',
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        platform: 'BOTH',
        dailyFrequency: 5,
        durationSeconds: 5,
        impressions: 0,
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: crypto.randomUUID(),
        title: 'Deploy Instantly to Vercel Serverless',
        brandName: 'Vercel Cloud',
        description: 'Automated CI/CD for frontend applications. Push to Git and get custom production deployments live in seconds.',
        targetLink: 'https://vercel.com',
        mediaType: 'IMAGE',
        mediaUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
        mediaPublicId: 'ad2',
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        platform: 'BOTH',
        dailyFrequency: 5,
        durationSeconds: 5,
        impressions: 0,
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: crypto.randomUUID(),
        title: '50% Off Premium Figma UI Templates',
        brandName: 'FigmaTemplates',
        description: 'Kickstart your next dashboard project with hundreds of high-quality components and typography systems.',
        targetLink: 'https://figma.com',
        mediaType: 'IMAGE',
        mediaUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=600&q=80',
        mediaPublicId: 'ad3',
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        platform: 'BOTH',
        dailyFrequency: 5,
        durationSeconds: 5,
        impressions: 0,
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await mongoose.connection.db.collection('ads').insertMany(ads);
    console.log('Seeded 3 active advertisement campaigns successfully!');

    await mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Comprehensive seeding failed:', err);
    process.exit(1);
  });
