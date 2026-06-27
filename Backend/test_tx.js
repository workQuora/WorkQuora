require('dotenv').config();
const mongoose = require('mongoose');
const WalletTransaction = require('./src/models/WalletTransaction');
const User = require('./src/models/User');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({}); // first user
  if (!user) { console.log('No user'); process.exit(0); }
  
  try {
    const transactions = await WalletTransaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(20);
    console.log('Success:', transactions.length);
  } catch (e) {
    console.log('Error:', e);
  }
  process.exit(0);
}
test();
