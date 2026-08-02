// src/components/dashboard/JoinTripModal.jsx
import React, { useState } from 'react'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { Loader2 } from 'lucide-react'
import Modal from '../common/Modal'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../utils/rbac'

export default function JoinTripModal({ open, onClose }) {
  const { currentUser } = useAuth()
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleClose() {
    setCode('')
    setError('')
    setSuccess('')
    onClose()
  }

  async function handleJoin() {
    setError('')
    setSuccess('')
    const clean = code.trim().toUpperCase()
    if (clean.length < 4) {
      setError('Enter the 6-character trip code.')
      return
    }
    setSaving(true)
    try {
      const q = query(collection(db, 'trips'), where('tripCode', '==', clean))
      const snap = await getDocs(q)
      if (snap.empty) {
        setError('No trip found with that code.')
        return
      }
      const tripDoc = snap.docs[0]
      const existing = tripDoc.data().members?.[currentUser.uid]
      if (existing) {
        setSuccess(
          existing.status === 'approved'
            ? "You're already a member of this trip."
            : 'Your join request is already pending approval.'
        )
        return
      }
      await updateDoc(doc(db, 'trips', tripDoc.id), {
        [`members.${currentUser.uid}`]: {
          role: ROLES.VIEWER,
          status: 'pending',
          displayName: currentUser.displayName || currentUser.email,
          email: currentUser.email,
          photoURL: currentUser.photoURL || null,
          joinedAt: new Date().toISOString(),
        },
      })
      setSuccess(`Request sent to join "${tripDoc.data().tripName}". Waiting for admin approval.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Join a trip"
      footer={
        <>
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-app-border text-app-text hover:bg-app-surfaceAlt transition"
          >
            Close
          </button>
          {!success && (
            <button
              onClick={handleJoin}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-app-primary text-app-primaryText hover:brightness-110 transition disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Request to join
            </button>
          )}
        </>
      }
    >
      <div className="space-y-3">
        {error && (
          <div className="text-sm text-app-danger bg-app-danger/10 border border-app-danger/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-app-primary bg-app-primary/10 border border-app-primary/30 rounded-lg px-3 py-2">
            {success}
          </div>
        )}
        {!success && (
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Trip code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="ABC123"
              className="w-full tracking-[0.3em] text-center font-mono text-lg rounded-lg border border-app-border bg-app-bg px-3 py-2.5 text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary/40"
            />
            <p className="text-xs text-app-muted mt-2">
              Ask the trip admin for the 6-character trip code. Your request will need approval
              before you can view trip details.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
