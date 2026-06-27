import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosClient';

export const fetchClientProfile = createAsyncThunk('client/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/client/profile');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch client profile');
  }
});

export const createNewJob = createAsyncThunk('client/createJob', async (jobData, { rejectWithValue }) => {
  try {
    const res = await api.post('/jobs/create', jobData);
    return res.data.job;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Job creation failed');
  }
});

export const fetchClientJobs = createAsyncThunk('client/fetchJobs', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/jobs/my-jobs');
    return res.data.jobs;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch jobs');
  }
});

export const triggerClientPayment = createAsyncThunk('client/processPayment', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/payments/create-escrow', payload);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Payment failed');
  }
});

const initialState = {
  details: { name: '', company: '', avatar: '', walletBalance: 0, currentLocation: { lat: null, lng: null, city: '' } },
  postedJobs: [],
  selectedFreelancer: null,
  paymentHistory: [],
  isLoading: false,
  error: null,
};

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    updateLocalClientLocation: (state, action) => { state.details.currentLocation = action.payload; },
    clearClientState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientProfile.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchClientProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.details = { ...state.details, ...action.payload.clientData };
      })
      .addCase(fetchClientProfile.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createNewJob.pending, (state) => { state.isLoading = true; })
      .addCase(createNewJob.fulfilled, (state, action) => { state.isLoading = false; state.postedJobs.unshift(action.payload); })
      .addCase(createNewJob.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchClientJobs.fulfilled, (state, action) => { state.postedJobs = action.payload; })
      .addCase(triggerClientPayment.fulfilled, (state, action) => {
        state.details.walletBalance = action.payload.newWalletBalance;
        state.paymentHistory.unshift({ transactionId: action.payload.transactionId, status: 'Escrow_Locked', timestamp: new Date().toISOString() });
      });
  },
});

export const { updateLocalClientLocation, clearClientState } = clientSlice.actions;
export default clientSlice.reducer;