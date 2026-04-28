"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.storage = exports.auth = exports.db = void 0;
exports.getFirestore = getFirestore;
exports.getAuth = getAuth;
exports.getStorage = getStorage;
const admin = __importStar(require("firebase-admin"));
exports.admin = admin;
let app;
function getApp() {
    if (!app) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
        if (!projectId) {
            throw new Error('Missing required environment variable: FIREBASE_PROJECT_ID');
        }
        if (admin.apps.length > 0) {
            app = admin.apps[0];
        }
        else if (process.env.FIRESTORE_EMULATOR_HOST) {
            // Running against the Firebase Emulator — no real credentials needed.
            app = admin.initializeApp({ projectId });
        }
        else {
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
            if (!clientEmail || !privateKey) {
                throw new Error('Missing required Firebase credentials: FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
            }
            app = admin.initializeApp({
                credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
                storageBucket: storageBucket ?? `${projectId}.appspot.com`,
            });
        }
    }
    return app;
}
let firestoreInstance;
function getFirestore() {
    if (!firestoreInstance) {
        firestoreInstance = getApp().firestore();
        try {
            firestoreInstance.settings({ ignoreUndefinedProperties: true });
        }
        catch {
            // settings() already applied on this Firestore instance (e.g. in test environments
            // where modules are re-imported but the underlying instance is shared)
        }
    }
    return firestoreInstance;
}
function getAuth() {
    return getApp().auth();
}
function getStorage() {
    return getApp().storage();
}
exports.db = new Proxy({}, {
    get(_target, prop) {
        return getFirestore()[prop];
    },
});
exports.auth = new Proxy({}, {
    get(_target, prop) {
        return getAuth()[prop];
    },
});
exports.storage = new Proxy({}, {
    get(_target, prop) {
        return getStorage()[prop];
    },
});
//# sourceMappingURL=firebaseAdmin.js.map