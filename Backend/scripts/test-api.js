/**
 * Quick API smoke test — run: node scripts/test-api.js
 * Requires backend on PORT (default 3000) with MongoDB + MySQL reachable.
 */
const BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';

async function request(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function run() {
  const stamp = Date.now();
  const results = [];

  const log = (name, ok, detail = '') => {
    results.push({ name, ok });
    console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  try {
    const health = await request('GET', '/health');
    log('GET /health', health.status === 200, `status ${health.status}`);

    const emailClient = `client_${stamp}@test.local`;
    const reg = await request('POST', '/auth/register', {
      name: 'API Test Client',
      email: emailClient,
      password: 'testpass123',
      role: 'CLIENT',
      mobileNumber: '+919999999901',
    });
    log('POST /auth/register (client)', reg.status === 200, reg.data?.message);

    const verifyEmailClient = await request('POST', '/auth/verify-registration', {
      email: emailClient,
      otp: '123456',
    });
    log('POST /auth/verify-registration (client)', verifyEmailClient.status === 200, verifyEmailClient.data?.message);

    const verifyMobileClient = await request('POST', '/auth/verify-mobile', {
      email: emailClient,
      otp: '123456',
    });
    const clientToken = verifyMobileClient.data?.token;
    log('POST /auth/verify-mobile (client)', verifyMobileClient.status === 201 && !!clientToken, verifyMobileClient.data?.message);

    const emailFreelancer = `freelancer_${stamp}@test.local`;
    const regF = await request('POST', '/auth/register', {
      name: 'API Test Freelancer',
      email: emailFreelancer,
      password: 'testpass123',
      role: 'FREELANCER',
      mobileNumber: '+919999999902',
    });
    log('POST /auth/register (freelancer)', regF.status === 200, regF.data?.message);

    const verifyEmailFreelancer = await request('POST', '/auth/verify-registration', {
      email: emailFreelancer,
      otp: '123456',
    });
    log('POST /auth/verify-registration (freelancer)', verifyEmailFreelancer.status === 200, verifyEmailFreelancer.data?.message);

    const verifyMobileFreelancer = await request('POST', '/auth/verify-mobile', {
      email: emailFreelancer,
      otp: '123456',
    });
    const freelancerToken = verifyMobileFreelancer.data?.token;
    log('POST /auth/verify-mobile (freelancer)', verifyMobileFreelancer.status === 201 && !!freelancerToken, verifyMobileFreelancer.data?.message);

    const login = await request('POST', '/auth/login', {
      email: emailClient,
      password: 'testpass123',
    });
    log('POST /auth/login', login.status === 200 && !!login.data?.token);

    const me = await request('GET', '/auth/me', null, clientToken);
    log('GET /auth/me', me.status === 200 && !!me.data?.data?.id);

    const profile = await request('GET', '/profile/me', null, clientToken);
    log('GET /profile/me', profile.status === 200);

    const submitAadhaarRes = await request('POST', '/kyc/aadhaar/submit', { aadhaarNumber: '111122223333' }, clientToken);
    log('POST /kyc/aadhaar/submit', submitAadhaarRes.status === 200, submitAadhaarRes.data?.message);

    const submitPanRes = await request('POST', '/kyc/pan/submit', { panNumber: 'ABCDE1234F' }, clientToken);
    log('POST /kyc/pan/submit', submitPanRes.status === 200, submitPanRes.data?.message);

    const createJob = await request(
      'POST',
      '/jobs',
      {
        title: 'Test Plumbing Job',
        description: 'Need urgent plumbing repair at home within 2 days.',
        category: 'Home Services',
        minBudget: 1000,
        maxBudget: 5000,
        location: { type: 'Point', coordinates: [77.209, 28.6139], address: 'Delhi' },
      },
      clientToken
    );
    const jobId = createJob.data?.data?._id;
    log('POST /jobs', createJob.status === 201 && !!jobId, createJob.data?.message || JSON.stringify(createJob.data));

    const listJobs = await request('GET', '/jobs');
    log('GET /jobs', listJobs.status === 200 && Array.isArray(listJobs.data?.data));

    const myJobs = await request('GET', '/jobs/my-jobs', null, clientToken);
    log('GET /jobs/my-jobs', myJobs.status === 200);

    const dashClient = await request('GET', '/dashboard/client', null, clientToken);
    log('GET /dashboard/client', dashClient.status === 200);

    const dashFree = await request('GET', '/dashboard/freelancer', null, freelancerToken);
    log('GET /dashboard/freelancer', dashFree.status === 200);

    if (jobId) {
      // Freelancer KYC Submission
      const submitAadhaarResF = await request('POST', '/kyc/aadhaar/submit', { aadhaarNumber: '222233334444' }, freelancerToken);
      log('POST /kyc/aadhaar/submit (freelancer)', submitAadhaarResF.status === 200, submitAadhaarResF.data?.message);

      const submitPanResF = await request('POST', '/kyc/pan/submit', { panNumber: 'FGHIJ5678K' }, freelancerToken);
      log('POST /kyc/pan/submit (freelancer)', submitPanResF.status === 200, submitPanResF.data?.message);

      const proposal = await request(
        'POST',
        `/proposals/${jobId}`,
        { coverLetter: 'I can start today.', bidAmount: 3500, estimatedDays: 3 },
        freelancerToken
      );
      log('POST /proposals/:jobId', proposal.status === 201, proposal.data?.message);

      // Bible Vol 14: Only CLIENT can initiate a chat. Freelancer can only reply after bid accepted.
      const freelancerUser = await request('GET', '/auth/me', null, freelancerToken);
      const freelancerId = freelancerUser.data?.data?.id;

      const msg = await request(
        'POST',
        '/messages',
        {
          jobId,
          receiverId: freelancerId,
          text: 'Hello from client! Interested in your work.',
        },
        clientToken
      );
      log('POST /messages', msg.status === 201, msg.data?.message || JSON.stringify(msg.data));

      // Geolocation, Geo-fencing & Smart Match Tests (Vol 7 & 8)
      const updateFreeProfile = await request(
        'PUT',
        '/profile/update',
        {
          skills: ['Plumber', 'Appliance Repair'],
          serviceRadius: 20,
          coordinates: [77.209, 28.6139],
        },
        freelancerToken
      );
      log('PUT /profile/update (freelancer skills & location)', updateFreeProfile.status === 200, updateFreeProfile.data?.message);

      const getFreeProfile = await request('GET', '/profile/me', null, freelancerToken);
      const hasNormalized = getFreeProfile.data?.data?.normalizedSkills?.includes('plumber');
      log('Verify Skills Normalization Pre-save Hook', getFreeProfile.status === 200 && hasNormalized, `normalizedSkills: ${JSON.stringify(getFreeProfile.data?.data?.normalizedSkills)}`);

      // Smart Match API test (client to freelancer)
      const smartMatchRes = await request(
        'POST',
        '/jobs/smart-match',
        {
          description: 'Mera geyser kharab ho gya h plumber bulado',
          coordinates: [77.209, 28.6139],
          radius: 15,
        },
        clientToken
      );
      const isMatched = smartMatchRes.data?.data?.some(f => f._id === freelancerId);
      const hasExplanation = smartMatchRes.data?.data?.[0]?.matchExplanation && smartMatchRes.data?.data?.[0]?.matchScore;
      log('POST /jobs/smart-match (dynamic candidate ranking)', smartMatchRes.status === 200 && isMatched && hasExplanation, `matched count: ${smartMatchRes.data?.count}, top score: ${smartMatchRes.data?.data?.[0]?.matchScore}%`);

      // Dynamic Radius validation (Far location check)
      const smartMatchFarRes = await request(
        'POST',
        '/jobs/smart-match',
        {
          description: 'Mera geyser kharab ho gya h plumber bulado',
          coordinates: [78.500, 29.500], // Far away
          radius: 15,
        },
        clientToken
      );
      log('Smart Match Geo-fencing (Far Location Exclusion)', smartMatchFarRes.status === 200 && smartMatchFarRes.data?.count === 0, `matched count: ${smartMatchFarRes.data?.count}`);

      // Async JobCreated Notification & Deduplication
      const asyncJob = await request(
        'POST',
        '/jobs',
        {
          title: 'Emergency Tap Replacement',
          description: 'Kitchen sink tap leaking, urgent plumber required today.',
          category: 'Home Services',
          minBudget: 800,
          maxBudget: 2000,
          location: { type: 'Point', coordinates: [77.209, 28.6139], address: 'Delhi' },
        },
        clientToken
      );
      log('POST /jobs (asynchronous notification trigger)', asyncJob.status === 201);

      // Wait for background eventBus queue to finish matching
      await new Promise(resolve => setTimeout(resolve, 300));

      const freelancerNotifs = await request('GET', '/notifications', null, freelancerToken);
      const hasJobAlert = freelancerNotifs.data?.data?.some(n => n.message.includes('Emergency Tap Replacement'));
      log('Asynchronous Notification Delivery & Deduplication Validation', freelancerNotifs.status === 200 && hasJobAlert, `freelancer notification count: ${freelancerNotifs.data?.data?.length}`);
    }

    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed}/${results.length} passed`);
    process.exit(failed ? 1 : 0);
  } catch (err) {
    console.error('Test runner error:', err.message);
    process.exit(1);
  }
}

run();
