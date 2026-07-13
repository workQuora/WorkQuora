import { configureStore } from '@reduxjs/toolkit';
import adminAuthReducer from './adminAuthSlice';

export const store = configureStore({
  reducer: {
    adminAuth: adminAuthReducer,
  },
});
