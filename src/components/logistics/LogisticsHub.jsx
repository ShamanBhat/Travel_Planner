// src/components/logistics/LogisticsHub.jsx
import React, { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useSearchParams } from 'react-router-dom'
import { Plane, Plus, ScanLine } from 'lucide-react'
import { db } from '../../firebase'
import { useTrip } from '../../context/TripContext'
import { useAuth } from '../../context/AuthContext'
import { isEditor } from '../../utils/rbac'
import FlightCard from './FlightCard'
import FlightEditModal from './FlightEditModal'
import MyBoardingPassModal from './MyBoardingPassModal'
import ConfirmDialog from '../common/ConfirmDialog'
import EmptyState from '../common/EmptyState'

export default function LogisticsHub() {
  const { tripId, role } = useTrip()
  const { currentUser } = useAuth()
  const editable = isEditor(role)
  const [searchParams, setSearchParams] = useSearchParams()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState(undefined) // undefined = closed, null = create, object = edit
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showMyPass, setShowMyPass] = useState(false)

  useEffect(() => {
    // Single onSnapshot on the bundled logistics doc — one listener regardless
    // of how many flights/trains/stays are stored inside it.
    const ref = doc(db, 'trips', tripId, 'logistics', 'main')
    const unsub = onSnapshot(ref, (snap) => {
      setItems(snap.exists() ? snap.data().items || [] : [])
      setLoading(false)
    })
    return unsub
  }, [tripId])

  // Support a single-tap deep link from the Overview tab: /logistics?pass=1
  useEffect(() => {
    if (searchParams.get('pass') === '1') {
      setShowMyPass(true)
      searchParams.delete('pass')
      setSearchParams(searchParams, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function persistItems(newItems) {
    await setDoc(doc(db, 'trips', tripId, 'logistics', 'main'), { items: newItems }, { merge: true })
  }

  function handleSaveItem(finalItem) {
    const exists = items.some((i) => i.id === finalItem.id)
    const newItems = exists
      ? items.map((i) => (i.id === finalItem.id ? finalItem : i))
      : [...items, finalItem]
    newItems.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''))
    persistItems(newItems)
  }

  function handleDelete(item) {
    persistItems(items.filter((i) => i.id !== item.id))
    setDeleteTarget(null)
  }

  const myPasses = items
    .filter((i) => i.passengers?.some((p) => p.uid === currentUser.uid))
    .map((i) => ({ ...i, ...i.passengers.find((p) => p.uid === currentUser.uid) }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-app-text flex items-center gap-2">
          <Plane size={18} className="text-app-primary" /> Group Logistics
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMyPass(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-app-primary text-app-primaryText text-sm font-medium hover:brightness-110 transition"
          >
            <ScanLine size={15} /> My Boarding Pass
          </button>
          {editable && (
            <button
              onClick={() => setEditItem(null)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-app-border text-sm font-medium text-app-text hover:bg-app-surfaceAlt transition"
            >
              <Plus size={15} /> Add
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-app-muted">Loading logistics...</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="No logistics added yet"
          subtitle="Flights, trains, stays, and cabs will show up here once an admin or editor adds them."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => (
            <FlightCard
              key={item.id}
              item={item}
              onEdit={(i) => setEditItem(i)}
              onDelete={(i) => setDeleteTarget(i)}
            />
          ))}
        </div>
      )}

      <FlightEditModal
        open={editItem !== undefined}
        onClose={() => setEditItem(undefined)}
        item={editItem}
        onSave={handleSaveItem}
        tripId={tripId}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete logistics entry"
        message={`Delete "${deleteTarget?.provider}" ${deleteTarget?.flightNo || ''}? This cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget)}
      />

      <MyBoardingPassModal open={showMyPass} onClose={() => setShowMyPass(false)} passes={myPasses} />
    </div>
  )
}
