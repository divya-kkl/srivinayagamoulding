import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getBannersFromSupabase,
  deleteBannerInSupabase,
} from '../../services/bannerService';

export const fetchBanners = createAsyncThunk(
  'banners/fetchBanners',
  async (activeOnly = false, { rejectWithValue }) => {
    try {
      const { data, error, tableMissing } = await getBannersFromSupabase(activeOnly);
      if (tableMissing) {
        return rejectWithValue({ message: "The 'banners' table is missing in Supabase.", tableMissing: true });
      }
      if (error) return rejectWithValue({ message: error });
      return data || [];
    } catch (err) {
      return rejectWithValue({ message: err.message });
    }
  }
);

export const deleteBanner = createAsyncThunk(
  'banners/deleteBanner',
  async (dbId, { rejectWithValue }) => {
    try {
      const { success, error } = await deleteBannerInSupabase(dbId);
      if (!success) return rejectWithValue(error);
      return dbId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const bannersSlice = createSlice({
  name: 'banners',
  initialState: {
    items: [],
    isLoading: false,
    isSaving: false,
    isFormOpen: false,
    editingBanner: null,
    formData: {
      image: '',
      status: 'ACTIVE',
    },
    error: null,
  },
  reducers: {
    setBanners: (state, action) => {
      state.items = action.payload;
      state.isLoading = false;
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setIsSaving: (state, action) => {
      state.isSaving = action.payload;
    },
    openForm: (state, action) => {
      const banner = action.payload || null;
      state.editingBanner = banner;
      state.formData = banner
        ? { image: banner.image, status: banner.status }
        : { image: '', status: 'ACTIVE' };
      state.isFormOpen = true;
    },
    closeForm: (state) => {
      state.isFormOpen = false;
      state.editingBanner = null;
      state.formData = { image: '', status: 'ACTIVE' };
      state.isSaving = false;
    },
    setFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Error fetching banners';
      })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.dbId !== action.payload);
      });
  },
});

export const {
  setBanners,
  setIsLoading,
  setIsSaving,
  openForm,
  closeForm,
  setFormData,
} = bannersSlice.actions;

export default bannersSlice.reducer;
