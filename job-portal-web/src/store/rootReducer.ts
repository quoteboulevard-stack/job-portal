import { combineReducers } from '@reduxjs/toolkit';
import authReducer         from '../features/auth/store/authSlice';
import jobsReducer         from '../features/jobs/store/jobsSlice';
import messagesReducer     from '../features/messages/store/messagesSlice';
import applicationsReducer from '../features/applications/store/applicationsSlice';
import creditsReducer      from '../features/credits/store/creditsSlice';
import dashboardReducer    from '../features/dashboard/store/dashboardSlice';

const rootReducer = combineReducers({
  auth:         authReducer,
  jobs:         jobsReducer,
  messages:     messagesReducer,
  applications: applicationsReducer,
  credits:      creditsReducer,
  dashboard:    dashboardReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
