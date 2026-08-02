// src/components/trip/TripEditModal.jsx
import React, { useEffect, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { Loader2, MapPin, Search, ImagePlus } from 'lucide-react'
import Modal from '../common/Modal'
import { db } from '../../firebase'
import { uploadFile } from '../../utils/storage'
import { geocodeDestination } from '../../utils/weather'

export default function TripEditModal({ open, onClose, tripId, trip }) {
  const [tripName, setTripName] = useState('')
  const [destination, setDestination] = useState('')
  const [destCoords, setDestCoords] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [coverFile, setCoverFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !trip) return
    setTripName(trip.tripName || '')
    setDestination(trip.destination || '')
    setDestCoords(trip.destCoords || null)
    setStartDate(trip.startDate || '')
    setEndDate(trip.endDate || '')
    setCoverFile(null)
    setSuggestions([])
    setError('')
  }, [open, trip])

  useEffect(() => {
    if (!destination || destCoords) return
    const handle = setTimeout(async () => {
      try {
        setSuggestions(await geocodeDestination(destination))
      } catch {
        setSuggestions([])
      }
    }, 400)
    return () => clearTimeout(handle)
  }, [destination, destCoords])

  async function handleSave() {
    setError('')
    if (!tripName.trim() || !destination.trim() || !startDate || !endDate) {
      setError('Please fill in all required fields.')
      return
    }
    setSaving(true)
    try {
      let coverPhotoUrl = trip.coverPhotoUrl || null
      if (coverFile) {
        coverPhotoUrl = await uploadFile(`trips/${tripId}/cover/${Date.now()}-${coverFile.name}`, coverFile)
      }
      await updateDoc(doc(db, 'trips', tripId), {
        tripName: tripName.trim(),
        destination: destination.trim(),
        destCoords: destCoords || null,
        startDate,
        endDate,
        coverPhotoUrl,
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
      title="Edit trip details"
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
          <label className="block text-xs font-medium text-app-muted mb-1">Cover photo</label>
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-app-border text-sm text-app-muted cursor-pointer hover:bg-app-surfaceAlt">
            <ImagePlus size={15} />
            {coverFile ? coverFile.name : 'Choose an image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-app-muted mb-1">Trip name</label>
          <input
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
          />
        </div>

        <div className="relative">
          <label className="block text-xs font-medium text-app-muted mb-1">Destination</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value)
                setDestCoords(null)
              }}
              className="w-full rounded-lg border border-app-border bg-app-bg pl-8 pr-3 py-2 text-sm text-app-text"
            />
          </div>
          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-app-surface border border-app-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setDestination(s.label)
                    setDestCoords({ lat: s.latitude, lng: s.longitude })
                    setSuggestions([])
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-app-surfaceAlt flex items-center gap-2 text-app-text"
                >
                  <MapPin size={13} className="text-app-muted shrink-0" />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
