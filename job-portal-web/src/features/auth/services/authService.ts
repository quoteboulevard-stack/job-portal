import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../shared/services/firebaseService';
import type { AuthUser, LoginPayload, SignupPayload } from '../types';

async function fetchUserProfile(uid: string): Promise<AuthUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    uid,
    email:    d.email    ?? '',
    name:     d.displayName ?? '',
    role:     d.role     ?? 'job_seeker',
    location: d.location ?? '',
  };
}

export async function login({ email, password }: LoginPayload): Promise<AuthUser> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const profile = await fetchUserProfile(user.uid);
  if (!profile) throw new Error('User profile not found.');
  return profile;
}

export async function signup({ email, password, name, role, location }: SignupPayload): Promise<AuthUser> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await setDoc(doc(db, 'users', user.uid), {
      email,
      displayName: name,
      role,
      location,
      balance:    0,
      totalAdded: 0,
      createdAt:  serverTimestamp(),
      updatedAt:  serverTimestamp(),
    });
  } catch (err) {
    // Roll back the Firebase Auth account so the user is not left in a state
    // where they exist in Auth but have no Firestore profile and can never log in.
    await user.delete();
    throw err;
  }
  return { uid: user.uid, email, name, role, location };
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function updateUserProfile(payload: {
  uid: string;
  name: string;
  location: string;
  title?: string;
}): Promise<void> {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: payload.name });
  }

  await setDoc(
    doc(db, "users", payload.uid),
    {
      displayName: payload.name,
      location: payload.location,
      title: payload.title ?? "",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function subscribeToAuthChanges(
  callback: (user: AuthUser | null) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (!firebaseUser) { callback(null); return; }
    const profile = await fetchUserProfile(firebaseUser.uid);
    callback(profile);
  });
}
