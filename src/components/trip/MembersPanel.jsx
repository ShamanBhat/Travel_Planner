// src/components/trip/MembersPanel.jsx
import React, { useState } from 'react'
import { doc, updateDoc, deleteField, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Check, X, Trash2, Copy, Mail, Loader2, ShieldCheck } from 'lucide-react'
import { db } from '../../firebase'
import { useTrip } from '../../context/TripContext'
import { useAuth } from '../../context/AuthContext'
import RoleBadge from '../common/RoleBadge'
import ConfirmDialog from '../common/ConfirmDialog'
import { ROLES, isAdmin } from '../../utils/rbac'

export default function MembersPanel() {
  const { tripId, trip, role, approvedMembers, pendingMembers } = useTrip()
  const { currentUser } = useAuth()
  const admin = isAdmin(role)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState(ROLES.VIEWER)
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)

  async function approve(uid) {
    await updateDoc(doc(db, 'trips', tripId), { [`members.${uid}.status`]: 'approved' })
  }

  async function reject(uid) {
    await updateDoc(doc(db, 'trips', tripId), { [`members.${uid}`]: deleteField() })
  }

  async function changeRole(uid, newRole) {
    await updateDoc(doc(db, 'trips', tripId), { [`members.${uid}.role`]: newRole })
  }

  async function removeMember(uid) {
    await updateDoc(doc(db, 'trips', tripId), { [`members.${uid}`]: deleteField() })
    setRemoveTarget(null)
  }

  async function sendInvite(e) {
    e.preventDefault()
    setInviteMsg('')
    const email = inviteEmail.trim().toLowerCase()
    if (!email.includes('@')) return
    setInviting(true)
    try {
      await addDoc(collection(db, 'invites'), {
        tripId,
        tripName: trip.tripName,
        email,
        role: inviteRole,
        invitedBy: currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setInviteMsg(`Invitation sent to ${email}.`)
      setInviteEmail('')
    } catch (err) {
      setInviteMsg(err.message)
    } finally {
      setInviting(false)
    }
  }

  function copyCode() {
    navigator.clipboard?.writeText(trip.tripCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {admin && (
        <section className="rounded-2xl border border-app-border bg-app-surface p-4">
          <h2 className="text-sm font-semibold text-app-text mb-2">Trip code</h2>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg tracking-[0.3em] px-3 py-1.5 rounded-lg bg-app-surfaceAlt text-app-text">
              {trip.tripCode}
            </span>
            <button
              onClick={copyCode}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-app-border text-app-muted hover:bg-app-surfaceAlt"
            >
              <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-app-muted mt-2">
            Share this code so travelers can request to join. You'll approve requests below.
          </p>
        </section>
      )}

      {admin && pendingMembers.length > 0 && (
        <section className="rounded-2xl border border-app-warn/30 bg-app-warn/10 p-4">
          <h2 className="text-sm font-semibold text-app-text mb-3">
            Pending join requests ({pendingMembers.length})
          </h2>
          <ul className="space-y-2">
            {pendingMembers.map((m) => (
              <li key={m.uid} className="flex items-center justify-between gap-2 bg-app-surface rounded-lg px-3 py-2 border border-app-border">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-app-text truncate">{m.displayName || m.email || 'Traveler'}</p>
                  <p className="text-xs text-app-muted truncate">{m.email || 'No email available'}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => approve(m.uid)}
                    className="p-1.5 rounded-full bg-app-primary text-app-primaryText hover:brightness-110"
                    title="Approve"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => reject(m.uid)}
                    className="p-1.5 rounded-full border border-app-border text-app-danger hover:bg-app-surfaceAlt"
                    title="Reject"
                  >
                    <X size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {admin && (
        <section className="rounded-2xl border border-app-border bg-app-surface p-4">
          <h2 className="text-sm font-semibold text-app-text mb-3 flex items-center gap-1.5">
            <Mail size={15} /> Invite by email
          </h2>
          <form onSubmit={sendInvite} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="traveler@example.com"
              className="flex-1 rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary/40"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            >
              <option value={ROLES.VIEWER}>Viewer</option>
              <option value={ROLES.EDITOR}>Editor</option>
              <option value={ROLES.ADMIN}>Admin</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-app-primary text-app-primaryText text-sm font-medium hover:brightness-110 disabled:opacity-60"
            >
              {inviting && <Loader2 size={14} className="animate-spin" />} Invite
            </button>
          </form>
          {inviteMsg && <p className="text-xs text-app-muted mt-2">{inviteMsg}</p>}
        </section>
      )}

      <section className="rounded-2xl border border-app-border bg-app-surface p-4">
        <h2 className="text-sm font-semibold text-app-text mb-3">
          Members ({approvedMembers.length})
        </h2>
        <ul className="space-y-2">
          {approvedMembers.map((m) => (
            <li
              key={m.uid}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-app-border"
            >
              <div className="flex items-center gap-2 min-w-0">
                {m.photoURL ? (
                  <img src={m.photoURL} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-app-primary/20 text-app-primary flex items-center justify-center text-xs font-semibold shrink-0">
                    {(m.displayName || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-app-text truncate flex items-center gap-1.5">
                    {m.displayName || m.email || 'Traveler'}
                    {m.uid === trip.createdBy && (
                      <ShieldCheck size={12} className="text-app-primary" title="Trip creator" />
                    )}
                  </p>
                  <p className="text-xs text-app-muted truncate">{m.email || 'No email available'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {admin && m.uid !== currentUser.uid ? (
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m.uid, e.target.value)}
                    className="text-xs rounded-lg border border-app-border bg-app-bg px-2 py-1 text-app-text"
                  >
                    <option value={ROLES.VIEWER}>Viewer</option>
                    <option value={ROLES.EDITOR}>Editor</option>
                    <option value={ROLES.ADMIN}>Admin</option>
                  </select>
                ) : (
                  <RoleBadge role={m.role} />
                )}
                {admin && m.uid !== currentUser.uid && (
                  <button
                    onClick={() => setRemoveTarget(m)}
                    className="p-1.5 rounded-full text-app-danger hover:bg-app-danger/10"
                    title="Remove member"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove member"
        message={`Remove ${removeTarget?.displayName} from this trip? They will lose access immediately.`}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => removeMember(removeTarget.uid)}
      />
    </div>
  )
}
