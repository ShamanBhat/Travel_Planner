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
import { collection, doc, getDocs, query, setDoc, serverTimestamp, where } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

const AuthContext = createContext(null)

export function getPreferredDisplayName(user) {
  return (
    user?.displayName ||
    user?.providerData?.find((profile) => profile.displayName)?.displayName ||
    user?.email?.split('@')[0] ||
    'Traveler'
  )
}

export function getPreferredEmail(user) {
  return user?.email || user?.providerData?.find((profile) => profile.email)?.email || ''
}

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
      if (user) {
        void upsertUserDoc(user)
      }
    })
    return unsubscribe
  }, [])

  // Upsert a lightweight user profile doc, used for lookups / denormalized display data.
  async function upsertUserDoc(user) {
    if (!user || !db) return

    const profile = {
      uid: user.uid,
      email: getPreferredEmail(user),
      displayName: getPreferredDisplayName(user),
      photoURL: user.photoURL || null,
      updatedAt: serverTimestamp(),
    }

    await setDoc(doc(db, 'users', user.uid), profile, { merge: true })

    const tripsRef = collection(db, 'trips')
    const memberTripsQuery = query(tripsRef, where(`members.${user.uid}.status`, 'in', ['approved', 'pending']))
    const tripsSnap = await getDocs(memberTripsQuery)

    await Promise.all(
      tripsSnap.docs.map((tripDoc) =>
        setDoc(
          doc(db, 'trips', tripDoc.id),
          {
            [`members.${user.uid}`]: {
              ...(tripDoc.data().members?.[user.uid] || {}),
              ...profile,
              joinedAt: tripDoc.data().members?.[user.uid]?.joinedAt || new Date().toISOString(),
            },
          },
          { merge: true }
        )
      )
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
