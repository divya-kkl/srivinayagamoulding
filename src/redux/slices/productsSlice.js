import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getProductsFromSupabase } from '../../services/productService';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (activeOnly = true, { rejectWithValue }) => {
    try {
      const { data, error } = await getProductsFromSupabase(activeOnly);
      if (error) return rejectWithValue(error);
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    currentProduct: null,
    activeImage: '',
    isLoading: false,
    error: null,
  },
  reducers: {
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
      if (action.payload) {
        state.activeImage = action.payload.image || (action.payload.images && action.payload.images[0]) || '';
      } else {
        state.activeImage = '';
      }
    },
    setActiveImage: (state, action) => {
      state.activeImage = action.payload;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.activeImage = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentProduct, setActiveImage, clearCurrentProduct } = productsSlice.actions;
export default productsSlice.reducer;
