import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ApplicationRecord } from '../types';

interface ApplicationsState {
  list:    ApplicationRecord[];
  loading: boolean;
  error:   string | null;
}

const initialState: ApplicationsState = { list: [], loading: false, error: null };

const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    setApplications(state, action: PayloadAction<ApplicationRecord[]>) { state.list    = action.payload; },
    setLoading(state, action: PayloadAction<boolean>)                  { state.loading = action.payload; },
    setError(state, action: PayloadAction<string | null>)              { state.error   = action.payload; },
  },
});

export const { setApplications, setLoading, setError } = applicationsSlice.actions;
export default applicationsSlice.reducer;
