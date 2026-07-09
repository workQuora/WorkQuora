const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGO_URI;
console.log('Connecting to:', mongoUri ? mongoUri.replace(/:[^@]+@/, ':***@') : 'undefined');

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to Database successfully!');

    // 1. Get or create a Client User
    let clientUser = await mongoose.connection.db.collection('users').findOne({ role: 'CLIENT' });
    if (!clientUser) {
      clientUser = await mongoose.connection.db.collection('users').findOne({});
    }

    let clientId;
    if (clientUser) {
      clientId = clientUser._id;
      console.log(`Found existing user to be the client owner: ${clientUser.name} (${clientId})`);
    } else {
      clientId = crypto.randomUUID();
      console.log(`Creating mock client ID: ${clientId}`);
      await mongoose.connection.db.collection('users').insertOne({
        _id: clientId,
        name: 'Demo Client User',
        email: 'client.demo@workquora.com',
        password: 'Password@123',
        role: 'CLIENT',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 2. Clear old demo jobs to avoid duplicates and write fresh ones
    await mongoose.connection.db.collection('jobs').deleteMany({
      title: { $in: ['Senior UX Lead for Fintech App', 'Next.js Dashboard Specialist', 'Brand Strategy for AI Startup'] }
    });

    const demoJobs = [
      {
        _id: crypto.randomUUID(),
        title: 'Senior UX Lead for Fintech App',
        description: 'Looking for an expert designer to overhaul our core mobile banking experience. Deliver high-fidelity prototypes.',
        category: 'Design',
        skillsRequired: ['Figma', 'Fintech'],
        budgetRange: { min: 12000, max: 15000 },
        budget: 12000,
        status: 'open',
        paymentStatus: 'pending',
        client: clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: crypto.randomUUID(),
        title: 'Next.js Dashboard Specialist',
        description: 'Need a frontend specialist to build a high-performance analytics dashboard using Next.js and TailwindCSS.',
        category: 'Development',
        skillsRequired: ['Next.js', 'React'],
        budgetRange: { min: 4500, max: 6000 },
        budget: 4500,
        status: 'open',
        paymentStatus: 'pending',
        client: clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: crypto.randomUUID(),
        title: 'Brand Strategy for AI Startup',
        description: 'Lead the visual identity and market positioning for a Series A startup in the generative AI space. Full ownership of brand guidelines.',
        category: 'Marketing',
        skillsRequired: ['Branding', 'AI'],
        budgetRange: { min: 8000, max: 15000 },
        budget: 8000,
        status: 'open',
        paymentStatus: 'pending',
        client: clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await mongoose.connection.db.collection('jobs').insertMany(demoJobs);
    console.log('Seeded 3 jobs successfully!');

    // 3. Clear old demo ads to avoid duplicates and write fresh ones
    await mongoose.connection.db.collection('ads').deleteMany({
      title: 'Mastering Remote Contracts 2024'
    });

    const now = new Date();
    const demoAd = {
      _id: crypto.randomUUID(),
      title: 'Mastering Remote Contracts 2024',
      brandName: 'WorkQuora Events',
      description: 'Boost your billable hours by 30% with our exclusive workshop for high-end freelancers.',
      targetLink: 'https://www.workquora.com',
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
      mediaPublicId: 'demo-ad-img',
      startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // yesterday
      endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // next year
      status: 'ACTIVE',
      platform: 'BOTH',
      dailyFrequency: 5,
      durationSeconds: 5,
      impressions: 0,
      clicks: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await mongoose.connection.db.collection('ads').insertOne(demoAd);
    console.log('Seeded 1 active advertisement campaign successfully!');

    await mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
