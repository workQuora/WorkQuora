const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const collections = await mongoose.connection.db.listCollections().toArray();
    const hasKycs = collections.some(c => c.name === 'kycs');

    if (hasKycs) {
      console.log('Inspecting indexes on kycs...');
      const indexes = await mongoose.connection.db.collection('kycs').indexes();
      console.log('Current indexes:', indexes.map(idx => idx.name));

      if (indexes.some(idx => idx.name === 'panCard_1')) {
        console.log('Dropping old panCard_1 index...');
        await mongoose.connection.db.collection('kycs').dropIndex('panCard_1');
        console.log('Old panCard_1 index dropped.');
      }
    } else {
      console.log('kycs collection does not exist yet.');
    }

    console.log('Index fix migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

fix();
