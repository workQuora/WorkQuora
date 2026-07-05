class ApiConstants {
  static const String baseUrl = 'https://workquora.onrender.com/api/v1';

  static const String login            = '/auth/login';
  static const String register         = '/auth/register';
  static const String verifyRegistration = '/auth/verify-registration';
  static const String verifyMobile     = '/auth/verify-mobile';
  static const String sendMobileOtp    = '/auth/send-mobile-otp';
  static const String me               = '/auth/me';
  static const String logout           = '/auth/logout';

  static const String kycSendOtp       = '/kyc/otp/send';
  static const String kycVerifyOtp     = '/kyc/otp/verify';
  static const String kycSubmitPan     = '/kyc/pan/submit';
  static const String kycSubmitAadhaar = '/kyc/aadhaar/submit';
  static const String kycSubmitBank    = '/kyc/bank/submit';
  static const String kycSubmitSelfie  = '/kyc/selfie/submit';
  static const String kycStatus        = '/kyc/status';

  static const String jobs             = '/jobs';
  static const String myJobs           = '/jobs/my-jobs';
  static const String nearbyJobs       = '/geo/nearby-jobs';
  static const String nearbyFreelancers= '/geo/nearby-freelancers';
  static const String geoSearch        = '/geo/search';
  static const String workerProfile    = '/profile/user';
  static const String profilePhoto     = '/profile/photo';

  static const String wallet           = '/wallet/balance';
  static const String topupOrder       = '/wallet/topup/order';
  static const String topupVerify      = '/wallet/topup/verify';
  static const String withdraw         = '/wallet/withdraw';
  static const String transactions     = '/wallet/transactions';
  static const String setWithdrawalPin = '/wallet/set-pin';

  static const String logoutAll        = '/auth/logout-all';
  static const String deleteAccount    = '/auth/account';
  static const String forgotPassword   = '/auth/forgot-password';
  static const String resetPassword    = '/auth/reset-password';

  static const String conversations    = '/messages/conversations';
  static const String sendMessage      = '/messages';

  static const String notifications    = '/notifications';
  static const String markAllRead      = '/notifications/read-all';

  static const String privacySettings  = '/settings/privacy';

  static const String myTasks          = '/tasks/my-tasks';
  static const String postJob          = '/jobs';
  static const String uploadJobPhoto   = '/jobs/upload-photo';
  static const String proposals        = '/proposals';
  // acceptProposal: '${ApiConstants.proposals}/$proposalId/accept'
  // rejectProposal: '${ApiConstants.proposals}/$proposalId/reject'
  // cancelJob:      '${ApiConstants.jobs}/$jobId/cancel'
}
