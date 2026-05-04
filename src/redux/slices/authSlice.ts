import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppUser } from '../../types';

interface AuthState {
  user: AppUser | null;
  initializing: boolean;
}

const initialState: AuthState = {
  user: null,
  initializing: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AppUser | null>) => {
      state.user = action.payload;
      state.initializing = false;
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.initializing = action.payload;
    },
  },
});

export const { setUser, setInitializing } = authSlice.actions;
export default authSlice.reducer;
