import api from '../services/api';

export const authApi = {
  register:   (d) => api.post('/auth/register', d),
  verifyRegistration: (d) => api.post('/auth/verify-registration', d),
  verifyMobile:       (d) => api.post('/auth/verify-mobile', d),
  sendMobileOtp:      (d) => api.post('/auth/send-mobile-otp', d),
  login:      (d) => api.post('/auth/login', d),
  me:         ()  => api.get('/auth/me'),
  logout:     ()  => api.post('/auth/logout'),
  logoutAll:  ()  => api.post('/auth/logout-all'),
  social:     (d) => api.post('/auth/social', d),
  assignRole: (r) => api.put('/auth/user/assign-role', { role: r }),
  changePassword: (d) => api.put('/auth/change-password', d),
  requestPasswordOtp: (d) => api.post('/auth/request-password-otp', d),
  verifyPasswordOtp:  (d) => api.post('/auth/verify-password-otp', d),
  setPassword:        (d) => api.post('/auth/set-password', d),
  requestEmailChangeOtp:  (d) => api.post('/auth/request-email-change-otp', d),
  verifyEmailChange:      (d) => api.post('/auth/verify-email-change', d),
  requestMobileChangeOtp: (d) => api.post('/auth/request-mobile-change-otp', d),
  verifyMobileChange:     (d) => api.post('/auth/verify-mobile-change', d),
  sessions:   ()  => api.get('/auth/sessions'),
  revokeSession: (id) => api.delete(`/auth/sessions/${id}`),
  logoutAllSessions: () => api.delete('/auth/sessions'),
  deleteAccount: () => api.delete('/auth/account'),
};

export const geoApi = {
  nearbyJobs:        (p) => api.get('/geo/nearby-jobs', { params: p }),
  nearbyFreelancers: (p) => api.get('/geo/nearby-freelancers', { params: p }),
  updateLocation:    (d) => api.put('/geo/update-location', d),
  setRadius:         (r) => api.put('/geo/set-radius', { radius: r }),
};

export const jobsApi = {
  getAll:     (p)    => api.get('/jobs', { params: p }),
  getById:    (id)   => api.get(`/jobs/${id}`),
  create:     (d)    => api.post('/jobs', d),
  update:     (id,d) => api.put(`/jobs/${id}`, d),
  delete:     (id)   => api.delete(`/jobs/${id}`),
  myJobs:     ()     => api.get('/jobs/my-jobs'),
  search:     (p)    => api.get('/jobs/search', { params: p }),
  smartMatch: (d)    => api.post('/jobs/smart-match', d),
  feed:       (p)    => api.get('/jobs/feed', { params: p }),
};

export const proposalsApi = {
  submit:   (jobId, d) => api.post(`/proposals/${jobId}`, d),
  getForJob:(jobId)    => api.get(`/proposals/job/${jobId}`),
};

export const profileApi = {
  me:          ()  => api.get('/profile/me'),
  update:      (d) => api.put('/profile/update', d),
  uploadPhoto: (f) => api.post('/profile/photo', f, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePhoto: ()  => api.delete('/profile/photo'),
  updateKyc:   (d) => api.post('/profile/kyc', d),
  updateBank:  (d) => api.post('/profile/bank', d),
};

export const settingsApi = {
  getPrivacy:        ()  => api.get('/settings/privacy'),
  updatePrivacy:     (d) => api.put('/settings/privacy', d),
  getNotifications:  ()  => api.get('/settings/notifications'),
  updateNotifications: (d) => api.put('/settings/notifications', d),
};

export const messagesApi = {
  conversations: ()               => api.get('/messages/conversations'),
  history:       (jobId, uid)     => api.get(`/messages/${jobId}/${uid}`),
  send:          (d)              => api.post('/messages', d),
};

export const notificationsApi = {
  getAll:      (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markAllRead: () => api.patch('/notifications/read-all'),
  markOneRead: (id) => api.patch(`/notifications/${id}/read`),
};

export const walletApi = {
  balance:      ()  => api.get('/wallet/balance'),
  withdraw:     (d) => api.post('/wallet/withdraw', d),
  verifyPin:    (d) => api.post('/wallet/verify-pin', d),
  transactions: (p) => api.get('/wallet/transactions', { params: p }),
};


export const analyticsApi = {
  freelancerRevenue: () => api.get('/analytics/freelancer-revenue'),
  clientMetrics:     () => api.get('/analytics/client-metrics'),
};

export const dashboardApi = {
  client:     () => api.get('/dashboard/client'),
  freelancer: () => api.get('/dashboard/freelancer'),
  wallet:     () => api.get('/dashboard/wallet'),
};

export const transactionsApi = {
  deposit: (jobId) => api.post(`/transactions/job/${jobId}/deposit`),
  release: (jobId) => api.post(`/transactions/job/${jobId}/release`),
};

export const kycApi = {
  sendOtp:      (f) => api.post('/kyc/otp/send', f, { headers: { 'Content-Type': 'multipart/form-data' } }),
  verifyOtp:    (d) => api.post('/kyc/otp/verify', d),
  submitAadhaar:(f) => api.post('/kyc/aadhaar/submit', f, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addPan:       (f) => api.post('/kyc/pan/submit', f, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addBank:      (d) => api.post('/kyc/bank/submit', d),
  submitSelfie: (f) => api.post('/kyc/selfie/submit', f, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getStatus:    ()  => api.get('/kyc/status'),
  reset:        ()  => api.post('/kyc/reset'),
};

export const categoriesApi = {
  list: () => api.get('/categories'),
};

export const reviewsApi = {
  add:      (d)      => api.post('/reviews', d),
  getUser:  (userId) => api.get(`/reviews/${userId}`),
  getGiven: (userId) => api.get(`/reviews/given/${userId}`),
};