import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { subscribeToAuthChanges } from '../services/authService';
import { setUser, clearError, loginThunk, signupThunk, logoutThunk } from '../store/authSlice';
import type { RootState, AppDispatch } from '../../../store';
import type { LoginPayload, SignupPayload } from '../types';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading, error } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u) => dispatch(setUser(u)));
    return unsubscribe;
  }, [dispatch]);

  return {
    user,
    loading,
    error,
    login:      (p: LoginPayload)  => dispatch(loginThunk(p)),
    signup:     (p: SignupPayload) => dispatch(signupThunk(p)),
    logout:     ()                 => dispatch(logoutThunk()),
    clearError: ()                 => dispatch(clearError()),
  };
}
