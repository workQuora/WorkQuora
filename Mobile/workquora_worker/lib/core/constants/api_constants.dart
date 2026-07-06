class ApiConstants {
  static const String baseUrl = 'https://workquora.onrender.com/api/v1';

  // Auth
  static const String login              = '/auth/login';
  static const String register           = '/auth/register';
  static const String verifyRegistration = '/auth/verify-registration';
  static const String verifyMobile       = '/auth/verify-mobile';
  static const String sendMobileOtp      = '/auth/send-mobile-otp';
  static const String getMe              = '/auth/me';
  static const String forgotPassword     = '/auth/forgot-password';
  static const String resetPassword      = '/auth/reset-password';
  static const String logout             = '/auth/logout';

  // Jobs (worker browses these)
  static const String jobs               = '/jobs';
  static const String nearbyJobs         = '/geo/nearby-jobs';
  static const String jobSearch          = '/jobs/search';

  // Proposals (worker submits these)
  static const String proposals          = '/proposals';
  // usage: POST /proposals (submit)
  // usage: GET /proposals/my-proposals (worker's proposals)

  // Tasks (worker updates status)
  // usage: PUT /tasks/:taskId/status

  // Messages
  static const String conversations      = '/messages/conversations';
  static const String sendMessage        = '/messages';

  // Notifications
  static const String notifications      = '/notifications';
  static const String markAllRead        = '/notifications/read-all';

  // Profile
  static const String profile            = '/profile';
  static const String updateProfile      = '/profile/update';
  static const String profilePhoto       = '/profile/photo';

  // Wallet / Earnings
  static const String walletBalance      = '/wallet/balance';
  static const String walletTransactions = '/wallet/transactions';
  static const String withdraw           = '/wallet/withdraw';
  static const String setPin             = '/wallet/set-pin';

  // KYC
  static const String kycStatus          = '/kyc/status';
  static const String kycSendOtp         = '/kyc/otp/send';
  static const String kycVerifyOtp       = '/kyc/otp/verify';
  static const String kycSubmitPan       = '/kyc/pan/submit';
  static const String kycSubmitAadhaar   = '/kyc/aadhaar/submit';
  static const String kycSubmitBank      = '/kyc/bank/submit';
  static const String kycSubmitSelfie    = '/kyc/selfie/submit';

  // Settings
  static const String privacySettings    = '/settings/privacy';
  static const String geoSearch          = '/geo/search';

  // Dashboard
  static const String freelancerDashboard = '/dashboard/freelancer';
}
