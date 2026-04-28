import * as admin from 'firebase-admin';

let app: admin.app.App;

function getApp(): admin.app.App {
  if (!app) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!projectId) {
      throw new Error('Missing required environment variable: FIREBASE_PROJECT_ID');
    }

    if (admin.apps.length > 0) {
      app = admin.apps[0]!;
    } else if (process.env.FIRESTORE_EMULATOR_HOST) {
      // Running against the Firebase Emulator — no real credentials needed.
      app = admin.initializeApp({ projectId });
    } else {
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      if (!clientEmail || !privateKey) {
        throw new Error(
          'Missing required Firebase credentials: FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
        );
      }
      app = admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        storageBucket: storageBucket ?? `${projectId}.appspot.com`,
      });
    }
  }
  return app;
}

let firestoreInstance: admin.firestore.Firestore | undefined;

export function getFirestore(): admin.firestore.Firestore {
  if (!firestoreInstance) {
    firestoreInstance = getApp().firestore();
    try {
      firestoreInstance.settings({ ignoreUndefinedProperties: true });
    } catch {
      // settings() already applied on this Firestore instance (e.g. in test environments
      // where modules are re-imported but the underlying instance is shared)
    }
  }
  return firestoreInstance;
}

export function getAuth(): admin.auth.Auth {
  return getApp().auth();
}

export function getStorage(): admin.storage.Storage {
  return getApp().storage();
}

export const db = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    return getFirestore()[prop as keyof admin.firestore.Firestore];
  },
});

export const auth = new Proxy({} as admin.auth.Auth, {
  get(_target, prop) {
    return getAuth()[prop as keyof admin.auth.Auth];
  },
});

export const storage = new Proxy({} as admin.storage.Storage, {
  get(_target, prop) {
    return getStorage()[prop as keyof admin.storage.Storage];
  },
});

export { admin };
