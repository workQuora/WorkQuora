import api from '../services/api';

export const authApi = {
  register:   (d) => api.post('/auth/register', d),
  verifyRegistration: (d) => api.post('/auth/verify-registration', d),
  verifyMobile:       (d) => api.post('/auth/verify-mobile', d),
  sendMobileOtp:      (d) => api.post('/auth/send-mobile-otp', d),
  login:      (d) => api.post('/auth/login', d),
  me:         ()  => api.get('/auth/me'),
  logout:     ()  => api.post('/auth/logout'),
  social:     (d) => api.post('/auth/social', d),
  assignRole: (r) => api.put('/auth/user/assign-role', { role: r }),
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
  updateKyc:   (d) => api.post('/profile/kyc', d),
  updateBank:  (d) => api.post('/profile/bank', d),
};

export const messagesApi = {
  conversations: ()               => api.get('/messages/conversations'),
  history:       (jobId, uid)     => api.get(`/messages/${jobId}/${uid}`),
  send:          (d)              => api.post('/messages', d),
};

export const notificationsApi = {
  getAll:      () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
  markOneRead: (id) => api.put(`/notifications/${id}/read`),
};

export const walletApi = {
  balance:      ()  => api.get('/wallet/balance'),
  withdraw:     (d) => api.post('/wallet/withdraw', d),
  verifyPin:    (d) => api.post('/wallet/verify-pin', d),
  transactions: (p) => api.get('/payments/transactions', { params: p }),
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
  sendOtp:   (f) => api.post('/kyc/send-otp', f, { headers: { 'Content-Type': 'multipart/form-data' } }),
  verifyOtp: (d) => api.post('/kyc/verify-otp', d),
  addPan:    (f) => api.post('/kyc/pan', f, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addBank:   (d) => api.post('/kyc/bank', d),
};

export const reviewsApi = {
  add:     (d)      => api.post('/reviews', d),
  getUser: (userId) => api.get(`/reviews/${userId}`),
};