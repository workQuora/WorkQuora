import axios from 'axios';
import { store } from '../redux/store';
 import { logout } from '../actions/authSlice'; 

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export const getApiData = (res) => res?.data?.data ?? res?.data ?? null;
export const getAuthPayload = (res) => ({
  user: res?.data?.user ?? res?.data?.data?.user,
  token: res?.data?.token ?? res?.data?.data?.token,
});

export default api;