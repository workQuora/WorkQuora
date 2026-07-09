const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Job = require('../src/models/Job');

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log('Connecting to:', mongoUri ? mongoUri.replace(/:[^@]+@/, ':***@') : 'undefined');
    await mongoose.connect(mongoUri);
    console.log('Connected!');

    // 1. Clean existing jobs
    await Job.deleteMany({});
    console.log('Cleared existing jobs.');

    // 2. Clear seeded users (not the current user `prashant jha`!)
    const currentUserId = '51185ebc-2673-4089-91c1-c0275bc4085f';
    await User.deleteMany({ _id: { $ne: currentUserId } });
    console.log('Cleared existing seeded users.');

    // Ensure the current user has updated location details so they show up under Bhopal
    await User.updateOne(
      { _id: currentUserId },
      {
        $set: {
          location: {
            type: 'Point',
            coordinates: [77.4126, 23.2599],
            city: 'Bhopal',
            address: 'Bhopal, MP'
          }
        }
      }
    );
    console.log('Updated current user location to Bhopal.');

    // 3. Create a test Client user
    const clientSalt = await bcrypt.genSalt(12);
    const clientPassword = await bcrypt.hash('@Prashant307', clientSalt);
    const testClient = await User.create({
      _id: crypto.randomUUID(),
      name: 'Rohit Sharma',
      email: 'rohit@workquora.com',
      username: 'rohit_sharma',
      password: clientPassword,
      role: 'CLIENT',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      isEmailVerified: true,
      isKycVerified: true,
      location: {
        type: 'Point',
        coordinates: [77.4126, 23.2599],
        city: 'Bhopal',
        address: 'Bhopal, MP'
      }
    });
    console.log('Created Client Rohit Sharma');

    // 4. Create some test Freelancer users
    const freelancerNames = [
      { name: 'Priya Sharma', username: 'priya_dev', title: 'Senior UI/UX Designer', skills: ['figma', 'photoshop', 'illustrator', 'ui/ux', 'design'], avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
      { name: 'Amit Patel', username: 'amit_coder', title: 'React Developer', skills: ['javascript', 'react.js', 'html', 'css', 'tailwind'], avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
      { name: 'Neha Gupta', username: 'neha_writes', title: 'Technical Content Writer', skills: ['writing', 'content writing', 'seo', 'copywriting'], avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' }
    ];

    for (const f of freelancerNames) {
      const salt = await bcrypt.genSalt(12);
      const password = await bcrypt.hash('@Prashant307', salt);
      await User.create({
        _id: crypto.randomUUID(),
        name: f.name,
        email: `${f.username}@workquora.com`,
        username: f.username,
        password: password,
        role: 'FREELANCER',
        title: f.title,
        avatar: f.avatar,
        profilePic: f.avatar,
        skills: f.skills,
        normalizedSkills: f.skills,
        isEmailVerified: true,
        isKycVerified: true,
        isAvailable: true,
        hourlyRate: 500,
        location: {
          type: 'Point',
          coordinates: [77.4126, 23.2599],
          city: 'Bhopal',
          address: 'Bhopal, MP'
        }
      });
      console.log(`Created Freelancer ${f.name}`);
    }

    // 5. Seed some Jobs
    const jobsData = [
      {
        title: 'Modern Dashboard Redesign in React & TailwindCSS',
        description: 'We are seeking an expert React Developer to redesign our EdTech product dashboard. Must have experience with Figma translation, responsive design, and state management.',
        category: 'Development',
        skillsRequired: ['javascript', 'react.js', 'tailwind', 'html', 'css'],
        budgetRange: { min: 4000, max: 12000 },
        budget: 8000
      },
      {
        title: 'Logo & Branding Identity for FinTech Startup',
        description: 'Looking for a clean, modern, and trustworthy logo + brand identity kit. Deliverables include SVG assets, color palettes, and brand guidelines document.',
        category: 'Design',
        skillsRequired: ['figma', 'photoshop', 'illustrator', 'ui/ux', 'design'],
        budgetRange: { min: 2500, max: 6000 },
        budget: 4500
      },
      {
        title: 'SEO Content Writer for Weekly Developer Blogs',
        description: 'Need a tech writer to write 4 blogs per month. Topics will include React, Node.js, and cloud migrations. Articles must be SEO-optimized and well-structured.',
        category: 'Writing',
        skillsRequired: ['writing', 'content writing', 'seo'],
        budgetRange: { min: 1500, max: 3500 },
        budget: 2500
      },
      {
        title: 'Kitchen Tap and Pipe Leakage Repair',
        description: 'Urgent plumbing requirement to fix a leakage in the kitchen sink faucet and drain pipe in MP Nagar. All tools should be brought by the provider.',
        category: 'Plumbing',
        skillsRequired: ['plumbing', 'repair'],
        budgetRange: { min: 500, max: 1500 },
        budget: 800
      },
      {
        title: 'Installation of Living Room Chandelier & Smart Switches',
        description: 'Looking for a professional electrician to safely install a new chandelier light and wire 4 smart switches. Experience in home automation is a plus.',
        category: 'Electrical',
        skillsRequired: ['electrical', 'installation'],
        budgetRange: { min: 800, max: 2000 },
        budget: 1200
      }
    ];

    for (const job of jobsData) {
      await Job.create({
        title: job.title,
        description: job.description,
        category: job.category,
        skillsRequired: job.skillsRequired,
        budgetRange: job.budgetRange,
        budget: job.budget,
        client: testClient._id,
        status: 'open',
        location: {
          type: 'Point',
          coordinates: [77.4126, 23.2599],
          address: 'Bhopal, MP'
        }
      });
      console.log(`Created Job: "${job.title}"`);
    }

    console.log('Seeding completed successfully! 🎉');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
