const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Kyc = require('../src/models/Kyc');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findById('a2234e59-2239-4114-980d-7863114783cd');
    console.log('User details:');
    console.log(JSON.stringify(user, null, 2));

    const kyc = await Kyc.findOne({ userId: 'a2234e59-2239-4114-980d-7863114783cd' });
    console.log('Kyc details:');
    console.log(JSON.stringify(kyc, null, 2));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
