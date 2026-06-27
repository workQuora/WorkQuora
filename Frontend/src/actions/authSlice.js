import { createSlice } from '@reduxjs/toolkit';

const TOKEN_KEY = 'lw_token';

const getInitialState = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem('lw_user') || 'null');
    return { user, token, role: user?.role || null, isAuthenticated: !!token && !!user };
  } catch {
    return { user: null, token: null, role: null, isAuthenticated: false };
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    loginSuccess(state, action) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.role = user.role;
      state.isAuthenticated = true;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem('lw_user', JSON.stringify(user));
    },
    updateRole(state, action) {
      const role = action.payload.toUpperCase();
      state.role = role;
      if (state.user) {
        state.user.role = role;
        localStorage.setItem('lw_user', JSON.stringify(state.user));
      }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('lw_user');
    },
  },
});

export const { loginSuccess, updateRole, logout } = authSlice.actions;
export default authSlice.reducer;