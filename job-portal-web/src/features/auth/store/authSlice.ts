import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as authService from '../services/authService';
import type { AuthState, AuthUser, LoginPayload, SignupPayload } from '../types';

export const loginThunk = createAsyncThunk<AuthUser, LoginPayload>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try { return await authService.login(payload); }
    catch (e) { return rejectWithValue(e instanceof Error ? e.message : 'Login failed.'); }
  }
);

export const signupThunk = createAsyncThunk<AuthUser, SignupPayload>(
  'auth/signup',
  async (payload, { rejectWithValue }) => {
    try { return await authService.signup(payload); }
    catch (e) { return rejectWithValue(e instanceof Error ? e.message : 'Signup failed.'); }
  }
);

export const logoutThunk = createAsyncThunk<void, void>(
  'auth/logout',
  async () => { await authService.logout(); }
);

const initialState: AuthState = { user: null, loading: true, error: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user    = action.payload;
      state.loading = false;
      state.error   = null;
    },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending  = (state: AuthState) => { state.loading = true;  state.error = null; };
    const rejected = (state: AuthState, action: any) => {
      state.loading = false;
      state.error   = action.payload as string ?? 'Something went wrong.';
    };
    builder
      .addCase(loginThunk.pending,   pending)
      .addCase(loginThunk.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(loginThunk.rejected,  rejected)
      .addCase(signupThunk.pending,   pending)
      .addCase(signupThunk.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(signupThunk.rejected,  rejected)
      .addCase(logoutThunk.fulfilled, (state) => { state.user = null; state.loading = false; });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
