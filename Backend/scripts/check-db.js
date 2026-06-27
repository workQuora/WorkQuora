const mongoose = require('mongoose');
const User = require('../src/models/User');
const Job = require('../src/models/Job');
const Task = require('../src/models/Task');
require('dotenv').config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const usersCount = await User.countDocuments();
    const jobsCount = await Job.countDocuments();
    const tasksCount = await Task.countDocuments();

    console.log(`\n--- DB Counts ---`);
    console.log(`Users: ${usersCount}`);
    console.log(`Jobs: ${jobsCount}`);
    console.log(`Tasks: ${tasksCount}`);

    console.log(`\n--- Users in DB ---`);
    const users = await User.find().select('name email role');
    users.forEach(u => console.log(`- ${u.name} (${u.email}) [Role: ${u.role}] ID: ${u._id}`));

    console.log(`\n--- Jobs in DB ---`);
    const jobs = await Job.find().select('title category client status budget');
    jobs.forEach(j => console.log(`- ${j.title} | Status: ${j.status} | Client: ${j.client}`));

    console.log(`\n--- Tasks in DB ---`);
    const tasks = await Task.find().select('job freelancer client status');
    tasks.forEach(t => console.log(`- Task ID: ${t._id} | Client: ${t.client} | Freelancer: ${t.freelancer} | Status: ${t.status}`));

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

check();
