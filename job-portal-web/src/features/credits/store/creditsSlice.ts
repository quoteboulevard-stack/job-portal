import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CreditPackageRecord, CreditSummary } from '../types';

interface CreditsState {
  summary:  CreditSummary | null;
  packages: CreditPackageRecord[];
  loading:  boolean;
  error:    string | null;
}

const initialState: CreditsState = {
  summary:  null,
  packages: [],
  loading:  false,
  error:    null,
};

const creditsSlice = createSlice({
  name: 'credits',
  initialState,
  reducers: {
    setSummary(state, action: PayloadAction<CreditSummary>)            { state.summary  = action.payload; },
    setPackages(state, action: PayloadAction<CreditPackageRecord[]>)   { state.packages = action.payload; },
    setLoading(state, action: PayloadAction<boolean>)                  { state.loading  = action.payload; },
    setError(state, action: PayloadAction<string | null>)              { state.error    = action.payload; },
  },
});

export const { setSummary, setPackages, setLoading, setError } = creditsSlice.actions;
export default creditsSlice.reducer;
