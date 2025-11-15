// lib/store/store.ts
'use client';

import { configureStore } from '@reduxjs/toolkit';
import coreReducer from './coreSlice';

export const store = configureStore({
  reducer: {
    core: coreReducer,
  },
});

// Inference helpers
export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
