import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    activeCategory: 'all',
    searchQuery: '',
    isCalculatorOpen: false,
    quickViewProduct: null,
  },
  reducers: {
    setActiveCategory: (state, action) => {
      state.activeCategory = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setIsCalculatorOpen: (state, action) => {
      state.isCalculatorOpen = action.payload;
    },
    setQuickViewProduct: (state, action) => {
      state.quickViewProduct = action.payload;
    },
  },
});

export const {
  setActiveCategory,
  setSearchQuery,
  setIsCalculatorOpen,
  setQuickViewProduct,
} = uiSlice.actions;

export default uiSlice.reducer;
