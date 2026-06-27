/**
 * SMS Service Wrapper
 * Handles sending OTPs via Fast2SMS, MSG91, or fallback to console logs
 * based on environment variables.
 */

const axios = require('axios');

const SMS_PROVIDER = (process.env.SMS_PROVIDER || 'MOCK').toUpperCase();
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const MSG91_API_KEY = process.env.MSG91_API_KEY;

/**
 * Sends an OTP via SMS
 * @param {string} mobileNumber - User's mobile number (e.g., 9999999999)
 * @param {string} otp - 6-digit OTP
 */
exports.sendOtp = async (mobileNumber, otp) => {
  console.log(`[SMS Service] Sending OTP ${otp} to ${mobileNumber} via ${SMS_PROVIDER}`);

  try {
    if (SMS_PROVIDER === 'FAST2SMS') {
      if (!FAST2SMS_API_KEY) throw new Error('FAST2SMS_API_KEY is missing');
      
      await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: 'v3',
          sender_id: 'TXTIND',
          message: `Your WorkQuora KYC verification OTP is ${otp}. It is valid for 5 minutes.`,
          language: 'english',
          flash: 0,
          numbers: mobileNumber,
        },
        {
          headers: {
            authorization: FAST2SMS_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      
    } else if (SMS_PROVIDER === 'MSG91') {
      if (!MSG91_API_KEY) throw new Error('MSG91_API_KEY is missing');
      
      await axios.post(
        'https://api.msg91.com/api/v5/otp',
        null,
        {
          params: {
            authkey: MSG91_API_KEY,
            mobile: mobileNumber,
            otp: otp,
            template_id: process.env.MSG91_TEMPLATE_ID || 'dummy_template',
          },
        }
      );
      
    } else {
      // MOCK provider for local dev
      console.log(`[MOCK SMS] Successfully "sent" OTP ${otp} to ${mobileNumber}`);
    }
    
    return true;
  } catch (error) {
    console.error('[SMS Service] Error sending SMS:', error.response?.data || error.message);
    throw new Error('Failed to send SMS OTP');
  }
};
