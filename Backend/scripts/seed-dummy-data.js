const mongoose = require('mongoose');
const User = require('../src/models/User');
const Job = require('../src/models/Job');
const Earnings = require('../src/models/Earnings');
require('dotenv').config();

const skillsList = [
  ['React', 'TypeScript', 'Node.js', 'Figma'],
  ['Flutter', 'Dart', 'Firebase', 'Mobile App'],
  ['UI UX Design', 'Figma', 'Prototyping', 'Wireframing'],
  ['Python', 'Django', 'PostgreSQL', 'AWS'],
  ['Java', 'Spring Boot', 'MySQL', 'Docker'],
  ['DevOps', 'Kubernetes', 'CI/CD', 'GitHub Actions'],
  ['Content Writing', 'SEO', 'Copywriting', 'Creative Writing'],
  ['Digital Marketing', 'SEO', 'Google Ads', 'Social Media'],
];

const titlesList = [
  'Senior Frontend Engineer',
  'Cross-Platform Flutter Developer',
  'UI/UX Product Designer',
  'Backend Systems Engineer',
  'Full Stack Java Developer',
  'DevOps & Cloud Specialist',
  'Technical Content Writer',
  'Growth Marketing Manager',
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully!');

    // 1. Generate 13 clients
    console.log('Generating 13 Clients...');
    const clientIds = [];
    for (let i = 1; i <= 13; i++) {
      const email = `client_${i}_${Date.now()}@test.local`;
      const client = await User.create({
        name: `Client ${i}`,
        email: email,
        password: '@Password123',
        role: 'CLIENT',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Client${i}`,
        location: {
          type: 'Point',
          coordinates: [77.41 + (Math.random() - 0.5) * 0.1, 23.25 + (Math.random() - 0.5) * 0.1], // Bhopal area
          city: 'Bhopal',
          address: `Client Address Street ${i}`
        },
        isVerified: true
      });
      clientIds.push(client._id);

      // Create empty earnings for the client
      await Earnings.create({
        userId: client._id,
        walletBalance: 0,
        escrowBalance: 0,
        completedJobs: 0
      });
    }
    console.log(`Created 13 clients: ${clientIds.join(', ')}`);

    // 2. Generate 13 freelancers
    console.log('Generating 13 Freelancers...');
    const freelancerIds = [];
    for (let i = 1; i <= 13; i++) {
      const email = `freelancer_${i}_${Date.now()}@test.local`;
      const index = i % skillsList.length;
      const skills = skillsList[index];
      const title = titlesList[index];
      const rate = 300 + Math.floor(Math.random() * 12) * 100; // 300 to 1500

      const freelancer = await User.create({
        name: `Freelancer ${i}`,
        email: email,
        password: '@Password123',
        role: 'FREELANCER',
        title: title,
        bio: `Hi, I am Freelancer ${i}. I specialize in ${skills.join(', ')} with ${2 + (i % 8)} years of professional experience.`,
        skills: skills,
        hourlyRate: rate,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Freelancer${i}`,
        location: {
          type: 'Point',
          coordinates: [77.4126 + (Math.random() - 0.5) * 0.05, 23.2599 + (Math.random() - 0.5) * 0.05], // Bhopal area
          city: 'Bhopal',
          address: `Freelancer Address Road ${i}`
        },
        averageRating: 4.0 + (Math.random() * 1.0),
        totalJobsCompleted: i % 5,
        trustScore: 70 + (i % 25),
        isVerified: true,
        kycVerified: i % 3 === 0
      });
      freelancerIds.push(freelancer._id);

      // Create earnings record
      await Earnings.create({
        userId: freelancer._id,
        walletBalance: 5000 * (i % 5),
        escrowBalance: 0,
        allTimeIncome: 12000 * (i % 5),
        completedJobs: i % 5
      });
    }
    console.log(`Created 13 freelancers: ${freelancerIds.join(', ')}`);

    // 3. Generate 30 jobs
    console.log('Generating 30 Jobs...');
    const categories = ['development', 'design', 'marketing', 'writing'];
    const jobTitles = [
      'Need Responsive Website Design',
      'Build Custom Mobile App',
      'Figma Prototype for Fintech Project',
      'Technical Blog Post Writer Needed',
      'Configure CI/CD Pipelines in AWS',
      'Set Up MongoDB Replica Sets',
      'SEO Audit and Execution Plan',
      'Develop REST API with Node & Express',
      'Illustrations for Landing Page',
      'Social Media Ads Optimization',
    ];

    for (let i = 1; i <= 30; i++) {
      const clientIndex = i % clientIds.length;
      const freelancerIndex = (i + 2) % freelancerIds.length;
      const category = categories[i % categories.length];
      const jobTitle = `${jobTitles[i % jobTitles.length]} #${i}`;
      
      let status = 'open';
      if (i > 10 && i <= 20) status = 'in-progress';
      if (i > 20) status = 'completed';

      const jobData = {
        title: jobTitle,
        description: `This is a premium gig for "${jobTitle}". Looking for professional assistance to help compile the features and deliver a solid product.`,
        category: category,
        skillsRequired: skillsList[i % skillsList.length],
        budget: 5000 + Math.floor(Math.random() * 29) * 5000, // 5k to 150k
        client: clientIds[clientIndex],
        status: status,
        location: {
          type: 'Point',
          coordinates: [77.41 + (Math.random() - 0.5) * 0.1, 23.25 + (Math.random() - 0.5) * 0.1],
          city: 'Bhopal',
          address: 'Bhopal Center'
        }
      };

      if (status === 'in-progress') {
        jobData.assignedTo = freelancerIds[freelancerIndex];
      } else if (status === 'completed') {
        jobData.assignedTo = freelancerIds[freelancerIndex];
        jobData.hiredFreelancer = freelancerIds[freelancerIndex];
      }

      await Job.create(jobData);
    }
    console.log('Created 30 Jobs successfully!');

    console.log('🎉 Seeding successfully completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
