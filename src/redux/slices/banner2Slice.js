import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getBanner2FromSupabase,
  deleteBanner2FromSupabase,
} from '../../services/banner2Service';

export const fetchBanner2 = createAsyncThunk(
  'banner2/fetchBanner2',
  async (activeOnly = false, { rejectWithValue }) => {
    try {
      const { data, error, tableMissing } = await getBanner2FromSupabase(activeOnly);
      if (tableMissing) {
        return rejectWithValue({ message: "The 'banner_2' table is missing in Supabase.", tableMissing: true });
      }
      if (error) return rejectWithValue({ message: error });
      return data || [];
    } catch (err) {
      return rejectWithValue({ message: err.message });
    }
  }
);

export const deleteBanner2 = createAsyncThunk(
  'banner2/deleteBanner2',
  async (dbId, { rejectWithValue }) => {
    try {
      const { success, error } = await deleteBanner2FromSupabase(dbId);
      if (!success) return rejectWithValue(error);
      return dbId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const banner2Slice = createSlice({
  name: 'banner2',
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
    setBanner2Items: (state, action) => {
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
      state.isFormOpen = true;
      state.editingBanner = action.payload || null;
      if (action.payload) {
        state.formData = {
          image: action.payload.image || '',
          status: action.payload.status || 'ACTIVE',
        };
      } else {
        state.formData = {
          image: '',
          status: 'ACTIVE',
        };
      }
    },
    closeForm: (state) => {
      state.isFormOpen = false;
      state.editingBanner = null;
      state.formData = {
        image: '',
        status: 'ACTIVE',
      };
    },
    setFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanner2.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBanner2.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchBanner2.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Error fetching banner 2';
      })
      .addCase(deleteBanner2.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.dbId !== action.payload);
      });
  },
});

export const {
  setBanner2Items,
  setIsLoading,
  setIsSaving,
  openForm,
  closeForm,
  setFormData,
} = banner2Slice.actions;

export default banner2Slice.reducer;
