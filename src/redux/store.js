import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './slices/productsSlice';
import wishlistReducer from './slices/wishlistSlice';
import ratesReducer from './slices/ratesSlice';
import uiReducer from './slices/uiSlice';
import adminReducer from './slices/adminSlice';
import bannersReducer from './slices/bannersSlice';
import banner2Reducer from './slices/banner2Slice';
import categoriesReducer from './slices/categoriesSlice';
import childCategoriesReducer from './slices/childCategoriesSlice';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    wishlist: wishlistReducer,
    rates: ratesReducer,
    ui: uiReducer,
    admin: adminReducer,
    banners: bannersReducer,
    banner2: banner2Reducer,
    categories: categoriesReducer,
    childCategories: childCategoriesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
