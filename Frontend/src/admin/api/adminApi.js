import axios from 'axios';

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.replace('/api/v1', '/api/admin') || 'http://localhost:5000/api/admin',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach admin token to every request
adminApi.interceptors.request.use((config) => {
  const adminData = localStorage.getItem('adminAuth');
  if (adminData) {
    const { accessToken } = JSON.parse(adminData);
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Auto-refresh on 401 TOKEN_EXPIRED
adminApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const adminData = JSON.parse(localStorage.getItem('adminAuth') || '{}');
        const res = await axios.post(
          `${adminApi.defaults.baseURL}/auth/refresh-token`,
          { refreshToken: adminData.refreshToken },
          { withCredentials: true }
        );
        const newToken = res.data.accessToken;
        localStorage.setItem('adminAuth', JSON.stringify({ ...adminData, accessToken: newToken }));
        original.headers.Authorization = `Bearer ${newToken}`;
        return adminApi(original);
      } catch {
        localStorage.removeItem('adminAuth');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;
