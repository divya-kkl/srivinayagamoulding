import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getCategoriesFromSupabase,
  deleteCategoryInSupabase,
} from '../../services/categoryService';

export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (activeOnly = false, { rejectWithValue }) => {
    try {
      const { data, error } = await getCategoriesFromSupabase(activeOnly);
      if (error) return rejectWithValue(error);
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async ({ dbId }, { rejectWithValue }) => {
    try {
      const res = await deleteCategoryInSupabase(dbId);
      if (!res.success) {
        return rejectWithValue(res.error || 'Failed to delete category');
      }
      return dbId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    isLoading: false,
    isSaving: false,
    searchQuery: '',
    isFormOpen: false,
    editingCategory: null,
    formData: {
      name: '',
      description: '',
      image: '',
      status: 'ACTIVE',
    },
    error: null,
  },
  reducers: {
    setCategories: (state, action) => {
      state.items = action.payload;
      state.isLoading = false;
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setIsSaving: (state, action) => {
      state.isSaving = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    openForm: (state, action) => {
      const cat = action.payload || null;
      state.editingCategory = cat;
      state.formData = cat
        ? {
            name: cat.name || '',
            description: cat.description || '',
            image: cat.image || '',
            status: cat.status || 'ACTIVE',
          }
        : {
            name: '',
            description: '',
            image: '',
            status: 'ACTIVE',
          };
      state.isFormOpen = true;
    },
    closeForm: (state) => {
      state.isFormOpen = false;
      state.editingCategory = null;
      state.formData = {
        name: '',
        description: '',
        image: '',
        status: 'ACTIVE',
      };
      state.isSaving = false;
    },
    setFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.dbId !== action.payload);
      });
  },
});

export const {
  setCategories,
  setIsLoading,
  setIsSaving,
  setSearchQuery,
  openForm,
  closeForm,
  setFormData,
} = categoriesSlice.actions;

export default categoriesSlice.reducer;
