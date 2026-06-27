const axios = require('axios');

async function run() {
  try {
    console.log('Logging in as Niket Jha...');
    const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'niketjha1632@gmail.com',
      password: 'password123'
    });

    const token = loginRes.data?.token || loginRes.data?.data?.token;
    if (!token) {
      throw new Error('Failed to retrieve token from login response');
    }
    console.log('Login successful. Token retrieved.');

    const jobId = '6a3d37192febe1f465d5fe6c';
    console.log(`Submitting proposal for Job ID ${jobId}...`);
    const proposalRes = await axios.post(`http://localhost:3000/api/v1/proposals/${jobId}`, {
      coverLetter: 'I am a professional house painter with 5+ years of experience. I will use Asian Paints Royale emulsion and finish the 2 BHK flat within 7 days.',
      bidAmount: 18000,
      estimatedDays: 7
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Status code:', proposalRes.status);
    console.log('Response:', JSON.stringify(proposalRes.data, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error occurred:');
    if (err.response) {
      console.error(`Status code: ${err.response.status}`);
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

run();
