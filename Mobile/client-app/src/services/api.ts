import axios from 'axios';
import { store } from '../store';
import { logoutUserSession } from '../store/authSlice';

import { Platform } from 'react-native';

const getBaseURL = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    return `http://${window.location.hostname}:3000/api/v1`;
  }
  // Changed to your laptop's hotspot IP address automatically
  return 'http://10.40.94.74:3000/api/v1';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await store.dispatch(logoutUserSession());
    }
    return Promise.reject(error);
  }
);

export const setBaseURL = (url: string) => {
  api.defaults.baseURL = url;
};

export const getApiData = (res: any) => res?.data?.data ?? res?.data ?? null;
export default api;
