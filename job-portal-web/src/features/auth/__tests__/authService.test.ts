import { login, signup, logout, requestPasswordReset } from '../services/authService';
import type { LoginPayload, SignupPayload } from '../types';

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword:     jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut:                        jest.fn(),
  sendPasswordResetEmail:         jest.fn(),
  onAuthStateChanged:             jest.fn(),
  updateProfile:                  jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc:             jest.fn(),
  getDoc:          jest.fn(),
  setDoc:          jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TS'),
}));

jest.mock('../../../shared/services/firebaseService', () => ({ auth: {}, db: {} }));

const firebaseAuth      = jest.requireMock('firebase/auth');
const firebaseFirestore = jest.requireMock('firebase/firestore');

beforeEach(() => jest.clearAllMocks());

const mockProfileDoc = {
  exists: () => true,
  data:   () => ({ email: 'a@b.com', displayName: 'Alice', role: 'job_seeker', location: 'NYC' }),
};

describe('login', () => {
  it('returns AuthUser on success', async () => {
    firebaseAuth.signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'u1' } });
    firebaseFirestore.getDoc.mockResolvedValueOnce(mockProfileDoc);

    const user = await login({ email: 'a@b.com', password: 'pass123' } as LoginPayload);
    expect(user.uid).toBe('u1');
    expect(user.email).toBe('a@b.com');
    expect(user.role).toBe('job_seeker');
  });

  it('throws when the user profile document is not found', async () => {
    firebaseAuth.signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'u1' } });
    firebaseFirestore.getDoc.mockResolvedValueOnce({ exists: () => false });
    await expect(login({ email: 'a@b.com', password: 'pass' } as LoginPayload)).rejects.toThrow('not found');
  });

  it('propagates Firebase auth errors', async () => {
    firebaseAuth.signInWithEmailAndPassword.mockRejectedValueOnce(new Error('wrong-password'));
    await expect(login({ email: 'a@b.com', password: 'bad' } as LoginPayload)).rejects.toThrow('wrong-password');
  });
});

describe('signup', () => {
  it('creates a Firestore profile and returns AuthUser', async () => {
    firebaseAuth.createUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'u2' } });
    firebaseFirestore.setDoc.mockResolvedValueOnce(undefined);

    const payload: SignupPayload = { email: 'b@c.com', password: 'pass123', name: 'Bob', role: 'employer', location: 'LA' };
    const user = await signup(payload);
    expect(user.uid).toBe('u2');
    expect(user.role).toBe('employer');
    expect(firebaseFirestore.setDoc).toHaveBeenCalledTimes(1);
  });
});

describe('logout', () => {
  it('calls Firebase signOut', async () => {
    firebaseAuth.signOut.mockResolvedValueOnce(undefined);
    await logout();
    expect(firebaseAuth.signOut).toHaveBeenCalledTimes(1);
  });
});

describe('requestPasswordReset', () => {
  it('calls sendPasswordResetEmail with the provided address', async () => {
    firebaseAuth.sendPasswordResetEmail.mockResolvedValueOnce(undefined);
    await requestPasswordReset('a@b.com');
    expect(firebaseAuth.sendPasswordResetEmail).toHaveBeenCalledWith({}, 'a@b.com');
  });
});
