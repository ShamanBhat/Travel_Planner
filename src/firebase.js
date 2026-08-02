import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  enableMultiTabIndexedDbPersistence,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

let persistenceEnabled = false;

async function enableOfflinePersistence() {
  if (persistenceEnabled) return;

  try {
    await enableMultiTabIndexedDbPersistence(db);
    persistenceEnabled = true;
    console.info('[Firebase] Multi-tab offline persistence enabled');
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn('[Firebase] Multi-tab persistence unavailable, falling back to single-tab');
      try {
        await enableIndexedDbPersistence(db);
        persistenceEnabled = true;
        console.info('[Firebase] Single-tab offline persistence enabled');
      } catch (fallbackErr) {
        console.warn('[Firebase] Offline persistence failed:', fallbackErr.message);
      }
    } else if (err.code === 'unimplemented') {
      console.warn('[Firebase] Offline persistence not supported in this browser');
    } else {
      console.warn('[Firebase] Persistence error:', err.message);
    }
  }
}

enableOfflinePersistence();

export default app;
