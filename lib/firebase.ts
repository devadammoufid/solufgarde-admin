import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  setPersistence, 
  browserLocalPersistence,
  connectAuthEmulator 
} from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug environment variables
console.log('🔥 Firebase Config Debug:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing',
});

// Required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
] as const;

// Validation function (called when needed, not during import)
export const validateFirebaseConfig = (): boolean => {
  try {
    const missing: string[] = [];
    
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      if (!value || value.trim() === '') {
        missing.push(envVar);
      }
    }

    if (missing.length > 0) {
      console.error('❌ Missing Firebase environment variables:', missing);
      console.error('Make sure your .env.local file has all required variables');
      return false;
    }
    
    console.log('✅ Firebase configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Firebase configuration validation failed:', error);
    return false;
  }
};

// Helper to check if Firebase config is complete
const isConfigComplete = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
};

// Initialize Firebase app (singleton pattern) with validation
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

const initializeFirebase = () => {
  try {
    // Only validate and initialize if we have the basic config
    if (!isConfigComplete()) {
      console.warn('⚠️ Firebase configuration incomplete. Some features may not work.');
      return;
    }

    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('🔥 Firebase app initialized');
    } else {
      app = getApps()[0];
      console.log('🔥 Firebase app already exists, reusing');
    }

    // Initialize Firebase services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Set persistence for authentication (client-side only)
    if (typeof window !== 'undefined') {
      setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.error('Failed to set auth persistence:', error);
      });
    }

    // Connect to emulators in development (optional)
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
      
      if (useEmulators) {
        try {
          // Only connect if not already connected
          if (!auth.config.emulator) {
            connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
          }
          
          // Only connect if not already connected
          if (!(db as any)._delegate._databaseId.projectId.includes('demo-')) {
            connectFirestoreEmulator(db, 'localhost', 8080);
          }
          
          // Only connect if not already connected
          if (!(storage as any)._delegate._host.includes('localhost')) {
            connectStorageEmulator(storage, 'localhost', 9199);
          }
          
          console.log('🔧 Using Firebase emulators');
        } catch (error) {
          // Emulator connection errors are non-fatal
          console.warn('Failed to connect to Firebase emulators:', error);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    return false;
  }
};

// Initialize Firebase on import, but don't throw errors
initializeFirebase();

// Export initialized services with getters that ensure initialization
export const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    if (!initializeFirebase()) {
      throw new Error('Firebase failed to initialize. Check your configuration.');
    }
  }
  return app;
};

export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    getFirebaseApp(); // This will initialize if needed
  }
  return auth;
};

export const getFirebaseFirestore = (): Firestore => {
  if (!db) {
    getFirebaseApp(); // This will initialize if needed
  }
  return db;
};

export const getFirebaseStorage = (): FirebaseStorage => {
  if (!storage) {
    getFirebaseApp(); // This will initialize if needed
  }
  return storage;
};

// Export direct references (will be undefined if init failed)
export { app, auth, db, storage };
export default app;

// Firebase error handling utility
export const handleFirebaseError = (error: any): string => {
  const errorCode = error?.code || 'unknown-error';
  
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'No user found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/requires-recent-login': 'Please log in again to perform this action.',
    'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
    'auth/configuration-not-found': 'Firebase configuration not found. Please check your environment variables.',
    'auth/invalid-api-key': 'Invalid Firebase API key. Please check your configuration.',
    'auth/app-not-authorized': 'This app is not authorized to use Firebase Authentication.',
  };

  return errorMessages[errorCode] || `An unexpected error occurred: ${error?.message || 'Unknown error'}`;
};

// Helper to check if Firebase is ready
export const isFirebaseReady = (): boolean => {
  return Boolean(app && auth && db && storage);
};

// Helper to check if we're in a browser environment
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

// Helper to get Firebase config status
export const getFirebaseStatus = () => {
  return {
    isConfigured: isConfigComplete(),
    isInitialized: Boolean(app),
    isReady: isFirebaseReady(),
    isBrowser: isBrowser(),
    config: {
      hasApiKey: Boolean(firebaseConfig.apiKey),
      hasAuthDomain: Boolean(firebaseConfig.authDomain),
      hasProjectId: Boolean(firebaseConfig.projectId),
      hasStorageBucket: Boolean(firebaseConfig.storageBucket),
      hasMessagingSenderId: Boolean(firebaseConfig.messagingSenderId),
      hasAppId: Boolean(firebaseConfig.appId),
    }
  };
};

// Development helper to diagnose Firebase setup issues
if (process.env.NODE_ENV === 'development') {
  // Add a global helper for debugging
  if (typeof window !== 'undefined') {
    (window as any).debugFirebase = () => {
      console.log('🔍 Firebase Debug Info:', getFirebaseStatus());
      console.log('🔍 Environment Variables:', {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
      });
    };
  }
}