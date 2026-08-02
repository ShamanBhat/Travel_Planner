// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setCurrentUser(null)
      setAuthLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  // Upsert a lightweight user profile doc, used for lookups / denormalized display data.
  async function upsertUserDoc(user) {
    if (!user || !db) return
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Traveler',
        photoURL: user.photoURL || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  }

  async function signup(email, password, displayName) {
    if (!auth) {
      throw new Error('Firebase is not configured yet.')
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(cred.user, { displayName })
    }
    await upsertUserDoc({ ...cred.user, displayName: displayName || cred.user.displayName })
    return cred.user
  }

  async function login(email, password) {
    if (!auth) {
      throw new Error('Firebase is not configured yet.')
    }

    const cred = await signInWithEmailAndPassword(auth, email, password)
    await upsertUserDoc(cred.user)
    return cred.user
  }

  async function loginWithGoogle() {
    if (!auth || !googleProvider) {
      throw new Error('Firebase is not configured yet.')
    }

    const cred = await signInWithPopup(auth, googleProvider)
    await upsertUserDoc(cred.user)
    return cred.user
  }

  function logout() {
    if (!auth) return Promise.resolve()
    return signOut(auth)
  }

  const value = { currentUser, authLoading, signup, login, loginWithGoogle, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
