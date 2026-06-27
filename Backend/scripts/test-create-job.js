const axios = require('axios');

async function testPostJob() {
  try {
    console.log('Logging in as Prashant Jha...');
    const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'prashantjha1632@gmail.com',
      password: 'password123'
    });

    const token = loginRes.data?.token || loginRes.data?.data?.token;
    if (!token) {
      throw new Error('Failed to retrieve token');
    }
    console.log('Login successful.');

    console.log('Creating job...');
    const jobRes = await axios.post('http://localhost:3000/api/v1/jobs', {
      title: 'Need a Professional Cleaner',
      description: 'Need deep cleaning for 2 BHK kitchen and bathroom.',
      budget: 5000,
      category: 'cleaner',
      location: { type: 'Point', address: 'Bhopal', coordinates: [77.2090, 28.6139] },
      isUrgent: true
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Success:', jobRes.data);
    process.exit(0);
  } catch (error) {
    console.error('Error creating job:');
    if (error.response) {
      console.error(`Status code: ${error.response.status}`);
      console.error('Response body:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testPostJob();
