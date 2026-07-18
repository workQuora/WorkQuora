class ApiConstants {
  static const String baseUrl = 'https://workquora.onrender.com/api/v1';

  static const String login            = '/auth/login';
  static const String socialLogin      = '/auth/social';
  static const String register         = '/auth/register';
  static const String resendOtp        = '/auth/resend-otp';
  static const String verifyRegistration = '/auth/verify-registration';
  static const String verifyMobile     = '/auth/verify-mobile';
  static const String sendMobileOtp    = '/auth/send-mobile-otp';
  static const String me               = '/auth/me';
  static const String logout           = '/auth/logout';
  static const String checkUsername    = '/auth/check-username';

  static const String jobs             = '/jobs';
  static const String myJobs           = '/jobs/my-jobs';
  static const String nearbyJobs       = '/geo/nearby-jobs';
  static const String nearbyFreelancers= '/geo/nearby-freelancers';
  static const String geoSearch        = '/geo/search';
  static const String workerProfile    = '/profile/user';
  static const String profilePhoto     = '/profile/photo';

  static const String logoutAll        = '/auth/logout-all';
  static const String deleteAccount    = '/auth/account';
  static const String forgotPassword   = '/auth/forgot-password';
  static const String resetPassword    = '/auth/reset-password';

  static const String conversations    = '/messages/conversations';
  static const String sendMessage      = '/messages';

  static const String notifications    = '/notifications';
  static const String markAllRead      = '/notifications/read-all';

  static const String privacySettings  = '/settings/privacy';
  static const String notificationPrefs = '/settings/notifications';
  static const String currentTerms     = '/terms/current';

  static const String sessions              = '/auth/sessions';
  static const String requestEmailChangeOtp = '/auth/request-email-change-otp';
  static const String verifyEmailChange     = '/auth/verify-email-change';
  static const String requestMobileChangeOtp = '/auth/request-mobile-change-otp';
  static const String verifyMobileChange    = '/auth/verify-mobile-change';

  static const String myTasks          = '/tasks/my-tasks';
  static const String postJob          = '/jobs';
  static const String uploadJobPhoto   = '/jobs/upload-photo';
  static const String proposals        = '/proposals';
  // acceptProposal: '${ApiConstants.proposals}/$proposalId/accept'
  // rejectProposal: '${ApiConstants.proposals}/$proposalId/reject'
  // cancelJob:      '${ApiConstants.jobs}/$jobId/cancel'
}
