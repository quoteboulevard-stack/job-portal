import { FirebaseError } from 'firebase/app';

export function parseError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':    return 'Invalid email or password.';
      case 'auth/email-already-in-use':  return 'An account with this email already exists.';
      case 'auth/too-many-requests':     return 'Too many attempts. Please try again later.';
      case 'auth/network-request-failed':return 'Network error. Check your connection.';
      case 'auth/weak-password':         return 'Password must be at least 6 characters.';
      case 'permission-denied':          return 'You do not have permission to do that.';
      case 'not-found':                  return 'The requested resource was not found.';
      case 'unavailable':                return 'Service is temporarily unavailable. Try again shortly.';
      default:                           return err.message;
    }
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
}
