const mongoose = require('mongoose');

async function listLocalDbs() {
  try {
    await mongoose.connect('mongodb://localhost:27017/admin');
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('Local databases:');
    for (const dbInfo of dbs.databases) {
      console.log(` - Name: ${dbInfo.name}`);
      const dbInstance = mongoose.connection.useDb(dbInfo.name);
      const collections = await dbInstance.db.listCollections().toArray();
      console.log('   Collections:', collections.map(c => c.name));
      if (collections.some(c => c.name === 'users')) {
        const count = await dbInstance.db.collection('users').countDocuments();
        console.log(`   Users count in ${dbInfo.name}:`, count);
        const users = await dbInstance.db.collection('users').find().limit(3).toArray();
        users.forEach(u => console.log(`     - ${u.name} (${u.email})`));
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Error listing local dbs:', err);
    process.exit(1);
  }
}

listLocalDbs();
