import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'lw_token';
const USER_KEY = 'lw_user';

export interface User {
  _id: string;
  name: string;
  email: string;
  username?: string;
  mobileNumber?: string;
  role: 'CLIENT' | 'FREELANCER';
  gender?: string;
  avatar?: string;
  isVerified?: boolean;
  isMobileVerified?: boolean;
  kycVerified?: boolean;
  location?: {
    type?: string;
    coordinates?: number[];
    address?: string;
    city?: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  role: 'CLIENT' | 'FREELANCER' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
};

// Async thunk to restore token on app start
export const restoreToken = createAsyncThunk('auth/restoreToken', async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const userJson = await AsyncStorage.getItem(USER_KEY);
    const user = userJson ? JSON.parse(userJson) : null;
    return { token, user };
  } catch (e) {
    return { token: null, user: null };
  }
});

// Async thunk to log in
export const loginUserSession = createAsyncThunk(
  'auth/loginSession',
  async (payload: { user: User; token: string }) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, payload.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(payload.user));
      return payload;
    } catch (e) {
      console.error('Failed to save login session:', e);
      throw e;
    }
  }
);

// Async thunk to log out
export const logoutUserSession = createAsyncThunk('auth/logoutSession', async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error('Failed to remove login session:', e);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    updateRole(state, action) {
      const role = action.payload.toUpperCase() as 'CLIENT' | 'FREELANCER';
      state.role = role;
      if (state.user) {
        state.user.role = role;
        AsyncStorage.setItem(USER_KEY, JSON.stringify(state.user)).catch(e =>
          console.error('Failed to update role in storage:', e)
        );
      }
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload } as User;
      AsyncStorage.setItem(USER_KEY, JSON.stringify(state.user)).catch(e =>
        console.error('Failed to update user in storage:', e)
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreToken.fulfilled, (state, action) => {
        const { token, user } = action.payload;
        state.token = token;
        state.user = user;
        state.role = user?.role || null;
        state.isAuthenticated = !!token && !!user;
        state.isLoading = false;
      })
      .addCase(restoreToken.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(loginUserSession.fulfilled, (state, action) => {
        const { token, user } = action.payload;
        state.token = token;
        state.user = user;
        state.role = user.role;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(logoutUserSession.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.role = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { updateRole, updateUser } = authSlice.actions;
export default authSlice.reducer;
