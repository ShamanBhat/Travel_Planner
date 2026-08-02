// src/components/dashboard/CreateTripModal.jsx
import React, { useEffect, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Loader2, MapPin, Search } from 'lucide-react'
import Modal from '../common/Modal'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { generateTripCode } from '../../utils/tripCode'
import { geocodeDestination } from '../../utils/weather'
import { ROLES } from '../../utils/rbac'

export default function CreateTripModal({ open, onClose, onCreated }) {
  const { currentUser } = useAuth()
  const [tripName, setTripName] = useState('')
  const [destination, setDestination] = useState('')
  const [destCoords, setDestCoords] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setTripName('')
      setDestination('')
      setDestCoords(null)
      setSuggestions([])
      setStartDate('')
      setEndDate('')
      setError('')
    }
  }, [open])

  useEffect(() => {
    if (!destination || destCoords) return
    const handle = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await geocodeDestination(destination)
        setSuggestions(results)
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => clearTimeout(handle)
  }, [destination, destCoords])

  function pickSuggestion(s) {
    setDestination(s.label)
    setDestCoords({ lat: s.latitude, lng: s.longitude })
    setSuggestions([])
  }

  async function handleSave() {
    setError('')
    if (!tripName.trim() || !destination.trim() || !startDate || !endDate) {
      setError('Please fill in trip name, destination, and both dates.')
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after the start date.')
      return
    }
    setSaving(true)
    try {
      const docRef = await addDoc(collection(db, 'trips'), {
        tripName: tripName.trim(),
        destination: destination.trim(),
        destCoords: destCoords || null,
        coverPhotoUrl: null,
        tripCode: generateTripCode(),
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        startDate,
        endDate,
        members: {
          [currentUser.uid]: {
            role: ROLES.ADMIN,
            status: 'approved',
            displayName: currentUser.displayName || currentUser.email,
            email: currentUser.email,
            photoURL: currentUser.photoURL || null,
            joinedAt: new Date().toISOString(),
          },
        },
      })
      onCreated?.(docRef.id)
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
      title="Create a new trip"
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
            Create trip
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
          <label className="block text-xs font-medium text-app-muted mb-1">Trip name</label>
          <input
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            placeholder="Everest Base Camp Trek"
            className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary/40"
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
              placeholder="Search a place..."
              className="w-full rounded-lg border border-app-border bg-app-bg pl-8 pr-3 py-2 text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary/40"
            />
          </div>
          {searching && <p className="text-xs text-app-muted mt-1">Searching...</p>}
          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-app-surface border border-app-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickSuggestion(s)}
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
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary/40"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
