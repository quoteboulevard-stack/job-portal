const useEmulator = process.env.REACT_APP_USE_EMULATOR === 'true';

export const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY            ?? '',
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN        ?? '',
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID         ?? '',
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET     ?? '',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.REACT_APP_FIREBASE_APP_ID             ?? '',
};

export const emulatorConfig = {
  enabled:   useEmulator,
  authHost:  'http://localhost:9099',
  firestoreHost: 'localhost',
  firestorePort: 8080,
  functionsHost: 'localhost',
  functionsPort: 5001,
  storageHost: 'localhost',
  storagePort: 9199,
};
