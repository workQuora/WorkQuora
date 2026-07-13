import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../actions/authSlice';
import clientReducer from '../actions/clientSlice';
import freelancerReducer from '../actions/freelancerSlice';

export  const store = configureStore({
  reducer: {
    auth: authReducer,
    client: clientReducer,
    freelancer: freelancerReducer,
  },
});