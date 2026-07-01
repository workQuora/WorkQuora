/// Mirrors backend route files 1:1. When backend routes change, this is the
/// ONLY file that needs updating — never hardcode a path string elsewhere.
class ApiEndpoints {
  ApiEndpoints._();

  // Set per-environment via --dart-define=API_BASE_URL=...
  static const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://workquora.onrender.com/api/v1',
  );

  // Socket.io connects at the server root
  static const socketUrl = String.fromEnvironment(
    'SOCKET_URL',
    defaultValue: 'https://workquora.onrender.com',
  );

  // ---- auth (authRoutes.js) ----
  static const register = '/auth/register';
  static const verifyRegistration = '/auth/verify-registration';
  static const verifyMobile = '/auth/verify-mobile';
  static const sendMobileOtp = '/auth/send-mobile-otp';
  static const login = '/auth/login';
  static const logout = '/auth/logout';
  static const logoutAll = '/auth/logout-all';
  static const refresh = '/auth/refresh';
  static const social = '/auth/social';
  static const forgotPassword = '/auth/forgot-password';
  static const resetPassword = '/auth/reset-password';
  static const checkUsername = '/auth/check-username';
  static const me = '/auth/me';
  static const assignRole = '/auth/user/assign-role';

  // ---- jobs (jobRoutes.js) ----
  static const jobs = '/jobs';
  static const myJobs = '/jobs/my-jobs';
  static String jobDetails(String id) => '/jobs/$id';

  // ---- messages (messageRoutes.js) ----
  static const conversations = '/messages/conversations';
  static String chatHistory(String jobId, String otherUserId) => '/messages/$jobId/$otherUserId';

  static const wallet = '/wallet';
  static const kyc = '/kyc';

  // ---- wallet (walletRoutes.js) ----
  static const walletBalance = '/wallet/balance';
  static const walletAddMoneyCreateOrder = '/wallet/add-money/create-order';
  static const walletAddMoneyVerify = '/wallet/add-money/verify';
  static const walletWithdraw = '/wallet/withdraw';
  static const walletTransactions = '/wallet/transactions';
  static const walletBankAccount = '/wallet/bank-account';
  static const walletVerifyPin = '/wallet/verify-pin';

  // ---- profile (profileRoutes.js, protected) ----
  static const profileMe = '/profile/me';
  static const profileUpdate = '/profile/update';
  static const profilePhoto = '/profile/photo';

  // ---- kyc (kycRoutes.js) ----
  static const kycOtpSend = '/kyc/otp/send';
  static const kycOtpVerify = '/kyc/otp/verify';
  static const kycPanSubmit = '/kyc/pan/submit';
  static const kycAadhaarSubmit = '/kyc/aadhaar/submit';
  static const kycBankSubmit = '/kyc/bank/submit';
  static const kycSelfieSubmit = '/kyc/selfie/submit';
  static const kycStatus = '/kyc/status';

  // ---- geo (geoRoutes.js) ----
  static const nearbyFreelancers = '/geo/nearby-freelancers';
  static const nearbyJobs = '/geo/nearby-jobs';
  static const updateLocation = '/geo/update-location';

  // ---- profile (profileRoutes.js) ----
  static String publicProfile(String userId) => '/profile/user/$userId';

  // ---- reviews (reviewRoutes.js) ----
  static String userReviews(String userId) => '/reviews/$userId';
  static const reviews = '/reviews';

  // ---- ads (adRoutes.js) ----
  static const adsActive = '/ads/active';
  static const adsTrack = '/ads/track';

  // ---- notifications (notificationRoutes.js) ----
  static const notifications = '/notifications';
  static String notificationRead(String id) => '/notifications/$id/read';
  static const notificationsReadAll = '/notifications/read-all';
}
