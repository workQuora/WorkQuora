const http = require('http');

const SERVER_URL = 'http://localhost:3000';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SERVER_URL);
    const bodyStr = body ? JSON.stringify(body) : '';
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (bodyStr) {
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json,
          rawBody: data
        });
      });
    });

    req.on('error', (err) => { reject(err); });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runTests() {
  console.log('🛡️  WorkQuora Backend Security Pentest Initiated...\n');
  const results = [];
  let failed = false;

  // TEST 1: NoSQL Injection (Login Bypass Attempt)
  try {
    console.log('🧪 Test 1: Simulating NoSQL Query Injection on Login...');
    const payload = {
      email: { $gt: "" },
      password: { $gt: "" }
    };
    const res = await makeRequest('POST', '/api/v1/auth/login', payload);
    const success = res.statusCode === 400 || res.statusCode === 401;
    if (!success) failed = true;
    results.push({
      testName: 'NoSQL Query Injection (Login Bypass)',
      status: success ? 'PASSED (Secure)' : 'FAILED (Vulnerable)',
      details: `Returned HTTP ${res.statusCode}. Body: ${JSON.stringify(res.body || res.rawBody.slice(0, 100))}`
    });
  } catch (e) {
    failed = true;
    results.push({ testName: 'NoSQL Query Injection', status: 'ERROR', details: e.message });
  }

  // TEST 2: Malformed Payload Input Crash robustness
  try {
    console.log('🧪 Test 2: Sending Malformed Payload (Array instead of String)...');
    const payload = {
      email: ['not_a_string'],
      password: 'somepassword'
    };
    const res = await makeRequest('POST', '/api/v1/auth/login', payload);
    const success = res.statusCode >= 400 && res.statusCode < 500;
    if (!success) failed = true;
    results.push({
      testName: 'Malformed Payload Robustness',
      status: success ? 'PASSED (Secure)' : 'FAILED (Vulnerable)',
      details: `Returned HTTP ${res.statusCode}. Check if server crashed... (it didn't)`
    });
  } catch (e) {
    failed = true;
    results.push({ testName: 'Malformed Payload Robustness', status: 'ERROR', details: e.message });
  }

  // TEST 3: Sensitive Field Data Leakage Check (Registration response)
  try {
    console.log('🧪 Test 3: Checking if Registration endpoint leaks sensitive schemas...');
    const payload = {
      name: 'Test Hack',
      email: 'hacker@gmail.com',
      username: 'hacker123',
      mobileNumber: '9999999999',
      password: 'password123',
      gender: 'MALE',
      role: 'FREELANCER'
    };
    const res = await makeRequest('POST', '/api/v1/auth/register', payload);
    const bodyStr = JSON.stringify(res.body || {});
    const leaks = bodyStr.includes('withdrawalPin') || bodyStr.includes('resetPasswordOtp') || bodyStr.includes('password');
    if (leaks) failed = true;
    results.push({
      testName: 'Sensitive Fields Schema Exposure',
      status: !leaks ? 'PASSED (Secure)' : 'FAILED (Vulnerable)',
      details: `Returned HTTP ${res.statusCode}. Leaks detected: ${leaks ? 'YES' : 'NO'}`
    });
  } catch (e) {
    failed = true;
    results.push({ testName: 'Sensitive Fields Schema Exposure', status: 'ERROR', details: e.message });
  }

  // TEST 4: CORS Arbitrary Origin Bypass check
  try {
    console.log('🧪 Test 4: Testing CORS headers validation...');
    const maliciousOrigin = 'http://malicious-attacker-domain.com';
    const res = await makeRequest('GET', '/api/v1/health', null, {
      'Origin': maliciousOrigin
    });
    const allowedOrigin = res.headers['access-control-allow-origin'];
    const success = allowedOrigin !== maliciousOrigin;
    if (!success) failed = true;
    results.push({
      testName: 'CORS Origin Hijacking Prevention',
      status: success ? 'PASSED (Secure)' : 'FAILED (Vulnerable)',
      details: `Requested Origin: ${maliciousOrigin}. Allowed Origin Header: ${allowedOrigin || 'None (Secure)'}`
    });
  } catch (e) {
    failed = true;
    results.push({ testName: 'CORS Origin Hijacking', status: 'ERROR', details: e.message });
  }

  console.log('\n📊 === PENTEST SUMMARY ===');
  results.forEach((r, idx) => {
    console.log(`[${idx + 1}] ${r.testName}: ${r.status}`);
    console.log(`    Details: ${r.details}\n`);
  });

  if (failed) {
    console.log('❌ Pentest failed. Please fix vulnerabilities before committing.');
    process.exit(1);
  } else {
    console.log('✅ All pentests passed successfully!');
    process.exit(0);
  }
}

runTests();
