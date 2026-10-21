import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getSubcategoriesFromSupabase,
  deleteSubcategoryInSupabase,
} from '../../services/subcategoryService';
import { getCategoriesFromSupabase } from '../../services/categoryService';

export const fetchChildCategoriesData = createAsyncThunk(
  'childCategories/fetchChildCategoriesData',
  async (_, { rejectWithValue }) => {
    try {
      const catRes = await getCategoriesFromSupabase(false);
      const subcatRes = await getSubcategoriesFromSupabase();

      const categories = catRes.data || [];
      const allSubcategories = subcatRes.data || [];
      const childCategories = allSubcategories.filter((s) => !!s.subcategoryId);

      return { categories, allSubcategories, childCategories };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteChildCategory = createAsyncThunk(
  'childCategories/deleteChildCategory',
  async ({ dbId }, { rejectWithValue }) => {
    try {
      const res = await deleteSubcategoryInSupabase(dbId);
      if (!res.success) {
        return rejectWithValue(res.error || 'Failed to delete child category');
      }
      return dbId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialFormState = {
  categoryId: '',
  subcategoryId: '',
  name: '',
  description: '',
  image: '',
  status: 'ACTIVE',
};

const childCategoriesSlice = createSlice({
  name: 'childCategories',
  initialState: {
    childCategories: [],
    allSubcategories: [],
    categories: [],
    searchQuery: '',
    selectedParentFilter: 'ALL',
    isLoading: false,
    isSaving: false,
    isFormOpen: false,
    editingChild: null,
    formData: initialFormState,
    error: null,
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSelectedParentFilter: (state, action) => {
      state.selectedParentFilter = action.payload;
    },
    setIsSaving: (state, action) => {
      state.isSaving = action.payload;
    },
    openForm: (state, action) => {
      const child = action.payload || null;
      state.editingChild = child;
      if (child) {
        state.formData = {
          categoryId: child.categoryId || (state.categories.length > 0 ? state.categories[0].dbId : ''),
          subcategoryId: child.subcategoryId || '',
          name: child.name || '',
          description: child.description || '',
          image: child.image || '',
          status: child.status || 'ACTIVE',
        };
      } else {
        const defaultCat = state.categories.length > 0 ? state.categories[0].dbId : '';
        const availableParents = state.allSubcategories.filter((p) => !defaultCat || p.categoryId === defaultCat);
        state.formData = {
          categoryId: defaultCat,
          subcategoryId: availableParents.length > 0 ? availableParents[0].dbId : '',
          name: '',
          description: '',
          image: '',
          status: 'ACTIVE',
        };
      }
      state.isFormOpen = true;
    },
    closeForm: (state) => {
      state.isFormOpen = false;
      state.editingChild = null;
      state.formData = initialFormState;
      state.isSaving = false;
    },
    setFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChildCategoriesData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChildCategoriesData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload.categories;
        state.allSubcategories = action.payload.allSubcategories;
        state.childCategories = action.payload.childCategories;
      })
      .addCase(fetchChildCategoriesData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteChildCategory.fulfilled, (state, action) => {
        state.childCategories = state.childCategories.filter((c) => c.dbId !== action.payload);
        state.allSubcategories = state.allSubcategories.filter((s) => s.dbId !== action.payload);
      });
  },
});

export const {
  setSearchQuery,
  setSelectedParentFilter,
  setIsSaving,
  openForm,
  closeForm,
  setFormData,
} = childCategoriesSlice.actions;

export default childCategoriesSlice.reducer;
