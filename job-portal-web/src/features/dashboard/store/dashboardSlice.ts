import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { EmployerDashboardData, JobSeekerDashboardData } from '../types';

interface DashboardState {
  jobSeeker: JobSeekerDashboardData | null;
  employer:  EmployerDashboardData  | null;
  loading:   boolean;
  error:     string | null;
}

const initialState: DashboardState = {
  jobSeeker: null,
  employer:  null,
  loading:   false,
  error:     null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setJobSeekerData(state, action: PayloadAction<JobSeekerDashboardData>) { state.jobSeeker = action.payload; },
    setEmployerData(state, action: PayloadAction<EmployerDashboardData>)   { state.employer  = action.payload; },
    setLoading(state, action: PayloadAction<boolean>)                      { state.loading   = action.payload; },
    setError(state, action: PayloadAction<string | null>)                  { state.error     = action.payload; },
  },
});

export const { setJobSeekerData, setEmployerData, setLoading, setError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
