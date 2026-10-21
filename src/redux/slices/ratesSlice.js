import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getRatesFromSupabase } from '../../services/rateService';

export const fetchLiveRates = createAsyncThunk(
  'rates/fetchLiveRates',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await getRatesFromSupabase();
      if (error) return rejectWithValue(error);
      return (data || []).filter((r) => r.isCurrent);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const ratesSlice = createSlice({
  name: 'rates',
  initialState: {
    liveRates: [],
    isLoading: true,
    error: null,
  },
  reducers: {
    setLiveRates: (state, action) => {
      state.liveRates = action.payload;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLiveRates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLiveRates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.liveRates = action.payload;
      })
      .addCase(fetchLiveRates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setLiveRates } = ratesSlice.actions;
export default ratesSlice.reducer;
