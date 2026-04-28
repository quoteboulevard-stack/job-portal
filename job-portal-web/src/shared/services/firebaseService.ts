import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig, emulatorConfig } from '../constants/config';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

if (emulatorConfig.enabled) {
  connectAuthEmulator(auth, emulatorConfig.authHost, { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorConfig.firestoreHost, emulatorConfig.firestorePort);
  connectFunctionsEmulator(functions, emulatorConfig.functionsHost, emulatorConfig.functionsPort);
  connectStorageEmulator(storage, emulatorConfig.storageHost, emulatorConfig.storagePort);
}
