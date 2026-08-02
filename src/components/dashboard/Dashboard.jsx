// src/components/dashboard/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import { Plus, KeyRound, MapPin, Calendar, Clock3, Mail, Check, X } from 'lucide-react'
import { db } from '../../firebase'
import { getPreferredDisplayName, getPreferredEmail, useAuth } from '../../context/AuthContext'
import NavBar from '../layout/NavBar'
import CreateTripModal from './CreateTripModal'
import JoinTripModal from './JoinTripModal'
import EmptyState from '../common/EmptyState'
import RoleBadge from '../common/RoleBadge'
import { ROLES } from '../../utils/rbac'

export default function Dashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [invites, setInvites] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    const q = query(
      collection(db, 'trips'),
      where(`members.${currentUser.uid}.status`, 'in', ['approved', 'pending'])
    )
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      rows.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
      setTrips(rows)
      setLoading(false)
    })
    return unsub
  }, [currentUser])

  useEffect(() => {
    if (!currentUser?.email) return
    const q = query(
      collection(db, 'invites'),
      where('email', '==', currentUser.email.toLowerCase()),
      where('status', '==', 'pending')
    )
    const unsub = onSnapshot(q, (snap) => {
      setInvites(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [currentUser])

  async function acceptInvite(invite) {
    await updateDoc(doc(db, 'trips', invite.tripId), {
      [`members.${currentUser.uid}`]: {
        role: invite.role || ROLES.VIEWER,
        status: 'approved',
        displayName: getPreferredDisplayName(currentUser),
        email: getPreferredEmail(currentUser),
        photoURL: currentUser.photoURL || null,
        joinedAt: new Date().toISOString(),
      },
    })
    await deleteDoc(doc(db, 'invites', invite.id))
  }

  async function declineInvite(invite) {
    await deleteDoc(doc(db, 'invites', invite.id))
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {invites.length > 0 && (
          <div className="mb-6 space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-app-accent/30 bg-app-accent/10 px-4 py-3"
              >
                <div className="flex items-center gap-2 text-sm text-app-text">
                  <Mail size={16} className="text-app-accent shrink-0" />
                  <span>
                    You&apos;ve been invited to <strong>{invite.tripName}</strong> as{' '}
                    <RoleBadge role={invite.role} />
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => acceptInvite(invite)}
                    className="p-1.5 rounded-full bg-app-primary text-app-primaryText hover:brightness-110"
                    title="Accept"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => declineInvite(invite)}
                    className="p-1.5 rounded-full border border-app-border text-app-muted hover:bg-app-surfaceAlt"
                    title="Decline"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-semibold text-app-text">Your trips</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setJoinOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-app-border text-sm font-medium text-app-text hover:bg-app-surfaceAlt transition"
            >
              <KeyRound size={15} /> Join with code
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-app-primary text-app-primaryText text-sm font-medium hover:brightness-110 transition"
            >
              <Plus size={15} /> New trip
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-app-muted">Loading trips...</p>
        ) : trips.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No trips yet"
            subtitle="Create a new trip or join one using a 6-character trip code from your group admin."
            action={
              <button
                onClick={() => setCreateOpen(true)}
                className="px-4 py-2 rounded-lg bg-app-primary text-app-primaryText text-sm font-medium hover:brightness-110"
              >
                Create your first trip
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip) => {
              const membership = trip.members?.[currentUser.uid]
              const pending = membership?.status === 'pending'
              return (
                <button
                  key={trip.id}
                  onClick={() => !pending && navigate(`/trip/${trip.id}/overview`)}
                  disabled={pending}
                  className={`text-left rounded-2xl border border-app-border bg-app-surface overflow-hidden hover:shadow-md transition ${
                    pending ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="h-28 bg-app-surfaceAlt relative">
                    {trip.coverPhotoUrl ? (
                      <img src={trip.coverPhotoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-app-muted">
                        <MapPin size={26} />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {pending ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium bg-app-warn/90 text-white px-2 py-0.5 rounded-full">
                          <Clock3 size={11} /> Pending
                        </span>
                      ) : (
                        <RoleBadge role={membership?.role} />
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-app-text truncate">{trip.tripName}</h3>
                    <p className="text-sm text-app-muted flex items-center gap-1 mt-1 truncate">
                      <MapPin size={13} /> {trip.destination}
                    </p>
                    <p className="text-xs text-app-muted flex items-center gap-1 mt-1">
                      <Calendar size={12} /> {trip.startDate} &rarr; {trip.endDate}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      <CreateTripModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => navigate(`/trip/${id}/overview`)}
      />
      <JoinTripModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  )
}
