import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { JobRecord } from '../types';

interface JobsState {
  list:    JobRecord[];
  loading: boolean;
  error:   string | null;
}

const initialState: JobsState = { list: [], loading: false, error: null };

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobs(state, action: PayloadAction<JobRecord[]>)     { state.list    = action.payload; },
    setLoading(state, action: PayloadAction<boolean>)      { state.loading = action.payload; },
    setError(state, action: PayloadAction<string | null>)  { state.error   = action.payload; },
    clearJobs(state)                                        { state.list    = []; },
  },
});

export const { setJobs, setLoading, setError, clearJobs } = jobsSlice.actions;
export default jobsSlice.reducer;
