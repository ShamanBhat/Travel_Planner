// src/components/packing/PackingLists.jsx
import React, { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { ListChecks } from 'lucide-react'
import { db } from '../../firebase'
import { useTrip } from '../../context/TripContext'
import { useAuth } from '../../context/AuthContext'
import { isEditor } from '../../utils/rbac'
import SharedPackingList from './SharedPackingList'
import PersonalPackingList from './PersonalPackingList'

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export default function PackingLists() {
  const { tripId, role } = useTrip()
  const { currentUser } = useAuth()
  const editable = isEditor(role)

  const [sharedItems, setSharedItems] = useState([])
  const [personalItems, setPersonalItems] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sharedRef = doc(db, 'trips', tripId, 'sharedPacking', 'main')
    const personalRef = doc(db, 'trips', tripId, 'personalPacking', currentUser.uid)

    // Two lightweight listeners, only active while this tab is mounted.
    const unsubShared = onSnapshot(sharedRef, (snap) => {
      setSharedItems(snap.exists() ? snap.data().items || [] : [])
      setLoading(false)
    })
    const unsubPersonal = onSnapshot(personalRef, (snap) => {
      setPersonalItems(snap.exists() ? snap.data().items || [] : [])
    })
    return () => {
      unsubShared()
      unsubPersonal()
    }
  }, [tripId, currentUser.uid])

  async function persistShared(items) {
    await setDoc(doc(db, 'trips', tripId, 'sharedPacking', 'main'), { items }, { merge: true })
  }
  async function persistPersonal(items) {
    await setDoc(doc(db, 'trips', tripId, 'personalPacking', currentUser.uid), { items }, { merge: true })
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function addSharedItem({ item, category }) {
    persistShared([...sharedItems, { id: newId('shared'), item, category, assignedToUid: null }])
  }
  function deleteSharedItem(target) {
    persistShared(sharedItems.filter((i) => i.id !== target.id))
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(target.id)
      return next
    })
  }

  function addPersonalItem(text) {
    persistPersonal([
      ...personalItems,
      { id: newId('personal'), item: text, category: 'Other', isPacked: false, importedFromShared: false },
    ])
  }
  function togglePersonalItem(target) {
    persistPersonal(
      personalItems.map((i) => (i.id === target.id ? { ...i, isPacked: !i.isPacked } : i))
    )
  }
  function deletePersonalItem(target) {
    persistPersonal(personalItems.filter((i) => i.id !== target.id))
  }

  function importSelected() {
    const existingNames = new Set(personalItems.map((i) => i.item.toLowerCase()))
    const toImport = sharedItems
      .filter((i) => selected.has(i.id) && !existingNames.has(i.item.toLowerCase()))
      .map((i) => ({
        id: newId('personal'),
        item: i.item,
        category: i.category,
        isPacked: false,
        importedFromShared: true,
      }))
    if (toImport.length > 0) {
      persistPersonal([...personalItems, ...toImport])
    }
    setSelected(new Set())
  }

  if (loading) {
    return <p className="text-sm text-app-muted">Loading packing lists...</p>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-app-text flex items-center gap-2">
        <ListChecks size={18} className="text-app-primary" /> Packing Checklists
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SharedPackingList
          items={sharedItems}
          editable={editable}
          selected={selected}
          onToggleSelect={toggleSelect}
          onAdd={addSharedItem}
          onDelete={deleteSharedItem}
        />
        <PersonalPackingList
          items={personalItems}
          onAdd={addPersonalItem}
          onToggle={togglePersonalItem}
          onDelete={deletePersonalItem}
          selectedSharedCount={selected.size}
          onImport={importSelected}
        />
      </div>
    </div>
  )
}
