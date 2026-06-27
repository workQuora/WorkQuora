const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

async function debugConnection() {
  console.log('MONGO_URI from .env:', process.env.MONGO_URI);
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected DB Name:', mongoose.connection.name);
    console.log('Connected Host:', mongoose.connection.host);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections list:', collections.map(c => c.name));
    
    const User = require('../src/models/User');
    const count = await User.countDocuments();
    console.log('Users count:', count);
    const users = await User.find().select('name email');
    console.log('Users:');
    users.forEach(u => console.log(` - ${u.name} (${u.email})`));
    
    process.exit(0);
  } catch (err) {
    console.error('Error connecting:', err);
    process.exit(1);
  }
}

debugConnection();
