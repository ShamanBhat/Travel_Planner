// src/firebase.js
// Firebase Web SDK v10+ initialization.
// - Auth: Email/Password + Google.
// - Firestore: offline persistence enabled (multi-tab IndexedDB cache) so trip
//   data can be viewed/edited while offline (e.g. on a trek with no signal) and
//   synced automatically once connectivity returns. This also lets repeat reads
//   of the same documents come from the local cache, reducing billed reads.
// - Storage: for boarding pass uploads (images/PDFs) and cover photos.
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
// Always show the account chooser instead of auto-selecting the last used account.
googleProvider.setCustomParameters({ prompt: 'select_account' })

export const db = getFirestore(app)
export const storage = getStorage(app)

// Enable offline persistence with multi-tab support. This must be called once,
// before any other Firestore call ideally, and only works in the browser.
// Falls back gracefully if unsupported (private browsing / multiple tabs edge cases).
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open without multi-tab support, or another persistence
    // instance already claimed the lock. Data will still work, just without
    // cross-tab offline sync in this tab.
    console.warn('[firebase] Offline persistence unavailable: multiple tabs open.')
  } else if (err.code === 'unimplemented') {
    console.warn('[firebase] Offline persistence unavailable: browser does not support it.')
  } else {
    console.error('[firebase] Offline persistence failed to initialize:', err)
  }
})

export default app
