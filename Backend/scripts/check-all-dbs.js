const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

async function listDbs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('Databases on this cluster:');
    dbs.databases.forEach(db => {
      console.log(` - Name: ${db.name}, Size: ${db.sizeOnDisk}`);
    });
    
    // Check 'test' database as well
    const dbTest = mongoose.connection.useDb('test');
    const collectionsTest = await dbTest.db.listCollections().toArray();
    console.log('Collections in test:', collectionsTest.map(c => c.name));
    if (collectionsTest.some(c => c.name === 'users')) {
      const countTest = await dbTest.model('User', new mongoose.Schema({}, { strict: false }), 'users').countDocuments();
      console.log('Users in test:', countTest);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error listing dbs:', err);
    process.exit(1);
  }
}

listDbs();
