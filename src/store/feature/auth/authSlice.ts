import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../utils/store.types';
import type { AuthState } from '../../../utils/Modal';

const initialState: AuthState = {
  isAuthSidebarOpen: false,
  authMode: 'signin',
};

export const authSlice = createSlice({
  name: 'authSlice',
  initialState,
  reducers: {
    openAuthSidebar: (state, action: PayloadAction<'signin' | 'signup'>) => {
      state.isAuthSidebarOpen = true;
      state.authMode = action.payload;
    },
    closeAuthSidebar: (state) => {
      state.isAuthSidebarOpen = false;
    },
    setAuthMode: (state, action: PayloadAction<'signin' | 'signup'>) => {
      state.authMode = action.payload;
    }
  },
});

export const { openAuthSidebar, closeAuthSidebar, setAuthMode } = authSlice.actions;
export const selectAuth = (state: RootState) => state.auth;
export default authSlice.reducer;
