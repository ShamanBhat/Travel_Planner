// src/components/itinerary/Itinerary.jsx
import React, { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  orderBy,
  query,
} from 'firebase/firestore'
import { CalendarDays, Plus } from 'lucide-react'
import { db } from '../../firebase'
import { useTrip } from '../../context/TripContext'
import { useAuth } from '../../context/AuthContext'
import { isEditor } from '../../utils/rbac'
import DayCard from './DayCard'
import EmptyState from '../common/EmptyState'

function newItemId() {
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export default function Itinerary() {
  const { tripId, role } = useTrip()
  const { currentUser } = useAuth()
  const editable = isEditor(role)

  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [newDate, setNewDate] = useState('')

  useEffect(() => {
    // One listener for the itinerary subcollection. Each document represents
    // a single day, bundling all of that day's activities in one doc.
    const q = query(collection(db, 'trips', tripId, 'itinerary'), orderBy('dayDate'))
    const unsub = onSnapshot(q, (snap) => {
      setDays(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [tripId])

  async function addDay() {
    if (!newDate) return
    await setDoc(
      doc(db, 'trips', tripId, 'itinerary', newDate),
      { dayDate: newDate, items: [] },
      { merge: true }
    )
    setNewDate('')
  }

  async function deleteDay(dayId) {
    await deleteDoc(doc(db, 'trips', tripId, 'itinerary', dayId))
  }

  async function addItem(dayId, draft) {
    const day = days.find((d) => d.id === dayId)
    const items = [...(day?.items || []), { ...draft, id: newItemId(), createdBy: currentUser.uid }]
    await setDoc(doc(db, 'trips', tripId, 'itinerary', dayId), { dayDate: dayId, items }, { merge: true })
  }

  async function updateItem(dayId, patch) {
    const day = days.find((d) => d.id === dayId)
    const items = (day?.items || []).map((i) => (i.id === patch.id ? { ...i, ...patch } : i))
    await setDoc(doc(db, 'trips', tripId, 'itinerary', dayId), { dayDate: dayId, items }, { merge: true })
  }

  async function deleteItem(dayId, item) {
    const day = days.find((d) => d.id === dayId)
    const items = (day?.items || []).filter((i) => i.id !== item.id)
    await setDoc(doc(db, 'trips', tripId, 'itinerary', dayId), { dayDate: dayId, items }, { merge: true })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-app-text flex items-center gap-2">
          <CalendarDays size={18} className="text-app-primary" /> Day-wise Itinerary
        </h1>
        {editable && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="rounded-lg border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-text"
            />
            <button
              onClick={addDay}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-app-primary text-app-primaryText text-sm font-medium hover:brightness-110 transition"
            >
              <Plus size={15} /> Add day
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-app-muted">Loading itinerary...</p>
      ) : days.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No days planned yet"
          subtitle="Add your first day to start building a chronological schedule."
        />
      ) : (
        <div className="space-y-3">
          {days.map((day, idx) => (
            <DayCard
              key={day.id}
              day={day}
              dayNumber={idx + 1}
              editable={editable}
              onAddItem={addItem}
              onUpdateItem={updateItem}
              onDeleteItem={deleteItem}
              onDeleteDay={deleteDay}
            />
          ))}
        </div>
      )}
    </div>
  )
}
