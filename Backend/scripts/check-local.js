const mongoose = require('mongoose');

async function checkLocal() {
  try {
    await mongoose.connect('mongodb://localhost:27017/workquora');
    console.log('Connected to Local MongoDB.');
    console.log('Connected DB Name:', mongoose.connection.name);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    if (collections.some(c => c.name === 'users')) {
      const count = await mongoose.connection.db.collection('users').countDocuments();
      console.log('Local users count:', count);
      const users = await mongoose.connection.db.collection('users').find().toArray();
      users.forEach(u => console.log(` - ${u.name} (${u.email}) [ID: ${u._id}]`));
    } else {
      console.log('No users collection found in local workquora.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to local DB:', err);
    process.exit(1);
  }
}

checkLocal();
