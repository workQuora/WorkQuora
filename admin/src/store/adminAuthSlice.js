import { createSlice } from '@reduxjs/toolkit';

const stored = JSON.parse(localStorage.getItem('adminAuth') || 'null');

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState: {
    admin: stored?.admin || null,
    accessToken: stored?.accessToken || null,
    refreshToken: stored?.refreshToken || null,
    isAuthenticated: !!stored?.accessToken,
  },
  reducers: {
    adminLoginSuccess(state, action) {
      const { admin, accessToken, refreshToken } = action.payload;
      state.admin = admin;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      localStorage.setItem('adminAuth', JSON.stringify({ admin, accessToken, refreshToken }));
    },
    adminLogout(state) {
      state.admin = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('adminAuth');
    },
    updateAdminProfile(state, action) {
      state.admin = { ...state.admin, ...action.payload };
      const stored = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      localStorage.setItem('adminAuth', JSON.stringify({ ...stored, admin: state.admin }));
    },
  },
});

export const { adminLoginSuccess, adminLogout, updateAdminProfile } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
