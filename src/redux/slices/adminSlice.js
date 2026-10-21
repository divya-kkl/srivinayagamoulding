import { createSlice } from '@reduxjs/toolkit';

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    session: null,
    loading: true,
    activeMenu: 'Dashboard',
    isProfileDropdownOpen: false,
  },
  reducers: {
    setAdminSession: (state, action) => {
      const wasLoggedOut = !state.session && !!action.payload;
      state.session = action.payload;
      state.loading = false;
      if (wasLoggedOut) {
        state.activeMenu = 'Dashboard';
      }
    },
    setAdminLoading: (state, action) => {
      state.loading = action.payload;
    },
    setActiveMenu: (state, action) => {
      state.activeMenu = action.payload;
    },
    setIsProfileDropdownOpen: (state, action) => {
      state.isProfileDropdownOpen = action.payload;
    },
    toggleProfileDropdown: (state) => {
      state.isProfileDropdownOpen = !state.isProfileDropdownOpen;
    },
    logoutAdmin: (state) => {
      state.session = null;
      state.isProfileDropdownOpen = false;
      state.activeMenu = 'Dashboard';
    },
  },
});

export const {
  setAdminSession,
  setAdminLoading,
  setActiveMenu,
  setIsProfileDropdownOpen,
  toggleProfileDropdown,
  logoutAdmin,
} = adminSlice.actions;

export default adminSlice.reducer;
