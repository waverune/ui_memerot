import { configureStore } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from '../utils/store.types';
import authReducer from './feature/auth/authSlice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type { RootState, AppDispatch };