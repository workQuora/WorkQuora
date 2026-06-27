
import axios from 'axios';
import { store } from '../redux/store';
import { logout } from '../actions/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach JWT ────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: auto-logout on 401 ──────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

/**
 * Safely unwrap backend response.
 * Supports: { success, data } OR { success, user, token } shapes
 */
export const getApiData = (response) => response?.data?.data ?? response?.data ?? null;

export const getAuthPayload = (response) => ({
  user: response?.data?.user ?? response?.data?.data?.user,
  token: response?.data?.token ?? response?.data?.data?.token,
});

export default api;
