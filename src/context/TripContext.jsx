// src/context/TripContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { useParams } from 'react-router-dom'
import { db } from '../firebase'
import { useAuth } from './AuthContext'
import { ROLES } from '../utils/rbac'

const TripContext = createContext(null)

export function TripProvider({ children }) {
  const { tripId } = useParams()
  const { currentUser } = useAuth()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!tripId) return
    if (!db) {
      setError('Firebase is not configured yet.')
      setLoading(false)
      return
    }

    setLoading(true)
    // Single onSnapshot listener for the trip "shell" doc (name, dates, members,
    // cover photo, trip code). Module data (logistics/itinerary/etc.) is
    // subscribed to independently by the tab that is actually visible, per the
    // cost-optimization guidance of only listening to what's on screen.
    const unsub = onSnapshot(
      doc(db, 'trips', tripId),
      (snap) => {
        if (!snap.exists()) {
          setError('Trip not found.')
          setTrip(null)
        } else {
          setTrip({ id: snap.id, ...snap.data() })
          setError(null)
        }
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )
    return unsub
  }, [tripId])

  const membership = trip?.members?.[currentUser?.uid]
  const role = membership?.status === 'approved' ? membership.role : null
  const isPendingApproval = membership?.status === 'pending'

  const members = useMemo(() => {
    if (!trip?.members) return []
    return Object.entries(trip.members).map(([uid, m]) => ({ uid, ...m }))
  }, [trip])

  const approvedMembers = useMemo(
    () => members.filter((m) => m.status === 'approved'),
    [members]
  )
  const pendingMembers = useMemo(() => members.filter((m) => m.status === 'pending'), [members])

  const value = {
    tripId,
    trip,
    loading,
    error,
    role: role || ROLES.VIEWER,
    isMember: !!membership,
    isApproved: membership?.status === 'approved',
    isPendingApproval,
    members,
    approvedMembers,
    pendingMembers,
  }

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

export function useTrip() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useTrip must be used within a TripProvider')
  return ctx
}
