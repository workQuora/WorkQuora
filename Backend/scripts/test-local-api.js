const axios = require('axios');

async function testLocalApi() {
  try {
    const response = await axios.get('http://localhost:3000/api/v1/geo/nearby-freelancers', {
      params: {
        lat: 23.2599,
        lng: 77.4126,
        radius: 100
      }
    });
    console.log('Status code:', response.status);
    console.log('Success:', response.data?.success);
    console.log('Count:', response.data?.count);
    console.log('Freelancers returned by local backend:');
    const freelancers = response.data?.freelancers || response.data?.data || [];
    freelancers.forEach(f => {
      console.log(` - ${f.name} (${f.email}) [Role: ${f.role || f.title}] ID: ${f._id || f.id}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error fetching local API:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
    process.exit(1);
  }
}

testLocalApi();
