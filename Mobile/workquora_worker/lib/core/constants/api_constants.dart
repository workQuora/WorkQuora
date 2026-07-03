class ApiConstants {
  static const String baseUrl = 'https://workquora.onrender.com/api/v1';

  static const String login            = '/auth/login';
  static const String register         = '/auth/register';
  static const String sendOtp          = '/auth/send-otp';
  static const String verifyOtp        = '/auth/verify-otp';
  static const String me               = '/auth/me';
  static const String logout           = '/auth/logout';

  static const String kycSendOtp       = '/kyc/otp/send';
  static const String kycVerifyOtp     = '/kyc/otp/verify';
  static const String kycAadhaar       = '/kyc/aadhaar/submit';
  static const String kycPan           = '/kyc/pan/submit';
  static const String kycBank          = '/kyc/bank/add';
  static const String kycPin           = '/kyc/pin/set';
  static const String kycStatus        = '/kyc/status';

  static const String jobs             = '/jobs';
  static const String nearbyJobs       = '/jobs/nearby';
  static const String nearbyFreelancers= '/freelancers/nearby';
  static const String freelancers      = '/freelancers';

  static const String wallet           = '/wallet';
  static const String topupOrder       = '/wallet/topup/order';
  static const String topupVerify      = '/wallet/topup/verify';
  static const String withdraw         = '/wallet/withdraw';
  static const String transactions     = '/wallet/transactions';

  static const String conversations    = '/messages/conversations';
  static const String messages         = '/messages';
  static const String sendMessage      = '/messages/send';

  static const String notifications    = '/notifications';
  static const String markAllRead      = '/notifications/mark-all-read';

  static const String myTasks          = '/tasks/my-tasks';
  static const String postJob          = '/jobs';
}
