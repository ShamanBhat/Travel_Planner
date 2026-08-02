// src/components/maps/TrailMaps.jsx
import React, { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { Map, Plus, Pencil, Link as LinkIcon, ExternalLink } from 'lucide-react'
import { db } from '../../firebase'
import { useTrip } from '../../context/TripContext'
import { isEditor } from '../../utils/rbac'
import PinList from './PinList'
import AddPinModal from './AddPinModal'
import ConfirmDialog from '../common/ConfirmDialog'
import EmptyState from '../common/EmptyState'

export default function TrailMaps() {
  const { tripId, role } = useTrip()
  const editable = isEditor(role)

  const [data, setData] = useState({ gpxUrl: '', customMapUrl: '', pins: [] })
  const [loading, setLoading] = useState(true)
  const [editingLinks, setEditingLinks] = useState(false)
  const [linkDraft, setLinkDraft] = useState({ gpxUrl: '', customMapUrl: '' })
  const [pinModal, setPinModal] = useState(undefined)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    const ref = doc(db, 'trips', tripId, 'maps', 'main')
    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.exists() ? snap.data() : {}
      setData({ gpxUrl: d.gpxUrl || '', customMapUrl: d.customMapUrl || '', pins: d.pins || [] })
      setLoading(false)
    })
    return unsub
  }, [tripId])

  async function persist(patch) {
    await setDoc(doc(db, 'trips', tripId, 'maps', 'main'), { ...data, ...patch }, { merge: true })
  }

  function startEditLinks() {
    setLinkDraft({ gpxUrl: data.gpxUrl, customMapUrl: data.customMapUrl })
    setEditingLinks(true)
  }
  function saveLinks() {
    persist(linkDraft)
    setEditingLinks(false)
  }

  function savePin(pin) {
    const exists = data.pins.some((p) => p.id === pin.id)
    const pins = exists ? data.pins.map((p) => (p.id === pin.id ? pin : p)) : [...data.pins, pin]
    persist({ pins })
  }
  function deletePin(pin) {
    persist({ pins: data.pins.filter((p) => p.id !== pin.id) })
    setDeleteTarget(null)
  }

  if (loading) return <p className="text-sm text-app-muted">Loading trail map...</p>

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-app-text flex items-center gap-2">
        <Map size={18} className="text-app-primary" /> Offline Trail Map & GPS Pins
      </h1>

      <div className="rounded-2xl border border-app-border bg-app-surface p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-app-text flex items-center gap-1.5">
            <LinkIcon size={14} /> Trail links
          </h2>
          {editable && !editingLinks && (
            <button
              onClick={startEditLinks}
              className="p-1.5 rounded-full text-app-muted hover:bg-app-surfaceAlt hover:text-app-text"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>

        {editingLinks ? (
          <div className="space-y-2">
            <input
              value={linkDraft.gpxUrl}
              onChange={(e) => setLinkDraft((d) => ({ ...d, gpxUrl: e.target.value }))}
              placeholder="GPX trail link (e.g. https://.../trail.gpx)"
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            />
            <input
              value={linkDraft.customMapUrl}
              onChange={(e) => setLinkDraft((d) => ({ ...d, customMapUrl: e.target.value }))}
              placeholder="Custom map embed link (e.g. Google My Maps URL)"
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingLinks(false)}
                className="px-3 py-1.5 rounded-lg border border-app-border text-xs text-app-text hover:bg-app-surfaceAlt"
              >
                Cancel
              </button>
              <button
                onClick={saveLinks}
                className="px-3 py-1.5 rounded-lg bg-app-primary text-app-primaryText text-xs hover:brightness-110"
              >
                Save
              </button>
            </div>
          </div>
        ) : !data.gpxUrl && !data.customMapUrl ? (
          <p className="text-xs text-app-muted italic">No trail links added yet.</p>
        ) : (
          <div className="space-y-1.5">
            {data.gpxUrl && (
              <a
                href={data.gpxUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-app-primary hover:underline"
              >
                <ExternalLink size={13} /> GPX trail file
              </a>
            )}
            {data.customMapUrl && (
              <a
                href={data.customMapUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-app-primary hover:underline"
              >
                <ExternalLink size={13} /> Custom map
              </a>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-app-border bg-app-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-app-text">GPS pins</h2>
          {editable && (
            <button
              onClick={() => setPinModal(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-app-border text-xs font-medium text-app-text hover:bg-app-surfaceAlt transition"
            >
              <Plus size={13} /> Add pin
            </button>
          )}
        </div>
        {data.pins.length === 0 ? (
          <EmptyState icon={Map} title="No pins logged" subtitle="Campsites, water sources, and trailheads will appear here." />
        ) : (
          <PinList
            pins={data.pins}
            editable={editable}
            onEdit={(p) => setPinModal(p)}
            onDelete={(p) => setDeleteTarget(p)}
          />
        )}
      </div>

      <AddPinModal
        open={pinModal !== undefined}
        onClose={() => setPinModal(undefined)}
        pin={pinModal}
        onSave={savePin}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete pin"
        message={`Delete "${deleteTarget?.name}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deletePin(deleteTarget)}
      />
    </div>
  )
}
