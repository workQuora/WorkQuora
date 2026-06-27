import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosClient';

export const fetchFreelancerProfile = createAsyncThunk('freelancer/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/freelancer/profile');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
  }
});

export const fetchNearbyJobs = createAsyncThunk('freelancer/fetchNearbyJobs', async ({ lat, lng, radiusKm }, { rejectWithValue }) => {
  try {
    const res = await api.get('/geo/nearby-jobs', { params: { lat, lng, radius: radiusKm } });
    return res.data.jobs;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch nearby jobs');
  }
});

export const fetchFreelancerEarnings = createAsyncThunk('freelancer/fetchEarnings', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/analytics/freelancer-revenue');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch earnings');
  }
});

const initialState = {
  profile: { skills: [], rating: 0, reviewsCount: 0 },
  radar: { radiusKm: 15, jobsFeed: [], filters: { keyword: '', category: 'All', minBudget: 0 } },
  finance: { totalEarnings: 0, thisMonthEarnings: 0, recentTransactions: [], earningsByDistance: [] },
  savedJobs: [],
  isLoading: false,
  error: null,
};

const freelancerSlice = createSlice({
  name: 'freelancer',
  initialState,
  reducers: {
    setDiscoveryRadius: (state, action) => { state.radar.radiusKm = action.payload; },
    setRadarFilters: (state, action) => { state.radar.filters = { ...state.radar.filters, ...action.payload }; },
    toggleSaveLocalJob: (state, action) => {
      const idx = state.savedJobs.indexOf(action.payload);
      if (idx >= 0) state.savedJobs.splice(idx, 1);
      else state.savedJobs.push(action.payload);
    },
    clearFreelancerState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNearbyJobs.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchNearbyJobs.fulfilled, (state, action) => { state.isLoading = false; state.radar.jobsFeed = action.payload; })
      .addCase(fetchNearbyJobs.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchFreelancerProfile.fulfilled, (state, action) => { state.profile = action.payload.profile; })
      .addCase(fetchFreelancerEarnings.fulfilled, (state, action) => {
        state.finance.totalEarnings = action.payload.totalEarnings;
        state.finance.thisMonthEarnings = action.payload.thisMonth;
        state.finance.recentTransactions = action.payload.transactions || [];
        state.finance.earningsByDistance = action.payload.distanceMetrics || [];
      });
  },
});

export const { setDiscoveryRadius, setRadarFilters, toggleSaveLocalJob, clearFreelancerState } = freelancerSlice.actions;
export default freelancerSlice.reducer;