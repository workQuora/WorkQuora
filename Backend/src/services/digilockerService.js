/**
 * DigiLocker OAuth Service Wrapper
 */

const axios = require('axios');
const crypto = require('crypto');

const DIGILOCKER_CLIENT_ID = process.env.DIGILOCKER_CLIENT_ID || 'MOCK_CLIENT_ID';
const DIGILOCKER_CLIENT_SECRET = process.env.DIGILOCKER_CLIENT_SECRET || 'MOCK_CLIENT_SECRET';
const REDIRECT_URI = process.env.DIGILOCKER_REDIRECT_URI || 'http://localhost:3000/api/v1/kyc/aadhaar/callback';

/**
 * Generate DigiLocker OAuth Initialization URL
 * @param {string} state - Random state string to prevent CSRF, usually the userId
 * @returns {string} - The OAuth URL
 */
exports.getOAuthUrl = (state) => {
  // Mock fallback for local dev if keys are not real
  if (DIGILOCKER_CLIENT_ID === 'MOCK_CLIENT_ID') {
    return `http://localhost:3000/api/v1/kyc/aadhaar/mock-auth?state=${state}`;
  }

  const baseUrl = 'https://api.digitallocker.gov.in/public/oauth2/1/authorize';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: DIGILOCKER_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state: state,
    // Add specific scope if DigiLocker requires it
    scope: 'aadhaar'
  });
  
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Exchange Authorization Code for Access Token and fetch Aadhaar Details
 * @param {string} code - The authorization code from OAuth callback
 * @returns {object} - The fetched Aadhaar details
 */
exports.exchangeCodeAndFetchAadhaar = async (code) => {
  // Mock fallback
  if (DIGILOCKER_CLIENT_ID === 'MOCK_CLIENT_ID' || code === 'MOCK_CODE') {
    return {
      success: true,
      aadhaarNumber: 'XXXX-XXXX-' + Math.floor(1000 + Math.random() * 9000),
      name: 'Mock Verified User',
      documentUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
    };
  }

  try {
    // 1. Exchange Code for Token
    const tokenResponse = await axios.post(
      'https://api.digitallocker.gov.in/public/oauth2/1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: DIGILOCKER_CLIENT_ID,
        client_secret: DIGILOCKER_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // 2. Fetch User Profile/Aadhaar document
    // Note: The actual endpoint depends on DigiLocker's specific API specs for pulling the eAadhaar XML/PDF.
    // This is a generalized implementation.
    const fileResponse = await axios.get(
      'https://api.digitallocker.gov.in/public/oauth2/1/file/aadhaar',
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    // Assuming fileResponse contains the document info
    return {
      success: true,
      data: fileResponse.data
    };
  } catch (error) {
    console.error('[DigiLocker Service] Error exchanging code:', error.response?.data || error.message);
    throw new Error('Failed to verify Aadhaar with DigiLocker');
  }
};
