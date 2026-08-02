// src/components/maps/AddPinModal.jsx
import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from '../common/Modal'

const CATEGORIES = ['Campsite', 'Water Source', 'Trailhead', 'Viewpoint', 'Hazard', 'Other']

export default function AddPinModal({ open, onClose, onSave, pin }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Campsite')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(pin?.name || '')
    setCategory(pin?.category || 'Campsite')
    setLatitude(pin?.latitude ?? '')
    setLongitude(pin?.longitude ?? '')
    setNotes(pin?.notes || '')
    setError('')
  }, [open, pin])

  async function handleSave() {
    setError('')
    const lat = Number(latitude)
    const lng = Number(longitude)
    if (!name.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Enter a name and valid GPS coordinates.')
      return
    }
    setSaving(true)
    try {
      await onSave({
        id: pin?.id || `pin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        category,
        latitude: lat,
        longitude: lng,
        notes: notes.trim(),
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={pin ? 'Edit GPS pin' : 'Add GPS pin'}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-app-border text-app-text hover:bg-app-surfaceAlt transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-app-primary text-app-primaryText hover:brightness-110 transition disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {error && (
          <div className="text-sm text-app-danger bg-app-danger/10 border border-app-danger/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-app-muted mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            placeholder="Base Camp"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-app-muted mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Latitude</label>
            <input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
              placeholder="27.9881"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Longitude</label>
            <input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
              placeholder="86.9250"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-app-muted mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            placeholder="Reliable water source, filter recommended"
          />
        </div>
      </div>
    </Modal>
  )
}
